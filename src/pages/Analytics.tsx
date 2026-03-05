import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CheckCircle, AlertTriangle, Lightbulb, Flame } from "lucide-react";

const PIE_COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F97316"];
const CATEGORIES = ["trabalho", "faculdade", "pessoal", "treino"];

const AnalyticsPage = () => {
  const [period, setPeriod] = useState<"semana" | "mes" | "trimestre">("semana");

  const { data: tasks = [] } = useQuery({
    queryKey: ["analytics-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === "completed").length;
    const overdue = tasks.filter((t: any) => {
      if (t.status === "completed") return false;
      if (!t.end_time) return false;
      return new Date(t.end_time) < now;
    }).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const byCategory = CATEGORIES.map((cat) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: tasks.filter((t: any) => t.category === cat).length,
    }));

    // Weekly trend
    const weeklyTrend = [1, 2, 3, 4].map((weekAgo) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - weekAgo * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - (weekAgo - 1) * 7);
      const weekTasks = tasks.filter((t: any) => {
        if (!t.start_time) return false;
        const d = new Date(t.start_time);
        return d >= weekStart && d < weekEnd;
      });
      const wDone = weekTasks.filter((t: any) => t.status === "completed").length;
      const wTotal = weekTasks.length;
      return { name: `Sem ${5 - weekAgo}`, taxa: wTotal > 0 ? Math.round((wDone / wTotal) * 100) : 0 };
    });

    // Streak: consecutive days with at least 1 completed task
    let streak = 0;
    const d = new Date(now);
    for (let i = 0; i < 365; i++) {
      d.setDate(d.getDate() - (i === 0 ? 0 : 1));
      const dateStr = d.toISOString().substring(0, 10);
      const dayCompleted = tasks.some((t: any) => t.status === "completed" && t.start_time?.startsWith(dateStr));
      if (dayCompleted) streak++;
      else break;
    }

    // Daily average (last 7 days)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const last7 = tasks.filter((t: any) => {
      if (t.status !== "completed") return false;
      return new Date(t.start_time) >= sevenDaysAgo;
    }).length;
    const dailyAvg = (last7 / 7).toFixed(1);

    return { total, completed, overdue, rate, byCategory, weeklyTrend, streak, dailyAvg };
  }, [tasks]);

  const suggestions = useMemo(() => {
    const tips: string[] = [];
    if (stats.overdue > 0) tips.push(`Você tem ${stats.overdue} tarefa(s) atrasada(s). Priorize-as hoje.`);
    const maxCat = stats.byCategory.reduce((a, b) => (a.value > b.value ? a : b), stats.byCategory[0]);
    if (maxCat && maxCat.value > 0) tips.push(`Mais tarefas na categoria ${maxCat.name}. Considere equilibrar suas atividades.`);
    if (stats.total > 10) tips.push("Divida tarefas grandes em subtarefas menores e mais gerenciáveis.");
    if (tips.length === 0) tips.push("Continue assim! Sua produtividade está ótima.");
    return tips;
  }, [stats]);

  const hasData = stats.byCategory.some((c) => c.value > 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 w-full backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
        <div className="container flex h-14 max-w-lg items-center px-4 mx-auto">
          <h1 className="font-semibold text-base tracking-tight">Análise</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pt-4 space-y-5">
        {/* Period Filter */}
        <div className="flex gap-2">
          {(["semana", "mes", "trimestre"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border tap-bounce ${
                period === p
                  ? "bg-foreground text-background border-foreground"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
              }`}
            >
              {p === "mes" ? "Mês" : p === "trimestre" ? "Trimestre" : "Semana"}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-3xl font-bold">{stats.rate}%</span>
              <span className="text-[10px] text-muted-foreground">Taxa de Conclusão</span>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-3xl font-bold text-amber-600">{stats.overdue}</span>
              <span className="text-[10px] text-muted-foreground">Atrasadas</span>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-3xl font-bold">{stats.streak}</span>
              <span className="text-[10px] text-muted-foreground">Dias de Streak</span>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <span className="text-3xl font-bold">{stats.dailyAvg}</span>
              <span className="text-[10px] text-muted-foreground">Média Diária</span>
            </CardContent>
          </Card>
        </div>

        {/* Category Pie */}
        <Card className="border-0 shadow-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center pb-4">
            {!hasData ? (
              <div className="py-8 text-center">
                <div className="h-24 w-24 rounded-full border-4 border-dashed border-muted-foreground/20 mx-auto mb-3" />
                <p className="text-xs text-muted-foreground">Adicione tarefas para ver a distribuição</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.byCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => value > 0 ? name : ""}>
                    {stats.byCategory.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card className="border-0 shadow-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tendência Semanal</CardTitle>
            <CardDescription className="text-xs">Últimas 4 semanas</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="taxa" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card className="border-0 shadow-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Sugestões
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">{s}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AnalyticsPage;
