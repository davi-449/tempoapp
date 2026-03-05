import React, { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Clock } from "lucide-react";

const CAT_PILL: Record<string, { class: string; label: string }> = {
  todos: { class: '', label: 'Todos' },
  pessoal: { class: 'cat-pessoal', label: '🏠 Pessoal' },
  trabalho: { class: 'cat-trabalho', label: '💼 Trabalho' },
  treino: { class: 'cat-treino', label: '🏋️ Treino' },
  faculdade: { class: 'cat-faculdade', label: '📚 Faculdade' },
};

const CAT_BORDER: Record<string, string> = {
  trabalho: 'border-l-blue-500',
  faculdade: 'border-l-purple-500',
  pessoal: 'border-l-emerald-500',
  treino: 'border-l-orange-500',
};

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"calendar" | "lista">("calendar");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["calendar-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const filteredTasks = useMemo(() => {
    if (activeCategory === "todos") return tasks;
    return tasks.filter((t: any) => t.category === activeCategory);
  }, [tasks, activeCategory]);

  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return filteredTasks.filter((t: any) => t.start_time?.startsWith(dateStr));
  }, [filteredTasks, selectedDate]);

  const datesWithTasks = useMemo(() => {
    const map = new Map<string, Set<string>>();
    filteredTasks.forEach((t: any) => {
      if (!t.start_time) return;
      const d = t.start_time.substring(0, 10);
      if (!map.has(d)) map.set(d, new Set());
      map.get(d)!.add(t.category);
    });
    return map;
  }, [filteredTasks]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 w-full backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
        <div className="container flex h-14 max-w-lg items-center px-4 mx-auto">
          <h1 className="font-semibold text-base tracking-tight">Calendário</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pt-4 space-y-5">
        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(CAT_PILL).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border tap-bounce ${
                activeCategory === key
                  ? key === 'todos'
                    ? 'bg-foreground text-background border-foreground'
                    : `${val.class} border-current`
                  : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary'
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="calendar" className="flex-1">Calendário</TabsTrigger>
            <TabsTrigger value="lista" className="flex-1">Lista</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4">
            <div className="bg-card shadow-card rounded-2xl border p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="mx-auto"
                modifiers={{
                  hasTasks: (date) => datesWithTasks.has(format(date, "yyyy-MM-dd")),
                }}
                modifiersStyles={{
                  hasTasks: {
                    fontWeight: "700",
                    textDecoration: "underline",
                    textDecorationColor: "#10B981",
                    textUnderlineOffset: "4px",
                  },
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="lista" className="mt-4">
            {/* Lista mode shows all filtered tasks sorted by date */}
          </TabsContent>
        </Tabs>

        {/* Tasks for selected date */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          {isLoading ? (
            <div className="bg-card shadow-card border rounded-2xl p-4 animate-pulse h-16" />
          ) : tasksForSelectedDate.length === 0 ? (
            <div className="bg-card shadow-card border rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground">Sem tarefas para este dia</p>
            </div>
          ) : (
            tasksForSelectedDate.map((task: any) => (
              <div
                key={task.id}
                className={`bg-card shadow-card border rounded-2xl p-4 border-l-4 ${CAT_BORDER[task.category] || ''} flex justify-between items-center`}
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm">{task.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(task.start_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    {task.estimated_duration_minutes && <span>· {task.estimated_duration_minutes} min</span>}
                    {task.location && (
                      <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{task.location}</span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className={`${CAT_PILL[task.category]?.class || ''} border text-[10px] capitalize`}>
                  {task.category}
                </Badge>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default CalendarPage;
