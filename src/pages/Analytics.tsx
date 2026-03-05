import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CheckCircle, AlertTriangle, Lightbulb, Flame } from "lucide-react";

const PIE_COLORS: Record<string, string> = {
  trabalho: "hsl(217, 91%, 60%)",
  faculdade: "hsl(263, 70%, 66%)",
  pessoal: "hsl(160, 84%, 39%)",
  treino: "hsl(25, 95%, 53%)",
};
const CATEGORIES = ["trabalho", "faculdade", "pessoal", "treino"];

const AnalyticsPage = () => {
  const [period, setPeriod] = useState<"semana" | "mes" | "trimestre">("semana");

  const { data: allTasks = [] } = useQuery({
    queryKey: ["analytics-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    
    // Filtro temporal real
    const filteredTasks = allTasks.filter((t: any) => {
      if (!t.start_time) return false;
      const d = new Date(t.start_time);
      
      const periodStart = new Date(now);
      if (period === "semana") periodStart.setDate(now.getDate() - 7);
      else if (period === "mes") periodStart.setMonth(now.getMonth() - 1);
      else if (period === "trimestre") periodStart.setMonth(now.getMonth() - 3);
      
      periodStart.setHours(0, 0, 0, 0); // start of period day
      return d >= periodStart && d <= now; // only up to today
    });

    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t: any) => t.status === "completed").length;
    const overdue = filteredTasks.filter((t: any) => {
      if (t.status === "completed") return false;
      if (!t.end_time) return false;
      return new Date(t.end_time) < now;
    }).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const byCategory = CATEGORIES.map((cat) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: filteredTasks.filter((t: any) => t.category === cat).length,
      fill: PIE_COLORS[cat]
    })).filter(c => c.value > 0);

    // Weekly trend (always shows last 4 weeks regardless of period filter, to show "trend")
    const weeklyTrend = [1, 2, 3, 4].map((weekAgo) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - weekAgo * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - (weekAgo - 1) * 7);
      
      const weekTasks = allTasks.filter((t: any) => {
        if (!t.start_time) return false;
        const d = new Date(t.start_time);
        return d >= weekStart && d < weekEnd;
      });
      const wDone = weekTasks.filter((t: any) => t.status === "completed").length;
      const wTotal = weekTasks.length;
      return { name: `Sem ${5 - weekAgo}`, taxa: wTotal > 0 ? Math.round((wDone / wTotal) * 100) : 0 };
    });

    // Streak logic (global, unbiased by period filter)
    let streak = 0;
    const d = new Date(now);
    for (let i = 0; i < 365; i++) {
      d.setDate(d.getDate() - (i === 0 ? 0 : 1));
      const dateStr = d.toISOString().substring(0, 10);
      const dayCompleted = allTasks.some((t: any) => t.status === "completed" && t.start_time?.startsWith(dateStr));
      if (dayCompleted) streak++;
      else break;
    }

    // Daily average based on period
    const days = period === "semana" ? 7 : period === "mes" ? 30 : 90;
    const dailyAvg = (completed / days).toFixed(1);

    return { total, completed, overdue, rate, byCategory, weeklyTrend, streak, dailyAvg };
  }, [allTasks, period]);

  const suggestions = useMemo(() => {
    const tips: string[] = [];
    if (stats.overdue > 0) tips.push(`Você tem ${stats.overdue} tarefa(s) atrasada(s). Priorize-as hoje.`);
    
    if (stats.byCategory.length > 0) {
      const maxCat = stats.byCategory.reduce((a, b) => (a.value > b.value ? a : b));
      tips.push(`Foco intenso em ${maxCat.name} neste período. Considere equilibrar suas atividades.`);
    }
    
    if (stats.total > 10 && stats.rate < 50) tips.push("Muitas tarefas listadas, mas poucas concluídas. Tente fragmentá-las.");
    if (tips.length === 0) tips.push("Continue assim! Tudo equilibrado.");
    return tips;
  }, [stats]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 w-full glass-header border-b border-border/40">
        <div className="container flex h-14 max-w-lg items-center px-4 mx-auto">
          <h1 className="font-semibold text-base tracking-tight">Análise</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pt-5 space-y-6 animate-page-in">
        {/* Period Filter */}
        <div className="flex gap-2">
          {(["semana", "mes", "trimestre"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border tap-bounce ${
                period === p
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
              }`}
            >
              {p === "mes" ? "Último Mês" : p === "trimestre" ? "Trimestre" : "Esta Semana"}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-card hover:shadow-card-hover transition-all">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-3xl font-bold">{stats.rate}%</span>
              <span className="text-[10px] text-muted-foreground">Conclusão no período</span>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card hover:shadow-card-hover transition-all">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-3xl font-bold text-amber-600">{stats.overdue}</span>
              <span className="text-[10px] text-muted-foreground">Atrasadas no período</span>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card hover:shadow-card-hover transition-all">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-3xl font-bold">{stats.streak}</span>
              <span className="text-[10px] text-muted-foreground">Dias Seguidos (Global)</span>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card hover:shadow-card-hover transition-all">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <span className="text-3xl font-bold">{stats.dailyAvg}</span>
              <span className="text-[10px] text-muted-foreground">Média Diária (Período)</span>
            </CardContent>
          </Card>
        </div>

        {/* Category Pie */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição: {period}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center pb-4">
            {stats.byCategory.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center animate-fade-in">
                <div className="h-24 w-24 rounded-full border-4 border-dashed border-muted-foreground/20 mb-3" />
                <p className="text-xs text-muted-foreground">Sem dados neste período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie 
                    data={stats.byCategory} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={80} 
                    dataKey="value" 
                    label={({ name }) => name}
                  >
                    {stats.byCategory.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.fill} className="stroke-background stroke-[3px]" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tendência Histórica</CardTitle>
            <CardDescription className="text-xs">Taxa de conclusão últimas 4 semanas</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => `${v}%`} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                <Bar dataKey="taxa" fill="hsl(160, 84%, 39%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card className="border-0 shadow-card bg-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 bg-card p-3 rounded-xl shadow-sm border border-border/50">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{s}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AnalyticsPage;
