import React, { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TaskCategory = "trabalho" | "faculdade" | "pessoal" | "treino";

const CATEGORY_COLORS: Record<string, string> = {
  trabalho: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  faculdade: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  pessoal: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  treino: "bg-orange-500/10 text-orange-700 border-orange-500/20",
};

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeCategory, setActiveCategory] = useState<string>("todos");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["all-tasks"],
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
    let filtered = tasks;
    if (activeCategory !== "todos") {
      filtered = filtered.filter((t: any) => t.category === activeCategory);
    }
    return filtered;
  }, [tasks, activeCategory]);

  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return filteredTasks.filter((t: any) => {
      if (!t.start_time) return false;
      return t.start_time.startsWith(dateStr);
    });
  }, [filteredTasks, selectedDate]);

  // Dates that have tasks (for calendar dots)
  const datesWithTasks = useMemo(() => {
    const dates = new Set<string>();
    filteredTasks.forEach((t: any) => {
      if (t.start_time) dates.add(t.start_time.substring(0, 10));
    });
    return dates;
  }, [filteredTasks]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="container flex h-16 max-w-lg items-center px-4 mx-auto">
          <div className="font-semibold text-lg tracking-tight">Calendário</div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto p-4 space-y-6">
        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap">
          {["todos", "pessoal", "trabalho", "treino", "faculdade"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all border ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Calendar */}
        <div className="bg-card rounded-2xl border shadow-sm p-4">
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
              hasTasks: { fontWeight: "bold", textDecoration: "underline", textDecorationColor: "#10B981" },
            }}
          />
        </div>

        {/* Tasks for selected date */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
          ) : tasksForSelectedDate.length === 0 ? (
            <div className="bg-secondary/30 rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground">Sem tarefas para este dia</p>
            </div>
          ) : (
            tasksForSelectedDate.map((task: any) => (
              <div
                key={task.id}
                className="bg-card rounded-xl border shadow-sm p-4 flex justify-between items-center"
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(task.start_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    {task.estimated_duration_minutes && ` · ${task.estimated_duration_minutes} min`}
                  </p>
                </div>
                <Badge variant="secondary" className={`${CATEGORY_COLORS[task.category] || ""} border capitalize text-xs`}>
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
