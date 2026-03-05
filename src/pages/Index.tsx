import React, { useEffect, useState, useMemo } from "react";
import { Timeline } from "@/components/Timeline";
import { SmartAdd } from "@/components/SmartAdd";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const CATEGORY_CARD_STYLES = [
  { name: "Pessoal", emoji: "🏠", bg: "cat-pessoal", key: "pessoal" },
  { name: "Trabalho", emoji: "💼", bg: "cat-trabalho", key: "trabalho" },
  { name: "Treino", emoji: "🏋️", bg: "cat-treino", key: "treino" },
  { name: "Faculdade", emoji: "📚", bg: "cat-faculdade", key: "faculdade" },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getUserFirstName(email?: string | null): string {
  if (!email) return "Usuário";
  const name = email.split("@")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const Index = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("task-added", handler);
    return () => window.removeEventListener("task-added", handler);
  }, []);

  const { data: tasks = [] } = useQuery({
    queryKey: ["home-tasks", refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    const todayTasks = tasks.filter((t: any) => {
      if (!t.start_time) return false;
      const d = new Date(t.start_time);
      return d >= startOfDay && d < endOfDay;
    });

    const overdue = tasks.filter((t: any) => {
      if (t.status === "completed") return false;
      if (!t.end_time) return false;
      return new Date(t.end_time) < now;
    });

    const completed = tasks.filter((t: any) => t.status === "completed").length;
    const total = tasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const counts: Record<string, number> = {};
    tasks.forEach((t: any) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });

    return {
      todayCount: todayTasks.length,
      overdueCount: overdue.length,
      rate,
      categoryCounts: counts,
    };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-background relative pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full glass-header border-b border-border/40">
        <div className="container flex h-16 max-w-lg items-center px-4 mx-auto">
          <div>
            <p className="text-xs text-muted-foreground">{getGreeting()}</p>
            <h1 className="font-semibold text-base tracking-tight">
              {getUserFirstName(user?.email)} 👋
            </h1>
          </div>
          <div className="ml-auto h-9 w-9 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold">
            {getUserFirstName(user?.email).charAt(0)}
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pt-5 space-y-7 animate-page-in">
        {/* KPI Row */}
        <section className="grid grid-cols-3 gap-3 animate-fade-in">
          <div className="bg-card shadow-card rounded-2xl p-3 flex flex-col items-center text-center gap-1 border border-border/50">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-2xl font-bold">{stats.todayCount}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Hoje</span>
          </div>
          <div className="bg-card shadow-card rounded-2xl p-3 flex flex-col items-center text-center gap-1 border border-border/50">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-2xl font-bold text-amber-600">{stats.overdueCount}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Atrasadas</span>
          </div>
          <div className="bg-card shadow-card rounded-2xl p-3 flex flex-col items-center text-center gap-1 border border-border/50">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-2xl font-bold text-emerald-600">{stats.rate}%</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Concluídas</span>
          </div>
        </section>

        {/* Category Summary */}
        <section className="space-y-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Resumo por Categoria
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORY_CARD_STYLES.map((cat) => (
              <div
                key={cat.key}
                className={`${cat.bg} border p-3 rounded-2xl flex flex-col items-center gap-1 tap-bounce`}
              >
                <span className="text-lg">{cat.emoji}</span>
                <span className="text-lg font-bold">{stats.categoryCounts[cat.key] || 0}</span>
                <span className="text-[9px] text-muted-foreground leading-tight">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Timeline />
        </section>
      </main>

      <SmartAdd />
    </div>
  );
};

export default Index;
