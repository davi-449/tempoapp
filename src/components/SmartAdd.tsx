import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, MapPin, Clock, Calendar as CalIcon, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useCategories } from "@/hooks/useCategories";

export const SmartAdd = () => {
  const { categories } = useCategories();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [duration, setDuration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAdd = async (ignoreConflict = false) => {
    if (!title.trim()) return;
    setIsLoading(true);
    setConflictWarning(null);

    try {
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      const startTime = new Date(`${date}T${time}:00`).toISOString();

      let durationMinutes = duration ? parseInt(duration) : 60;

      // Only run conflict-engine if we are not forcing the save
      if (!ignoreConflict) {
        toast({
          title: "Analisando agenda...",
          description: "Verificando conflitos e estimando duração com IA.",
        });

        const { data: conflictData, error: funcError } = await supabase.functions.invoke('conflict-engine', {
          body: { title, proposed_start_time: startTime, location: location || null, user_id: userId, category: category || 'Sem Categoria' }
        });

        if (funcError) throw funcError;

        if (conflictData?.has_conflict) {
          setConflictWarning(conflictData.warning);
          setIsLoading(false);
          return;
        }

        if (conflictData?.estimated_minutes && !duration) {
          durationMinutes = conflictData.estimated_minutes;
        }
      }

      const endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60000).toISOString();

      const { error: insertError } = await supabase.from('tasks').insert({
        title,
        category: category || categories[0]?.name || 'Sem Categoria',
        location: location || null,
        start_time: startTime,
        end_time: endTime,
        estimated_duration_minutes: durationMinutes,
        user_id: userId,
      });

      if (insertError) throw insertError;

      toast({
        title: "Tarefa adicionada ✓",
        description: `${title} · ${durationMinutes} min`,
      });

      // Reset
      setTitle('');
      setLocation('');
      setDuration('');
      setCategory('');
      setConflictWarning(null);
      setIsOpen(false);
      window.dispatchEvent(new Event('task-added'));
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message || "Falha ao salvar" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="h-14 w-14 rounded-[24px] shadow-float bg-primary/95 backdrop-blur-md hover:bg-primary text-primary-foreground fixed bottom-20 right-4 z-50 tap-bounce border border-white/10 transition-all duration-300 hover:scale-105"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-[32px] sm:max-w-md mx-auto p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold tracking-tight">Nova Tarefa</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5">
          {/* Title */}
          <Input
            placeholder="O que você precisa fazer?"
            className="text-base h-12 border-0 bg-secondary/60 rounded-2xl focus-visible:ring-2 focus-visible:bg-transparent transition-all"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          {/* Conflict Warning Inline */}
          <AnimatePresence>
            {conflictWarning && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex flex-col gap-3 shadow-sm"
              >
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-relaxed">{conflictWarning}</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" className="h-8 rounded-lg bg-white/50 text-xs" onClick={() => setConflictWarning(null)}>
                    Ajustar horário
                  </Button>
                  <Button size="sm" className="h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs border-0" onClick={() => handleAdd(true)}>
                    Ignorar e Adicionar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Pills */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoria</label>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className="px-3 py-2 rounded-2xl text-xs font-medium transition-all border tap-bounce"
                    style={isSelected ? {
                      borderColor: cat.color,
                      backgroundColor: `${cat.color}15`,
                      color: cat.color,
                      boxShadow: `0 0 0 2px ${cat.color}33`
                    } : {
                      borderColor: 'transparent',
                      backgroundColor: 'hsl(var(--secondary) / 0.5)',
                      color: 'hsl(var(--muted-foreground))'
                    }}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CalIcon className="h-3 w-3" /> Data
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setConflictWarning(null);
                }}
                className="h-11 bg-secondary/50 border-0 rounded-2xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Hora
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setConflictWarning(null);
                }}
                className="h-11 bg-secondary/50 border-0 rounded-2xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Duração (min)
              </label>
              <Input
                type="number"
                placeholder="IA estima..."
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  setConflictWarning(null);
                }}
                className="h-11 bg-secondary/50 border-0 rounded-2xl text-sm"
                min={1}
                max={480}
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Opcional
              </label>
              <Input
                placeholder="Endereço ou local"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 bg-secondary/50 border-0 rounded-2xl text-sm truncate"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            className={`w-full h-12 text-sm font-semibold rounded-2xl transition-all ${
              isLoading ? 'shimmer text-muted-foreground pointer-events-none' : 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-md tap-bounce'
            }`}
            onClick={() => handleAdd(false)}
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? 'Analisando agenda...' : 'Adicionar na Agenda'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
