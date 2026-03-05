import React, { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, CheckCircle } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TaskEditSheet } from "@/components/TaskEditSheet";

type TaskCategory = 'todos' | 'trabalho' | 'faculdade' | 'pessoal' | 'treino';

const CAT_COLORS: Record<string, string> = {
  trabalho: "bg-blue-500 border-l-blue-500 cat-trabalho",
  faculdade: "bg-purple-500 border-l-purple-500 cat-faculdade",
  pessoal: "bg-emerald-500 border-l-emerald-500 cat-pessoal",
  treino: "bg-orange-500 border-l-orange-500 cat-treino",
};

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [filter, setFilter] = useState<TaskCategory>('todos');
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { data: allTasks = [], refetch } = useQuery({
    queryKey: ['calendar-tasks', date?.getMonth(), date?.getFullYear()],
    queryFn: async () => {
      // Fetch +/- 1 month of tasks around the selected date
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
    window.dispatchEvent(new Event('resize')); // Fix layout shifts slightly over
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
            <TabsTrigger value="calendario" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Mensal</TabsTrigger>
            <TabsTrigger value="lista" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Agenda</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendario" className="mt-4 pt-2 animate-fade-in">
            <div className="bg-card shadow-card rounded-[1.5rem] border border-border/50 p-2 overflow-hidden mx-auto flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                className="w-full text-base sm:text-sm"
                classNames={{
                  head_cell: "text-muted-foreground font-medium text-[0.8rem] w-9 h-9",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-muted transition-colors mx-auto flex items-center justify-center",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-semibold shadow-sm",
                  day_today: "bg-secondary text-secondary-foreground font-bold",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-lg hover:bg-secondary",
                  caption: "flex justify-between items-center pt-1 pb-3 px-2 flex-row-reverse",
                  caption_label: "text-sm font-semibold capitalize",
                }}
                modifiers={{
                  hasTask: (d) => allTasks.some(t => t.start_time && isSameDay(new Date(t.start_time), d)),
                }}
                modifiersClassNames={{
                  hasTask: "font-semibold",
                }}
                components={{
                  DayContent: (props) => {
                    const d = props.date;
                    const dayTasks = allTasks.filter(t => t.start_time && isSameDay(new Date(t.start_time), d));
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span>{d.getDate()}</span>
                        {dayTasks.length > 0 && (
                          <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
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
          {(['todos', 'trabalho', 'faculdade', 'pessoal', 'treino'] as TaskCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap tap-bounce border ${
                filter === cat 
                  ? 'bg-foreground text-background border-foreground shadow-sm' 
                  : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Selected Date Header */}
        <div className="flex items-center justify-between border-b pb-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-medium text-sm">
            {date ? format(date, "EEEE, d 'de' MMMM", { locale: ptBR }) : "Nenhuma data selecionada"}
          </h3>
          <span className="text-xs font-medium text-muted-foreground/80 bg-secondary px-2 py-0.5 rounded-full">
            {tasksForSelectedDate.length} {tasksForSelectedDate.length === 1 ? 'tarefa' : 'tarefas'}
          </span>
        </div>

        {/* Task List */}
        <div className="space-y-3 pb-8 min-h-[30vh] animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {tasksForSelectedDate.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="h-16 w-16 bg-secondary/50 rounded-full flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-sm">Dia livre! Pratique o ócio criativo.</p>
            </div>
          ) : (
            tasksForSelectedDate.map((task: any, idx) => {
              const isDone = task.status === 'completed';
              const catClass = CAT_COLORS[task.category] || "border-l-foreground";
              const borderCol = catClass.split(' ')[1] || 'border-l-foreground';

              return (
                <div 
                  key={task.id} 
                  onClick={() => openEdit(task)}
                  className={`bg-card shadow-card rounded-2xl p-4 border border-border/50 border-l-4 ${borderCol} flex items-center gap-3 tap-bounce cursor-pointer
                      transition-all duration-200 hover:shadow-card-hover hover:scale-[1.01] 
                      ${isDone ? 'opacity-50' : ''}`}
                >
                  <button
                    onClick={(e) => toggleComplete(e, task.id, task.status)}
                    className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      isDone
                        ? 'border-emerald-500 bg-emerald-500 text-white scale-110'
                        : 'border-muted-foreground/30 hover:border-emerald-400 hover:scale-110'
                    }`}
                  >
                    {isDone && <CheckCircle className="h-3 w-3" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isDone ? 'line-through' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(task.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {task.estimated_duration_minutes ? ` · ${task.estimated_duration_minutes}m` : ''}
                      </span>
                      {task.location && (
                        <span className="flex items-center gap-1 truncate max-w-[120px]">
                          <MapPin className="h-3 w-3" />
                          {task.location}
                        </span>
                      )}
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
