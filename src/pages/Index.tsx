import React from "react";
import { Timeline } from "@/components/Timeline";
import { SmartAdd } from "@/components/SmartAdd";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-16">
      <header className="sticky top-0 z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="container flex h-16 max-w-lg items-center px-4 mx-auto">
          <div className="font-semibold text-lg tracking-tight">TempoApp</div>
          <div className="ml-auto w-8 h-8 rounded-full bg-secondary overflow-hidden border">
             {/* Avatar placeholder */}
             <img src="https://i.pravatar.cc/100" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto p-4">
        {/* Mock Project Accordions summary */}
        <section className="mt-2 mb-8 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Projetos Ativos</h3>
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex flex-col gap-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Marketing Tork</span>
                <div className="h-1.5 w-full bg-blue-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[60%]" />
                </div>
                <span className="text-xs text-muted-foreground mt-1">Vence em 2 dias (Risco Alto)</span>
             </div>
             
             <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl flex flex-col gap-2">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-400">TCC Faculdade</span>
                <div className="h-1.5 w-full bg-purple-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[30%]" />
                </div>
                <span className="text-xs text-muted-foreground mt-1">Vence em 14 dias (Tranquilo)</span>
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
