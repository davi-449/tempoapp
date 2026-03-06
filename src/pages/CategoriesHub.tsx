import React, { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { LayoutDashboard, CheckCircle, ChevronRight, BarChart3 } from "lucide-react";
import { DynamicOnboarding } from "@/features/categories/DynamicOnboarding";
import { TaskCompletionSheet } from "@/components/TaskCompletionSheet";
import { CategoryInsights } from "@/components/CategoryInsights";
import { groupTasksByTime, groupTasksByContext } from "@/hooks/useTaskGroups";
import { Category } from "@/types/data";

export default function CategoriesHub() {
  const { categories } = useCategories();
  const [completionTask, setCompletionTask] = useState<any>(null);
  const [completionType, setCompletionType] = useState<string | undefined>();
  const [insightsCategory, setInsightsCategory] = useState<any>(null);

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

  const handleComplete = (task: any, catType?: string) => {
    setCompletionTask(task);
    setCompletionType(catType);
  };

  const confirmComplete = async () => {
    if (!completionTask) return;
    await supabase.from('tasks').update({ status: 'completed' }).eq('id', completionTask.id);
    setCompletionTask(null);
    setCompletionType(undefined);
    refetch();
    window.dispatchEvent(new Event('task-added'));
  };

  const toggleComplete = async (taskId: string, currentStatus: string, task: any, catType?: string) => {
    if (currentStatus === 'completed') {
      // Un-complete: direct toggle
      await supabase.from('tasks').update({ status: 'pending' }).eq('id', taskId);
      refetch();
      window.dispatchEvent(new Event('task-added'));
    } else {
      // Complete: open the sheet
      handleComplete(task, catType);
    }
  };

  // ---------- Render Helpers ----------

  const renderTaskCard = (task: any, idx: number, catType?: string) => {
    const isDone = task.status === 'completed';
    const time = task.start_time
      ? new Date(task.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : 'S/ hora';
    const dayLabel = task.start_time
      ? new Date(task.start_time).toLocaleDateString('pt-BR', { weekday: 'short' })
      : '';

    return (
      <div
        key={task.id}
        style={{ animationDelay: `${idx * 30}ms` }}
        className={`bg-white shadow-card border-0 rounded-[24px] p-4 flex items-start gap-3 transition-all animate-fade-in ${
          isDone ? 'opacity-50 grayscale-[0.3]' : 'hover:shadow-card-hover hover:-translate-y-0.5'
        }`}
      >
        <button
          onClick={() => toggleComplete(task.id, task.status, task, catType)}
          className={`flex-shrink-0 h-6 w-6 mt-0.5 rounded-full border-[2px] flex items-center justify-center transition-all duration-300 ${
            isDone
              ? 'border-emerald-500 bg-emerald-500 text-white scale-110 shadow-sm'
              : 'border-muted-foreground/30 hover:border-emerald-400 hover:scale-110'
          }`}
        >
          {isDone && <CheckCircle className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm leading-tight truncate ${isDone ? 'line-through' : ''}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground mt-1">
            {dayLabel && <span className="capitalize">{dayLabel}</span>}
            <span>{time}</span>
            {task.estimated_duration_minutes && <span>· {task.estimated_duration_minutes}m</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderGroupedTasks = (tasks: any[], catType?: string) => {
    const temporalGroups = groupTasksByTime(tasks);

    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-card shadow-sm rounded-[24px] p-5 h-[80px] animate-pulse" />
          ))}
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <div className="bg-white shadow-sm rounded-[24px] p-8 text-center flex flex-col items-center justify-center min-h-[160px] animate-fade-in">
          <p className="text-sm font-medium text-foreground">Nenhuma tarefa por aqui ainda.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6 pb-8">
        {temporalGroups.map(group => (
          <div key={group.label} className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 ml-1">
              {group.label}
            </h4>
            <div className="space-y-2">
              {group.tasks.map((task: any, idx: number) => renderTaskCard(task, idx, catType))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ---------- Category Tab Content ----------

  const getCategoryType = (name: string): string | undefined => {
    const n = name.toLowerCase();
    if (n.includes('treino') || n.includes('workout')) return 'workout';
    if (n.includes('faculdade') || n.includes('estudo') || n.includes('study')) return 'study';
    if (n.includes('trabalho') || n.includes('work')) return 'work';
    return undefined;
  };

  const renderCategoryContent = (category: Category) => {
    const configuredFromLS = JSON.parse(localStorage.getItem('configured_categories') || '{}');
    const isConfigured = (category as any).settings?.isConfigured || configuredFromLS[category.id]?.isConfigured;

    if (!isConfigured) {
      return (
        <div className="h-[65vh]">
          <DynamicOnboarding category={category} onComplete={() => refetch()} />
        </div>
      );
    }

    const catType = getCategoryType(category.name);
    const categoryTasks = allTasks.filter((t: any) =>
      t.category?.toLowerCase() === category.name.toLowerCase()
    );
    const pending = categoryTasks.filter((t: any) => t.status !== 'completed');
    const completed = categoryTasks.filter((t: any) => t.status === 'completed');
    const contextGroups = groupTasksByContext(pending, catType);
    const showContextView = contextGroups.length > 1 && (catType === 'study' || catType === 'workout');

    return (
      <div className="space-y-5 animate-fade-in pt-4">
        {/* Category Header */}
        <div className="flex bg-white shadow-sm p-4 rounded-3xl gap-4 items-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${category.color}15` }}>
            {category.emoji}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-balance">Meu Hub de {category.name}</h3>
            <p className="text-sm text-muted-foreground">
              {pending.length > 0 ? `${pending.length} pendente${pending.length > 1 ? 's' : ''}` : 'Tudo em dia! 🎉'}
            </p>
          </div>
          <button onClick={() => setInsightsCategory(category)} className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors" title="Ver Insights">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Contextual grouping for Study / Workout */}
        {showContextView ? (
          <div className="space-y-6">
            {contextGroups.map(group => (
              <div key={group.key} className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider ml-1 flex items-center gap-1" style={{ color: category.color }}>
                  <ChevronRight className="w-3 h-3" />
                  {group.label}
                </h4>
                <div className="space-y-2">
                  {group.tasks.map((task: any, idx: number) => renderTaskCard(task, idx, catType))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold ml-2 text-foreground/70">A Fazer ({pending.length})</h4>
              {renderGroupedTasks(pending, catType)}
            </div>
          </>
        )}

        {completed.length > 0 && (
          <div className="space-y-2 opacity-70 mt-4">
            <h4 className="text-sm font-semibold ml-2 text-foreground/70">Concluídas ({completed.length})</h4>
            <div className="space-y-2">
              {completed.slice(0, 5).map((task: any, idx: number) => renderTaskCard(task, idx, catType))}
              {completed.length > 5 && (
                <p className="text-xs text-center text-muted-foreground py-2">
                  +{completed.length - 5} concluída{completed.length - 5 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---------- "Todos" Tab ----------

  const pendingAll = allTasks.filter((t: any) => t.status !== 'completed');
  const categorySummary = categories.map((cat: any) => {
    const catTasks = allTasks.filter((t: any) => t.category?.toLowerCase() === cat.name.toLowerCase());
    const done = catTasks.filter((t: any) => t.status === 'completed').length;
    return { name: cat.name, emoji: cat.emoji, color: cat.color, total: catTasks.length, done };
  }).filter(c => c.total > 0);

  const renderTodosTab = () => (
    <div className="space-y-5 pt-4">
      {/* Mini summary cards */}
      {categorySummary.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {categorySummary.map(c => (
            <div key={c.name} className="bg-white shadow-sm rounded-2xl p-3 flex items-center gap-3">
              <span className="text-xl">{c.emoji}</span>
              <div>
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.done}/{c.total} feitas</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {renderGroupedTasks(pendingAll)}
    </div>
  );

  // ---------- Tabs Assembly ----------

  const tabs = [
    {
      id: "geral",
      label: "Todos",
      content: renderTodosTab()
    },
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

      {/* Completion Sheet */}
      <TaskCompletionSheet
        task={completionTask}
        open={!!completionTask}
        onOpenChange={(open) => { if (!open) setCompletionTask(null); }}
        onConfirm={confirmComplete}
        categoryType={completionType}
      />

      {/* Insights Full-screen overlay */}
      {insightsCategory && (
        <div className="fixed inset-0 z-50 bg-background">
          <CategoryInsights
            category={insightsCategory}
            onBack={() => setInsightsCategory(null)}
          />
        </div>
      )}
    </div>
  );
}
