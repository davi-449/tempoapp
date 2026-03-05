import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, MapPin, Clock, Calendar as CalIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type TaskCategory = 'trabalho' | 'faculdade' | 'pessoal' | 'treino';

const CATEGORIES: { key: TaskCategory; label: string; emoji: string; class: string }[] = [
  { key: 'pessoal', label: 'Pessoal', emoji: '🏠', class: 'cat-pessoal' },
  { key: 'trabalho', label: 'Trabalho', emoji: '💼', class: 'cat-trabalho' },
  { key: 'treino', label: 'Treino', emoji: '🏋️', class: 'cat-treino' },
  { key: 'faculdade', label: 'Faculdade', emoji: '📚', class: 'cat-faculdade' },
];

interface TaskEditSheetProps {
  task: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export const TaskEditSheet = ({ task, open, onOpenChange, onSaved }: TaskEditSheetProps) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('pessoal');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setCategory(task.category || 'pessoal');
      setLocation(task.location || '');
      setDuration(task.estimated_duration_minutes?.toString() || '');
      if (task.start_time) {
        const d = new Date(task.start_time);
        setDate(format(d, 'yyyy-MM-dd'));
        setTime(format(d, 'HH:mm'));
      }
      setConfirmDelete(false);
    }
  }, [task]);

  const handleSave = async () => {
    if (!title.trim() || !task) return;
    setIsSaving(true);

    try {
      const startTime = new Date(`${date}T${time}:00`).toISOString();
      const durationMin = duration ? parseInt(duration) : task.estimated_duration_minutes || 60;
      const endTime = new Date(new Date(startTime).getTime() + durationMin * 60000).toISOString();

      const { error } = await supabase.from('tasks').update({
        title,
        category,
        location: location || null,
        start_time: startTime,
        end_time: endTime,
        estimated_duration_minutes: durationMin,
      }).eq('id', task.id);

      if (error) throw error;

      toast({ title: "Tarefa atualizada ✓" });
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) throw error;

      toast({ title: "Tarefa removida ✓" });
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[32px] sm:max-w-md mx-auto p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold tracking-tight">Editar Tarefa</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5">
          <Input
            placeholder="Título da tarefa"
            className="text-base h-12 border-0 bg-secondary/50 rounded-2xl focus-visible:ring-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
                  className={`px-3 py-2 rounded-2xl text-xs font-medium transition-all border tap-bounce ${
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

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CalIcon className="h-3 w-3" /> Data
              </label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 bg-secondary/50 border-0 rounded-2xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Hora
              </label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11 bg-secondary/50 border-0 rounded-2xl text-sm" />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Duração (min)
            </label>
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="h-11 bg-secondary/50 border-0 rounded-2xl text-sm" min={1} max={480} />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Localização
            </label>
            <Input placeholder="Endereço ou local" value={location} onChange={(e) => setLocation(e.target.value)} className="h-11 bg-secondary/50 border-0 rounded-2xl text-sm" />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="destructive"
              className="flex-1 h-12 rounded-2xl tap-bounce"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {confirmDelete ? "Confirmar exclusão" : "Excluir"}
                </>
              )}
            </Button>
            <Button
              className="flex-1 h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 tap-bounce"
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
