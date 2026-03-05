import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { ArrowLeft, Clock, MapPin, CheckCircle } from "lucide-react";

export default function CategoryView() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const { categories } = useCategories();

  const category = useMemo(() => {
    return categories.find(
      (c) => c.name.toLowerCase() === categoryName?.toLowerCase()
    );
  }, [categories, categoryName]);

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['category-tasks', categoryName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`category.eq.${category?.name},category.eq.${category?.name?.toLowerCase()}`)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!category?.name,
  });

  const toggleComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    refetch();
    // Fire event so other components refresh if needed
    window.dispatchEvent(new Event('task-added'));
  };

  const renderTaskList = (filteredTasks: any[]) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card shadow-sm rounded-[24px] p-5 h-[80px] animate-pulse"></div>
          ))}
        </div>
      );
    }

    if (filteredTasks.length === 0) {
      return (
        <div className="bg-white shadow-sm rounded-[24px] p-8 text-center flex flex-col items-center justify-center min-h-[160px] animate-fade-in">
          <p className="text-sm font-medium text-foreground">Nenhuma tarefa encontrada.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 pb-8">
        {filteredTasks.map((task: any, idx: number) => {
          const isDone = task.status === 'completed';
          const catColor = category?.color || '#000000';

          return (
            <div 
              key={task.id} 
              style={{ animationDelay: `${idx * 40}ms` }}
              className={`bg-white shadow-card border-0 rounded-[24px] p-5 flex items-start gap-4 transition-all animate-fade-in ${
                isDone ? 'opacity-50 grayscale-[0.3]' : 'hover:shadow-card-hover hover:-translate-y-0.5'
              }`}
            >
              <button
                onClick={() => toggleComplete(task.id, task.status)}
                className={`flex-shrink-0 h-6 w-6 mt-0.5 rounded-full border-[2px] flex items-center justify-center transition-all duration-300 ${
                  isDone
                    ? 'border-emerald-500 bg-emerald-500 text-white scale-110 shadow-sm'
                    : 'border-muted-foreground/30 hover:border-emerald-400 hover:scale-110'
                }`}
              >
                {isDone && <CheckCircle className="h-4 w-4" />}
              </button>

              <div className="flex-1 min-w-0 flex justify-between items-start gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <p className={`font-semibold text-base leading-tight truncate text-foreground ${isDone ? 'line-through' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                    <span>
                      {task.start_time ? new Date(task.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sem horário'}
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
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const pendingTasks = tasks.filter((t: any) => t.status !== 'completed');
  const completedTasks = tasks.filter((t: any) => t.status === 'completed');

  const tabs = [
    {
      id: "pendentes",
      label: `Pendentes (${pendingTasks.length})`,
      content: renderTaskList(pendingTasks),
    },
    {
      id: "concluidas",
      label: `Concluídas (${completedTasks.length})`,
      content: renderTaskList(completedTasks),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 w-full glass-header border-b border-border/40">
        <div className="container flex h-14 max-w-lg items-center px-4 mx-auto gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {category && (
              <div 
                className="w-8 h-8 flex items-center justify-center rounded-xl shadow-sm text-lg"
                style={{ backgroundColor: `${category.color}15` }}
              >
                {category.emoji}
              </div>
            )}
            <h1 className="font-semibold text-base tracking-tight capitalize">
              {category?.name || categoryName}
            </h1>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pt-6 animate-page-in">
        <AnimatedTabs tabs={tabs} defaultTab="pendentes" />
      </main>
    </div>
  );
}
