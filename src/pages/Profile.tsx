import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bell, Moon, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AvatarUpload } from "@/components/AvatarUpload";
import { useCategories } from "@/hooks/useCategories";
import { CategoryManager } from "@/components/CategoryManager";

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
  const { categories } = useCategories();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.className.includes('dark'));
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getProfile() {
      if (!user) return;
      const { data } = await (supabase as any).from('profiles').select('avatar_url').eq('id', user.id).single();
      if (data) setAvatarUrl(data.avatar_url);
    }
    getProfile();
  }, [user]);

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
        <div className="flex flex-col items-center gap-4 py-2 animate-fade-in">
          <AvatarUpload 
            url={avatarUrl} 
            onUpload={(url) => setAvatarUrl(url)} 
            size={96} 
          />
          <div className="text-center">
            <h2 className="font-semibold text-lg">{getUserName(user?.email)}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Categories */}
        <Card className="border-0 shadow-card rounded-[24px] animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suas Categorias</h3>
              <CategoryManager />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div key={cat.id} className="flex flex-col items-center justify-center gap-1 border-0 shadow-sm rounded-[20px] p-4 tap-bounce" style={{ backgroundColor: `${cat.color}15` }}>
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-sm font-semibold" style={{ color: cat.color }}>{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-0 shadow-card rounded-[24px] overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
