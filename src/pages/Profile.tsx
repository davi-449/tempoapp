import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bell, Moon, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";

const CATEGORIES = [
  { name: "Trabalho", emoji: "💼", class: "cat-trabalho" },
  { name: "Faculdade", emoji: "📚", class: "cat-faculdade" },
  { name: "Pessoal", emoji: "🏠", class: "cat-pessoal" },
  { name: "Treino", emoji: "🏋️", class: "cat-treino" },
];

function getUserInitial(email?: string | null): string {
  if (!email) return "U";
  return email.charAt(0).toUpperCase();
}

function getUserName(email?: string | null): string {
  if (!email) return "Usuário";
  const name = email.split("@")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('tempoapp-dark', darkMode ? '1' : '0');
  }, [darkMode]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 w-full glass-header border-b border-border/40">
        <div className="container flex h-14 max-w-lg items-center px-4 mx-auto">
          <h1 className="font-semibold text-base tracking-tight">Perfil</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pt-6 space-y-6 animate-page-in">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 py-4 animate-fade-in">
          <div className="h-20 w-20 rounded-full bg-foreground/10 flex items-center justify-center text-2xl font-bold">
            {getUserInitial(user?.email)}
          </div>
          <div className="text-center">
            <h2 className="font-semibold text-lg">{getUserName(user?.email)}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Categories */}
        <Card className="border-0 shadow-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Suas Categorias</h3>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <div key={cat.name} className={`flex items-center gap-2 ${cat.class} border rounded-xl p-3`}>
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-0 shadow-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Notificações</span>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Modo Escuro</span>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
            <Separator />
            <button
              onClick={handleLogout}
              className="flex items-center justify-between w-full p-4 hover:bg-secondary/50 transition-colors rounded-b-xl"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-red-500">Sair</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground pt-4">TempoApp v1.0.0</p>
      </main>
    </div>
  );
};

export default ProfilePage;
