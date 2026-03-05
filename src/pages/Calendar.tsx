import React, { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, CheckCircle } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TaskEditSheet } from "@/components/TaskEditSheet";
import { useCategories } from "@/hooks/useCategories";

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [filter, setFilter] = useState<string>('todos');
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { categories } = useCategories();

  const { data: allTasks = [], refetch } = useQuery({
    queryKey: ['calendar-tasks', date?.getMonth(), date?.getFullYear()],
    queryFn: async () => {
      if (!date) return [];
      const start = new Date(date.getFullYear(), date.getMonth() - 1, 1).toISOString();
      const end = new Date(date.getFullYear(), date.getMonth() + 2, 0).toISOString();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('start_time', start)
        .lte('start_time', end)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  React.useEffect(() => {
    const handler = () => refetch();
    window.dispatchEvent(new Event('resize'));
    window.addEventListener('task-added', handler);
    return () => window.removeEventListener('task-added', handler);
  }, [refetch]);

  const toggleComplete = async (e: React.MouseEvent, taskId: string, currentStatus: string) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    refetch();
  };

  const openEdit = (task: any) => {
    setEditingTask(task);
    setEditOpen(true);
  };

  const tasksForSelectedDate = useMemo(() => {
    if (!date) return [];
    return allTasks.filter(t => {
      if (!t.start_time) return false;
      const matchesDate = isSameDay(new Date(t.start_time), date);
      const matchesFilter = filter === 'todos' || t.category === filter;
      return matchesDate && matchesFilter;
    });
  }, [allTasks, date, filter]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 w-full glass-header border-b border-border/40">
        <div className="container flex h-14 max-w-lg items-center px-4 mx-auto">
          <h1 className="font-semibold text-base tracking-tight">Calendário</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pt-5 space-y-6 animate-page-in">
        {/* View Toggle */}
        <Tabs defaultValue="calendario" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 rounded-xl p-1 h-11">
            <TabsTrigger value="calendario" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Mensal</TabsTrigger>
            <TabsTrigger value="lista" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Agenda</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendario" className="mt-4 pt-2 animate-fade-in">
            <div className="bg-white shadow-card rounded-[24px] border-0 p-2 overflow-hidden mx-auto flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                className="w-full text-base sm:text-sm"
                classNames={{
                  head_cell: "text-muted-foreground font-medium text-[0.8rem] w-9 h-9",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent",
                  day: "h-9 w-9 p-0 font-medium aria-selected:opacity-100 rounded-full hover:bg-secondary transition-colors mx-auto flex items-center justify-center",
                  day_selected: "bg-foreground text-background hover:bg-foreground hover:text-background focus:bg-foreground focus:text-background font-semibold shadow-sm",
                  day_today: "bg-secondary text-secondary-foreground font-bold",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-lg hover:bg-secondary",
                  caption: "flex justify-between items-center pt-1 pb-3 px-2 flex-row-reverse",
                  caption_label: "text-sm font-semibold capitalize",
                }}
                components={{
                  DayContent: (props) => {
                    const d = props.date;
                    const dayTasks = allTasks.filter(t => t.start_time && isSameDay(new Date(t.start_time), d));
                    // Get highest priority category color for the dot
                    const firstTask = dayTasks[0];
                    const catForDot = firstTask ? categories.find(c => c.name === firstTask.category || c.name.toLowerCase() === firstTask.category) : null;
                    const dotColor = catForDot?.color || 'var(--foreground)';
                    
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span>{d.getDate()}</span>
                        {dayTasks.length > 0 && (
                          <div className="absolute bottom-[2px] w-1 h-1 rounded-full" style={{ backgroundColor: dotColor }} />
                        )}
                      </div>
                    );
                  }
                }}
              />
            </div>
          </TabsContent>
          <TabsContent value="lista" className="mt-4"></TabsContent>
        </Tabs>

        {/* Filters */}
        <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-none animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {['todos', ...categories.map(c => c.name)].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap tap-bounce border ${
                filter === cat 
                  ? 'bg-foreground text-background border-foreground shadow-sm' 
                  : 'bg-white text-muted-foreground border-transparent hover:bg-secondary/50 shadow-sm'
              }`}
            >
              {cat === 'todos' ? 'Todos' : cat}
            </button>
          ))}
        </div>

        {/* Selected Date Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold text-sm text-foreground/80">
            {date ? format(date, "EEEE, d 'de' MMMM", { locale: ptBR }) : "Nenhuma data selecionada"}
          </h3>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary/50 px-2.5 py-1 rounded-full">
            {tasksForSelectedDate.length} {tasksForSelectedDate.length === 1 ? 'tarefa' : 'tarefas'}
          </span>
        </div>

        {/* Task List */}
        <div className="space-y-3 pb-8 min-h-[30vh] animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {tasksForSelectedDate.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 bg-white rounded-[24px] shadow-sm min-h-[160px]">
              <div className="h-12 w-12 bg-secondary/50 rounded-full flex items-center justify-center mb-1">
                <Clock className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Nenhuma tarefa neste dia.</p>
            </div>
          ) : (
            tasksForSelectedDate.map((task: any, idx) => {
              const isDone = task.status === 'completed';
              const categoryObj = categories.find(c => c.name === task.category || c.name.toLowerCase() === task.category) || categories[0];
              const catColor = categoryObj?.color || '#000000';
              const catLabel = categoryObj?.name || 'Sem Categoria';

              return (
                <div 
                  key={task.id} 
                  onClick={() => openEdit(task)}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className={`bg-white shadow-card border-0 rounded-[24px] p-5 flex items-start gap-4 tap-bounce cursor-pointer
                    transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5
                    animate-fade-in ${isDone ? 'opacity-40 grayscale-[0.5]' : ''}`}
                >
                  {/* Complete toggle - Larger for premium feel */}
                  <button
                    onClick={(e) => toggleComplete(e, task.id, task.status)}
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
            })
          )}
        </div>
      </main>

      <TaskEditSheet
        task={editingTask}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => { refetch(); window.dispatchEvent(new Event('task-added')); }}
      />
    </div>
  );
};

export default CalendarPage;
