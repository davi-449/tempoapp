import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { MapPin, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TaskEditSheet } from "./TaskEditSheet";

type TaskCategory = 'trabalho' | 'faculdade' | 'pessoal' | 'treino';

const CAT_STYLES: Record<string, { border: string; badge: string; label: string }> = {
  trabalho: { border: 'border-l-blue-500', badge: 'cat-trabalho', label: 'Trabalho' },
  faculdade: { border: 'border-l-purple-500', badge: 'cat-faculdade', label: 'Faculdade' },
  pessoal: { border: 'border-l-emerald-500', badge: 'cat-pessoal', label: 'Pessoal' },
  treino: { border: 'border-l-orange-500', badge: 'cat-treino', label: 'Treino' },
};

function groupByPeriod(tasks: any[]) {
  const groups: { label: string; tasks: any[] }[] = [
    { label: '🌅 Manhã', tasks: [] },
    { label: '☀️ Tarde', tasks: [] },
    { label: '🌙 Noite', tasks: [] },
  ];

  tasks.forEach((t) => {
    if (!t.start_time) return;
    const h = new Date(t.start_time).getHours();
    if (h < 12) groups[0].tasks.push(t);
    else if (h < 18) groups[1].tasks.push(t);
    else groups[2].tasks.push(t);
  });

  return groups.filter((g) => g.tasks.length > 0);
}

export const Timeline = () => {
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['timeline-tasks'],
    queryFn: async () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('start_time', start)
        .lt('start_time', end)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  React.useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('task-added', handler);
    return () => window.removeEventListener('task-added', handler);
  }, [refetch]);

  const groups = groupByPeriod(tasks);

  const handleToggleComplete = async (e: React.MouseEvent, taskId: string, currentStatus: string) => {
    e.stopPropagation(); // Don't open edit sheet
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    refetch();
  };

  const handleTaskClick = (task: any) => {
    setEditingTask(task);
    setEditOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Agenda de Hoje
          </h3>
          <span className="text-xs text-muted-foreground">
            {format(new Date(), "EEEE, d MMM", { locale: ptBR })}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card shadow-card border rounded-2xl p-4 h-[72px] animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 bg-muted rounded" />
                    <div className="h-2 w-1/3 bg-muted rounded" />
                  </div>
                  <div className="h-5 w-16 bg-muted rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-card shadow-card border rounded-2xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Sua agenda está vazia hoje</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Toque no + para adicionar uma tarefa</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{group.label}</p>
              {group.tasks.map((task: any, idx: number) => {
                const style = CAT_STYLES[task.category] || CAT_STYLES.pessoal;
                const isDone = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    style={{ animationDelay: `${idx * 50}ms` }}
                    className={`bg-card shadow-card border rounded-2xl p-4 border-l-4 ${style.border} flex items-center gap-3 tap-bounce cursor-pointer
                      transition-all duration-200 hover:shadow-card-hover hover:scale-[1.01]
                      animate-fade-in ${isDone ? 'opacity-50' : ''}`}
                  >
                    {/* Complete toggle */}
                    <button
                      onClick={(e) => handleToggleComplete(e, task.id, task.status)}
                      className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-white scale-110'
                          : 'border-muted-foreground/30 hover:border-emerald-400 hover:scale-110'
                      }`}
                    >
                      {isDone && <CheckCircle className="h-3 w-3" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className={`font-medium text-sm truncate ${isDone ? 'line-through' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(task.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {task.estimated_duration_minutes && (
                          <span>· {task.estimated_duration_minutes} min</span>
                        )}
                        {task.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {task.location.length > 15 ? task.location.substring(0, 15) + '...' : task.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category Badge */}
                    <Badge variant="secondary" className={`${style.badge} border text-[10px] capitalize flex-shrink-0`}>
                      {style.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <TaskEditSheet
        task={editingTask}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => { refetch(); window.dispatchEvent(new Event('task-added')); }}
      />
    </>
  );
};
