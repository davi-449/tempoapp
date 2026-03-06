import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, CheckCircle, Flame, Clock, BookOpen, TrendingUp, Lightbulb } from 'lucide-react';
import { getUserWeight, estimateCalories } from '@/hooks/useCalorieEstimator';

interface CategoryInsightsProps {
  category: { name: string; color: string; emoji: string | null };
  onBack: () => void;
}

export function CategoryInsights({ category, onBack }: CategoryInsightsProps) {
  const catName = category.name.toLowerCase();
  const isWorkout = catName.includes('treino');
  const isStudy = catName.includes('faculdade') || catName.includes('estudo');

  const { data: tasks = [] } = useQuery({
    queryKey: ['insights-tasks', category.name],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('*')
        .order('start_time', { ascending: true });
      if (error) throw error;
      return (data || []).filter((t: any) => t.category?.toLowerCase() === catName);
    }
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['insights-logs', category.name],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any).from('task_completion_logs').select('*')
          .eq('category', category.name)
          .order('completed_at', { ascending: false });
        if (error) return [];
        return data || [];
      } catch { return []; }
    }
  });

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === 'completed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const totalMinutes = tasks.filter((t: any) => t.status === 'completed')
      .reduce((sum: number, t: any) => sum + (t.estimated_duration_minutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    // From completion logs
    const totalCals = logs.reduce((sum: number, l: any) => sum + (l.estimated_calories || 0), 0);
    const avgIntensity = logs.length > 0
      ? (logs.reduce((sum: number, l: any) => sum + (l.perceived_intensity || 0), 0) / logs.length).toFixed(1)
      : '—';

    // Weekly trend (last 4 weeks)
    const now = new Date();
    const weeklyData = [1, 2, 3, 4].map(weeksAgo => {
      const wStart = new Date(now);
      wStart.setDate(now.getDate() - weeksAgo * 7);
      const wEnd = new Date(now);
      wEnd.setDate(now.getDate() - (weeksAgo - 1) * 7);

      const weekTasks = tasks.filter((t: any) => {
        if (!t.start_time) return false;
        const d = new Date(t.start_time);
        return d >= wStart && d < wEnd;
      });
      const done = weekTasks.filter((t: any) => t.status === 'completed').length;
      return { name: `Sem ${5 - weeksAgo}`, feitas: done, total: weekTasks.length };
    });

    // Context distribution (for pie chart)
    const contextMap = new Map<string, number>();
    tasks.forEach((t: any) => {
      let key = 'Outros';
      if (isStudy) {
        const match = t.title?.match(/^Aula:\s*([^·]+)/);
        if (match) key = match[1].trim();
      } else if (isWorkout) {
        const match = t.title?.match(/Treino\s*[A-C]\s*\(([^)]+)\)/) || t.title?.match(/Meu Treino:\s*(.+)/);
        if (match) key = match[1].trim();
      }
      contextMap.set(key, (contextMap.get(key) || 0) + 1);
    });
    const contextPie = Array.from(contextMap.entries()).map(([name, value]) => ({ name, value }));

    return { total, completed, rate, totalHours, totalCals, avgIntensity, weeklyData, contextPie };
  }, [tasks, logs, isStudy, isWorkout]);

  const colors = ['#10b981', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#14b8a6'];

  const insights = useMemo(() => {
    const tips: string[] = [];
    if (stats.rate < 50 && stats.total > 3) tips.push(`Sua taxa de conclusão está em ${stats.rate}%. Tente reservar blocos fixos no calendário.`);
    if (isWorkout && parseFloat(stats.avgIntensity) > 0 && parseFloat(stats.avgIntensity) < 3)
      tips.push('Intensidade média baixa. Considere aumentar progressivamente.');
    if (isWorkout && stats.totalCals > 0)
      tips.push(`Você já queimou aproximadamente ${Math.round(stats.totalCals)} kcal. Continue assim!`);
    if (isStudy && parseFloat(stats.totalHours) > 10)
      tips.push(`${stats.totalHours}h investidas em estudo. Seu futuro agradece! 🎓`);
    if (stats.rate >= 80) tips.push('Performance excelente! Mantenha a consistência.');
    if (tips.length === 0) tips.push('Continue registrando para receber insights personalizados.');
    return tips;
  }, [stats, isWorkout, isStudy]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 w-full glass-header border-b border-border/40">
        <div className="container flex h-14 max-w-lg items-center px-4 mx-auto gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-secondary rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xl">{category.emoji}</span>
          <h1 className="font-semibold text-base tracking-tight">Insights de {category.name}</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pt-5 space-y-5 animate-page-in">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-card rounded-[24px]">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-3xl font-bold">{stats.rate}%</span>
              <span className="text-[10px] text-muted-foreground">Conclusão</span>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card rounded-[24px]">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-3xl font-bold">{stats.totalHours}h</span>
              <span className="text-[10px] text-muted-foreground">{isStudy ? 'Horas Estudadas' : 'Horas Investidas'}</span>
            </CardContent>
          </Card>
          {isWorkout && (
            <>
              <Card className="border-0 shadow-card rounded-[24px]">
                <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-3xl font-bold text-orange-600">{Math.round(stats.totalCals)}</span>
                  <span className="text-[10px] text-muted-foreground">Calorias Queimadas</span>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-card rounded-[24px]">
                <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <span className="text-3xl font-bold">{stats.avgIntensity}<span className="text-base font-normal">/5</span></span>
                  <span className="text-[10px] text-muted-foreground">Intensidade Média</span>
                </CardContent>
              </Card>
            </>
          )}
          {isStudy && (
            <Card className="border-0 shadow-card rounded-[24px]">
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <BookOpen className="h-5 w-5 text-purple-500" />
                <span className="text-3xl font-bold">{stats.completed}</span>
                <span className="text-[10px] text-muted-foreground">Aulas Concluídas</span>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Weekly Bar Chart */}
        <Card className="border-0 shadow-card rounded-[24px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evolução Semanal</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="feitas" fill={category.color || '#10b981'} radius={[6, 6, 0, 0]} name="Feitas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Context Pie Chart */}
        {stats.contextPie.length > 0 && (
          <Card className="border-0 shadow-card rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {isStudy ? 'Por Matéria' : isWorkout ? 'Por Divisão' : 'Por Tipo'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center pb-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.contextPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name }) => name}>
                    {stats.contextPie.map((_: any, i: number) => (
                      <Cell key={i} fill={colors[i % colors.length]} className="stroke-background stroke-[3px]" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Insights */}
        <Card className="border-0 shadow-card bg-secondary/20 rounded-[24px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" /> Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            {insights.map((s, i) => (
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
}
