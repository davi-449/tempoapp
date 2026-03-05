import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type TaskCategory = 'trabalho' | 'faculdade' | 'pessoal' | 'treino';

interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  startTime: string; // HH:mm format for MVP
  durationMins: number;
}

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  trabalho: "bg-blue-500 hover:bg-blue-600 text-white",
  faculdade: "bg-purple-500 hover:bg-purple-600 text-white",
  pessoal: "bg-emerald-500 hover:bg-emerald-600 text-white",
  treino: "bg-orange-500 hover:bg-orange-600 text-white"
};

export const Timeline = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        //.gte('start_time', startOfDay.toISOString()) // Removed for MVP so any task shows up if created
        //.lte('start_time', endOfDay.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error("Error fetching tasks:", error);
        return;
      }

      const formatted = (data || []).map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        startTime: new Date(t.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' }),
        durationMins: t.estimated_duration_minutes || 30
      }));

      setTasks(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    
    // Listen to our custom event
    const handleTaskAdded = () => fetchTasks();
    window.addEventListener('task-added', handleTaskAdded);
    
    return () => window.removeEventListener('task-added', handleTaskAdded);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4 pt-8 pb-32 w-full max-w-lg mx-auto">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-2xl font-semibold tracking-tight">Hoje</h2>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="relative border-l-2 border-muted pl-6 space-y-8">
        {isLoading ? (
           <span className="text-sm text-muted-foreground animate-pulse">Carregando tarefas do Supabase...</span>
        ) : tasks.length === 0 ? (
           <span className="text-sm text-muted-foreground">Sua agenda está vazia hoje.</span>
        ) : tasks.map((task) => (
          <div key={task.id} className="relative">
            {/* Timeline Dot */}
            <span className="absolute -left-[31px] top-6 flex h-4 w-4 rounded-full bg-background border-2 border-primary" />
            
            <span className="text-sm font-medium text-muted-foreground mb-2 block">{task.startTime}</span>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold leading-none">{task.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 pt-1">
                      {task.durationMins} min
                    </p>
                  </div>
                  <Badge variant="secondary" className={`${CATEGORY_COLORS[task.category]} border-0 capitalize px-2 py-0.5 whitespace-nowrap`}>
                    {task.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Mock Transit Block */}
        <div className="relative">
           <span className="absolute -left-[31px] top-4 flex h-4 w-4 rounded-full bg-background border-2 border-muted-foreground/30" />
           <div className="bg-secondary/40 border border-border/50 rounded-xl p-4 flex items-center gap-3">
             <div className="h-2 flex-grow bg-muted-foreground/20 rounded-full overflow-hidden">
                <div className="h-full bg-muted-foreground/40 w-1/3 animate-pulse" />
             </div>
             <span className="text-xs text-muted-foreground font-medium">30 min de trânsito</span>
           </div>
        </div>
      </div>
    </div>
  );
};
