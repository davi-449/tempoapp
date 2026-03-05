import React from "react";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { LayoutDashboard, CheckCircle, MapPin } from "lucide-react";
import { DynamicOnboarding } from "@/features/categories/DynamicOnboarding";
import { Category } from "@/types/data";

export default function CategoriesHub() {
  const { categories } = useCategories();

  // Fetch all tasks generic for the Hub
  const { data: allTasks = [], isLoading, refetch } = useQuery({
    queryKey: ['hub-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  const toggleComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    refetch();
    window.dispatchEvent(new Event('task-added'));
  };

  const renderTaskList = (filteredTasks: any[], catColor: string = '#000') => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card shadow-sm rounded-[24px] p-5 h-[80px] animate-pulse"></div>
          ))}
        </div>
      );
    }

    if (filteredTasks.length === 0) {
      return (
        <div className="bg-white shadow-sm rounded-[24px] p-8 text-center flex flex-col items-center justify-center min-h-[160px] animate-fade-in">
           <p className="text-sm font-medium text-foreground">Ainda não há tarefas pra cá.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 pb-8">
        {filteredTasks.map((task: any, idx: number) => {
          const isDone = task.status === 'completed';

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
                      {task.start_time ? new Date(task.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'S/ hora'}
                    </span>
                    {task.estimated_duration_minutes && (
                      <span>· {task.estimated_duration_minutes}m</span>
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

  const renderCategoryContent = (category: Category) => {
    const isConfigured = (category as any).settings?.isConfigured;

    if (!isConfigured) {
       return (
         <div className="h-[65vh]">
           <DynamicOnboarding category={category} onComplete={() => refetch()} />
         </div>
       );
    }

    // Se estiver configurado, mostra a tasklist respectiva.
    // Filtering by name lowercase
    const categoryTasks = allTasks.filter((t: any) => 
       t.category?.toLowerCase() === category.name.toLowerCase()
    );

    const pending = categoryTasks.filter((t: any) => t.status !== 'completed');
    const completed = categoryTasks.filter((t: any) => t.status === 'completed');

    return (
      <div className="space-y-6 animate-fade-in pt-4">
         <div className="flex bg-white shadow-sm p-4 rounded-3xl gap-4 items-center mb-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${category.color}15` }}>
              {category.emoji}
            </div>
            <div>
               <h3 className="font-bold text-lg text-balance">Meu Hub de {category.name}</h3>
               <p className="text-sm text-muted-foreground">
                  {(category as any).settings?.goal || 'Você já domina essa categoria.'}
               </p>
            </div>
         </div>
         
         <div className="space-y-2">
            <h4 className="text-sm font-semibold ml-2 text-foreground/70">A Fazer ({pending.length})</h4>
            {renderTaskList(pending, category.color)}
         </div>
         
         {completed.length > 0 && (
           <div className="space-y-2 opacity-80 mt-6">
              <h4 className="text-sm font-semibold ml-2 text-foreground/70">Concluídas ({completed.length})</h4>
              {renderTaskList(completed, category.color)}
           </div>
         )}
      </div>
    );
  };

  // Base Tabs
  const tabs = [
    {
      id: "geral",
      label: "Todos",
      content: (
        <div className="space-y-6 pt-4">
          <p className="text-sm text-muted-foreground px-2">Visão consolidada de tarefas recentes.</p>
          {renderTaskList(allTasks.slice(0, 15))}
        </div>
      )
    },
    // Map existing categories to Tabs
    ...categories.map((cat: any) => ({
       id: cat.id,
       label: cat.name,
       content: renderCategoryContent(cat as Category)
    }))
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-30 w-full glass-header border-b border-border/40">
        <div className="container flex h-14 max-w-lg items-center px-4 mx-auto gap-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <h1 className="font-semibold text-lg tracking-tight">Hub de Categorias</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pt-4 animate-page-in">
        <AnimatedTabs tabs={tabs} defaultTab="geral" />
      </main>
    </div>
  );
}
