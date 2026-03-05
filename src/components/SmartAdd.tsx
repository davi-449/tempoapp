import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, MapPin, Clock, Calendar as CalIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

type TaskCategory = 'trabalho' | 'faculdade' | 'pessoal' | 'treino';

const CATEGORIES: { key: TaskCategory; label: string; emoji: string; class: string }[] = [
  { key: 'pessoal', label: 'Pessoal', emoji: '🏠', class: 'cat-pessoal' },
  { key: 'trabalho', label: 'Trabalho', emoji: '💼', class: 'cat-trabalho' },
  { key: 'treino', label: 'Treino', emoji: '🏋️', class: 'cat-treino' },
  { key: 'faculdade', label: 'Faculdade', emoji: '📚', class: 'cat-faculdade' },
];

export const SmartAdd = () => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<TaskCategory>('pessoal');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [duration, setDuration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAdd = async () => {
    if (!title.trim()) return;
    setIsLoading(true);

    try {
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      const startTime = new Date(`${date}T${time}:00`).toISOString();

      toast({
        title: "Analisando agenda...",
        description: "Verificando conflitos e estimando duração.",
      });

      // Call the Edge Function
      const { data: conflictData, error: funcError } = await supabase.functions.invoke('conflict-engine', {
        body: {
          title,
          proposed_start_time: startTime,
          location: location || null,
          user_id: userId,
          category,
        }
      });

      if (funcError) throw funcError;

      if (conflictData?.has_conflict) {
        toast({
          variant: "destructive",
          title: "Conflito detectado ⚠️",
          description: conflictData.warning,
        });
        setIsLoading(false);
        return;
      }

      // Calculate end time
      const durationMinutes = duration ? parseInt(duration) : (conflictData?.estimated_minutes || 60);
      const endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60000).toISOString();

      // Insert task
      const { error: insertError } = await supabase.from('tasks').insert({
        title,
        category,
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

      // Reset form
      setTitle('');
      setLocation('');
      setDuration('');
      setCategory('pessoal');
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
          className="h-14 w-14 rounded-full shadow-nav bg-foreground hover:bg-foreground/90 text-background fixed bottom-20 right-4 z-50 tap-bounce"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl sm:max-w-md mx-auto p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold tracking-tight">Nova Tarefa</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5">
          {/* Title */}
          <Input
            placeholder="O que você precisa fazer?"
            className="text-base h-12 border-0 bg-secondary/50 rounded-xl focus-visible:ring-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          {/* Category Pills */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoria</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border tap-bounce ${
                    category === cat.key
                      ? `${cat.class} border-current`
                      : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
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
                onChange={(e) => setDate(e.target.value)}
                className="h-11 bg-secondary/50 border-0 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Hora
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 bg-secondary/50 border-0 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Duração (min) — opcional, a IA estima se vazio
            </label>
            <Input
              type="number"
              placeholder="Ex: 45"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="h-11 bg-secondary/50 border-0 rounded-xl text-sm"
              min={1}
              max={480}
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Localização — opcional
            </label>
            <Input
              placeholder="Endereço ou local"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-11 bg-secondary/50 border-0 rounded-xl text-sm"
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full h-12 text-sm font-semibold rounded-xl bg-foreground text-background hover:bg-foreground/90 tap-bounce"
            onClick={handleAdd}
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              'Adicionar na Agenda'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
