import React, { useEffect, useState } from "react";
import { Timeline } from "@/components/Timeline";
import { SmartAdd } from "@/components/SmartAdd";
import { supabase } from "@/integrations/supabase/client";
import { Clock, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

const CATEGORY_CARD_STYLES = [
  { name: "Pessoal", emoji: "🏠", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-700", key: "pessoal" },
  { name: "Trabalho", emoji: "💼", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-700", key: "trabalho" },
  { name: "Treino", emoji: "🏋️", bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-700", key: "treino" },
  { name: "Faculdade", emoji: "📚", bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-700", key: "faculdade" },
];

const Index = () => {
  const [todayCount, setTodayCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchKPIs = async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data: allTasks } = await supabase.from("tasks").select("*");

      if (allTasks) {
        const today = allTasks.filter(t => {
          if (!t.start_time) return false;
          const d = new Date(t.start_time);
          return d >= startOfDay && d <= endOfDay;
        });
        setTodayCount(today.length);

        const overdue = allTasks.filter(t => {
          if (t.status === "completed") return false;
          if (!t.end_time) return false;
          return new Date(t.end_time) < new Date();
        });
        setOverdueCount(overdue.length);

        const counts: Record<string, number> = {};
        allTasks.forEach(t => {
          counts[t.category] = (counts[t.category] || 0) + 1;
        });
        setCategoryCounts(counts);
      }
    };

    fetchKPIs();
    const handler = () => fetchKPIs();
    window.addEventListener("task-added", handler);
    return () => window.removeEventListener("task-added", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-24">
      <header className="sticky top-0 z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="container flex h-16 max-w-lg items-center px-4 mx-auto">
          <div className="font-semibold text-lg tracking-tight">TempoApp</div>
          <div className="ml-auto w-8 h-8 rounded-full bg-secondary overflow-hidden border">
            <img src="https://i.pravatar.cc/100" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto p-4">
        {/* KPI Row */}
        <section className="grid grid-cols-3 gap-3 mt-2 mb-6">
          <div className="bg-card border shadow-sm rounded-2xl p-3 flex flex-col items-center text-center gap-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-xl font-bold">{todayCount}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Tarefas Hoje</span>
          </div>
          <div className="bg-card border shadow-sm rounded-2xl p-3 flex flex-col items-center text-center gap-1">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xl font-bold text-amber-600">{overdueCount}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Atrasadas</span>
          </div>
          <div className="bg-card border shadow-sm rounded-2xl p-3 flex flex-col items-center text-center gap-1">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xl font-bold">—</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Produtividade</span>
          </div>
        </section>

        {/* Resume por Categoria */}
        <section className="mb-8 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Resumo por Categoria</h3>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORY_CARD_STYLES.map((cat) => (
              <div key={cat.key} className={`${cat.bg} border ${cat.border} p-4 rounded-2xl flex flex-col items-center gap-1`}>
                <span className="text-2xl">{cat.emoji}</span>
                <span className={`text-sm font-medium ${cat.text}`}>{cat.name}</span>
                <span className="text-2xl font-bold">{categoryCounts[cat.key] || 0}</span>
                <span className="text-xs text-muted-foreground">tarefas</span>
              </div>
            ))}
          </div>
        </section>

        {/* Projetos Ativos */}
        <section className="mb-8 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Projetos Ativos</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex flex-col gap-2">
              <span className="text-sm font-medium text-blue-700">Marketing Tork</span>
              <div className="h-1.5 w-full bg-blue-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[60%]" />
              </div>
              <span className="text-xs text-muted-foreground mt-1">Vence em 2 dias</span>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl flex flex-col gap-2">
              <span className="text-sm font-medium text-purple-700">TCC Faculdade</span>
              <div className="h-1.5 w-full bg-purple-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[30%]" />
              </div>
              <span className="text-xs text-muted-foreground mt-1">Vence em 14 dias</span>
            </div>
          </div>
        </section>

        <Timeline />
      </main>

      <SmartAdd />
    </div>
  );
};

export default Index;
