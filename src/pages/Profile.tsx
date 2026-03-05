import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Moon, LogOut, ChevronRight } from "lucide-react";

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="container flex h-16 max-w-lg items-center px-4 mx-auto">
          <div className="font-semibold text-lg tracking-tight">Perfil</div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto p-4 space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="h-20 w-20 rounded-full bg-secondary overflow-hidden border-2 border-primary/20">
            <img src="https://i.pravatar.cc/200" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h2 className="font-semibold text-lg">Usuário TempoApp</h2>
            <p className="text-sm text-muted-foreground">usuario@email.com</p>
          </div>
        </div>

        {/* Categories Summary */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Suas Categorias</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Trabalho", color: "bg-blue-500", emoji: "💼" },
                { name: "Faculdade", color: "bg-purple-500", emoji: "📚" },
                { name: "Pessoal", color: "bg-emerald-500", emoji: "🏠" },
                { name: "Treino", color: "bg-orange-500", emoji: "🏋️" },
              ].map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 bg-secondary/30 rounded-xl p-3">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-0 shadow-lg">
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
              <Switch />
            </div>
            <Separator />
            <button className="flex items-center justify-between w-full p-4 hover:bg-secondary/50 transition-colors rounded-b-xl">
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
