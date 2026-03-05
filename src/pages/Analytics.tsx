import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CheckCircle, AlertTriangle, TrendingUp, Lightbulb } from "lucide-react";

const PIE_COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F97316"];
const CATEGORIES = ["trabalho", "faculdade", "pessoal", "treino"];

const AnalyticsPage = () => {
  const [period, setPeriod] = useState<"semana" | "mes" | "trimestre">("semana");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["analytics-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === "completed").length;
    const overdue = tasks.filter((t: any) => {
      if (t.status === "completed") return false;
      if (!t.end_time) return false;
      return new Date(t.end_time) < new Date();
    }).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const byCategory = CATEGORIES.map((cat) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: tasks.filter((t: any) => t.category === cat).length,
    }));

    // Weekly trend (last 4 weeks)
    const weeklyTrend = [1, 2, 3, 4].map((weekAgo) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekAgo * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (weekAgo - 1) * 7);

      const weekTasks = tasks.filter((t: any) => {
        if (!t.start_time) return false;
        const d = new Date(t.start_time);
        return d >= weekStart && d < weekEnd;
      });
      const weekCompleted = weekTasks.filter((t: any) => t.status === "completed").length;
      const weekTotal = weekTasks.length;
      return {
        name: `Sem ${5 - weekAgo}`,
        taxa: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0,
      };
    });

    return { total, completed, overdue, rate, byCategory, weeklyTrend };
  }, [tasks]);

  const suggestions = useMemo(() => {
    const tips: string[] = [];
    if (stats.overdue > 0) tips.push(`Você tem ${stats.overdue} tarefa(s) atrasada(s). Priorize-as hoje.`);
    
    const maxCat = stats.byCategory.reduce((a, b) => (a.value > b.value ? a : b), stats.byCategory[0]);
    if (maxCat && maxCat.value > 0) tips.push(`Você tem mais tarefas na categoria ${maxCat.name}. Considere equilibrar suas atividades.`);
    
    if (stats.total > 10) tips.push("Tente dividir tarefas grandes em subtarefas menores e mais gerenciáveis.");
    if (tips.length === 0) tips.push("Continue assim! Sua produtividade está ótima.");
    return tips;
  }, [stats]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="container flex h-16 max-w-lg items-center px-4 mx-auto">
          <div className="font-semibold text-lg tracking-tight">Análise de Produtividade</div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto p-4 space-y-6">
        {/* Period Filter */}
        <div className="flex gap-2">
          {(["semana", "mes", "trimestre"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all border ${
                period === p
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary"
              }`}
            >
              {p === "mes" ? "Mês" : p === "trimestre" ? "Trimestre" : "Semana"}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold">{stats.rate}%</span>
              <span className="text-xs text-muted-foreground">Taxa de Conclusão</span>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{stats.overdue}</span>
              <span className="text-xs text-muted-foreground">Tarefas Atrasadas</span>
            </CardContent>
          </Card>
        </div>

        {/* Category Distribution - Pie Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center pb-4">
            {stats.byCategory.every((c) => c.value === 0) ? (
              <p className="text-sm text-muted-foreground py-8">Sem dados suficientes</p>
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

        {/* Weekly Trend - Bar Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tendência de Produtividade</CardTitle>
            <CardDescription className="text-xs">Taxa de conclusão nas últimas 4 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="taxa" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Sugestões Personalizadas
            </CardTitle>
            <CardDescription className="text-xs">Com base nos seus padrões de conclusão de tarefas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
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
