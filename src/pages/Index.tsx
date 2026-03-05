import React, { useEffect, useState, useMemo } from "react";
import { Timeline } from "@/components/Timeline";
import { SmartAdd } from "@/components/SmartAdd";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { categories } = useCategories();

  useEffect(() => {
    async function getProfile() {
      if (!user) return;
      const { data } = await (supabase as any).from('profiles').select('avatar_url').eq('id', user.id).single();
      if (data?.avatar_url) {
        const { data: imgData } = supabase.storage.from('avatars').getPublicUrl(data.avatar_url);
        setAvatarUrl(imgData?.publicUrl || null);
      }
    }
    getProfile();
  }, [user]);

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

    // Calculate stats based on dynamic categories
    const categoryStats = categories.map(cat => {
      const catTasks = tasks.filter(t => t.category === cat.name || t.category === cat.name.toLowerCase());
      const total = catTasks.length;
      const completed = catTasks.filter(t => t.status === 'completed').length;
      return { ...cat, total, completed };
    });

    const completed = tasks.filter((t: any) => t.status === "completed").length;
    const total = tasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Removed counts calculation as it's replaced by categoryStats

    return {
      todayCount: todayTasks.length,
      overdueCount: overdue.length,
      rate,
      categoryStats, // Added categoryStats to the returned object
    };
  }, [tasks, categories]); // Added categories to dependency array

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
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="h-10 w-10 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold shadow-sm overflow-hidden border-2 border-background tap-bounce transition-transform hover:scale-105">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    getUserFirstName(user?.email).charAt(0)
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-float border-0 bg-background/95 backdrop-blur-md p-2">
                <DropdownMenuLabel className="font-semibold">{getUserFirstName(user?.email)}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5 font-medium" onClick={() => navigate('/perfil')}>
                  👤 Perfil e Ajustes
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5 text-red-500 font-medium hover:text-red-600 focus:text-red-500" onClick={async () => { await signOut(); navigate('/login'); }}>
                  🚪 Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pt-5 space-y-7 animate-page-in">
        {/* KPI Row */}
        <section className="grid grid-cols-3 gap-3 animate-fade-in">
          <div className="bg-card shadow-card hover:shadow-card-hover transition-all rounded-[24px] p-4 flex flex-col items-center text-center gap-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-2xl font-bold">{stats.todayCount}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Hoje</span>
          </div>
          <div className="bg-card shadow-card hover:shadow-card-hover transition-all rounded-[24px] p-4 flex flex-col items-center text-center gap-1">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-2xl font-bold text-amber-600">{stats.overdueCount}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Atrasadas</span>
          </div>
          <div className="bg-card shadow-card hover:shadow-card-hover transition-all rounded-[24px] p-4 flex flex-col items-center text-center gap-1">
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
          <div className="grid grid-cols-2 gap-3"> {/* Changed grid-cols-4 to grid-cols-2 for better card layout */}
            {stats.categoryStats.map((cat) => (
              <Card key={cat.id} className="border-0 shadow-card hover:shadow-card-hover transition-all rounded-[24px] cursor-pointer tap-bounce">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-[12px] flex items-center justify-center text-xl" style={{ backgroundColor: `${cat.color}15` }}>
                      {cat.emoji || '📌'}
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-secondary/80 text-secondary-foreground">
                      {cat.completed}/{cat.total}
                    </span>
                  </div>
                  <div className="mt-1">
                    <h3 className="font-semibold text-sm line-clamp-1">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat.total === 0 ? "Sem tarefas" :
                       cat.completed === cat.total ? "Concluído" :
                       `${cat.total - cat.completed} restantes`}
                    </p>
                  </div>
                </CardContent>
              </Card>
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
