import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCategories } from "@/hooks/useCategories";
import { TaskEditSheet } from "./TaskEditSheet";
import { useQuery } from "@tanstack/react-query";
import { MapPin, CheckCircle } from "lucide-react";

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
  const { categories } = useCategories();

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
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sua Agenda
          </h3>
          <span className="text-xs font-medium text-muted-foreground bg-secondary/60 px-2 py-1 rounded-full">
            {format(new Date(), "EEEE, d 'de' MMM", { locale: ptBR })}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card shadow-sm rounded-[24px] p-5 h-[80px] animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-6 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 bg-muted rounded" />
                    <div className="h-2 w-1/3 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white shadow-sm rounded-[24px] p-8 text-center border-0 flex flex-col items-center justify-center min-h-[160px]">
            <p className="text-sm font-medium text-foreground">Sua agenda está vazia hoje</p>
            <p className="text-xs text-muted-foreground mt-1">Toque no + para adicionar uma tarefa</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-foreground/70 tracking-wide">{group.label}</p>
              
              <div className="space-y-3">
                {group.tasks.map((task: any, idx: number) => {
                  const categoryObj = categories.find(c => c.name === task.category || c.name.toLowerCase() === task.category) || categories[0];
                  const catColor = categoryObj?.color || '#000000';
                  const catLabel = categoryObj?.name || 'Sem Categoria';
                  const isDone = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      style={{ animationDelay: `${idx * 40}ms` }}
                      className={`bg-white shadow-card border-0 rounded-[24px] p-5 flex items-start gap-4 tap-bounce cursor-pointer
                        transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5
                        animate-fade-in ${isDone ? 'opacity-40 grayscale-[0.5]' : ''}`}
                    >
                      {/* Complete toggle - Larger for premium feel */}
                      <button
                        onClick={(e) => handleToggleComplete(e, task.id, task.status)}
                        className={`flex-shrink-0 h-6 w-6 mt-0.5 rounded-full border-[2px] flex items-center justify-center transition-all duration-300 ${
                          isDone
                            ? 'border-emerald-500 bg-emerald-500 text-white scale-110 shadow-sm'
                            : 'border-muted-foreground/30 hover:border-emerald-400 hover:scale-110'
                        }`}
                      >
                        {isDone && <CheckCircle className="h-4 w-4" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex justify-between items-start gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <p className={`font-semibold text-base leading-tight truncate text-foreground ${isDone ? 'line-through' : ''}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                            <span>
                              {new Date(task.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {task.estimated_duration_minutes && (
                              <span>· {task.estimated_duration_minutes}m</span>
                            )}
                            {task.location && (
                              <span className="flex items-center gap-0.5 max-w-[100px] truncate">
                                <span className="mx-1">·</span>
                                <MapPin className="h-[10px] w-[10px]" />
                                {task.location}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Minimalist Category Pill */}
                        <div className="flex-shrink-0 flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-full">
                          <div className="h-2 w-2 rounded-full shadow-sm" style={{ backgroundColor: catColor }} />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">{catLabel}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
