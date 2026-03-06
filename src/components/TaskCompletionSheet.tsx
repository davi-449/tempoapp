import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { estimateCalories, getUserWeight } from '@/hooks/useCalorieEstimator';
import { Loader2, Star, Flame } from 'lucide-react';

interface TaskCompletionSheetProps {
  task: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  categoryType?: string;
}

export function TaskCompletionSheet({ task, open, onOpenChange, onConfirm, categoryType }: TaskCompletionSheetProps) {
  const [notes, setNotes] = useState('');
  const [actualDuration, setActualDuration] = useState(60);
  const [intensity, setIntensity] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedCals, setEstimatedCals] = useState(0);

  const isWorkout = categoryType === 'workout' || task?.category?.toLowerCase() === 'treino';
  const isStudy = categoryType === 'study' || task?.category?.toLowerCase() === 'faculdade';

  useEffect(() => {
    if (task) {
      setActualDuration(task.estimated_duration_minutes || 60);
      setNotes('');
      setIntensity(3);
    }
  }, [task]);

  useEffect(() => {
    if (isWorkout) {
      const weight = getUserWeight();
      setEstimatedCals(estimateCalories(weight, actualDuration));
    }
  }, [actualDuration, isWorkout]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;

      // Try saving completion log
      try {
        await (supabase as any).from('task_completion_logs').insert({
          task_id: task.id,
          user_id: userId,
          notes: notes || null,
          actual_duration_minutes: isWorkout ? actualDuration : null,
          perceived_intensity: isWorkout ? intensity : null,
          estimated_calories: isWorkout ? estimatedCals : null,
          category: task.category,
          log_type: isWorkout ? 'workout' : isStudy ? 'study' : 'general'
        });
      } catch {
        // table may not exist yet — degrade gracefully
        console.warn('task_completion_logs table not found, skipping log');
      }

      onConfirm();
    } catch (e) {
      console.error(e);
      onConfirm(); // still complete the task
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[28px] max-h-[80vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">
            ✅ {isWorkout ? 'Treino Concluído!' : isStudy ? 'Aula Concluída!' : 'Tarefa Concluída!'}
          </SheetTitle>
          <p className="text-sm text-muted-foreground truncate">{task.title}</p>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {/* Workout-specific fields */}
          {isWorkout && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center justify-between">
                  ⏱ Duração real <span className="text-primary">{actualDuration} min</span>
                </label>
                <input type="range" min="10" max="180" step="5" value={actualDuration} onChange={e => setActualDuration(Number(e.target.value))} className="w-full accent-primary" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">💪 Intensidade percebida</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} onClick={() => setIntensity(v)} className={`p-2 rounded-xl transition-all ${intensity >= v ? 'text-amber-500 scale-110' : 'text-muted-foreground/30'}`}>
                      <Star className="w-7 h-7" fill={intensity >= v ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-4">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-lg font-bold text-orange-600">~{estimatedCals} kcal</span>
                <span className="text-xs text-muted-foreground">estimadas</span>
              </div>
            </>
          )}

          {/* Notes (universal, but emphasized for Study) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              {isStudy ? '📝 Notas da Aula' : '📝 Notas (opcional)'}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={isStudy ? 'O que foi ensinado hoje? Anote pra revisar depois...' : 'Alguma observação?'}
              className="w-full p-3 rounded-xl border-2 bg-background min-h-[80px] resize-none focus:border-foreground outline-none text-sm"
              rows={isStudy ? 5 : 3}
            />
          </div>

          <Button size="lg" className="w-full rounded-2xl py-6" disabled={isSubmitting} onClick={handleConfirm}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar e Concluir'}
          </Button>

          <button onClick={() => { onConfirm(); }} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
            Pular e só concluir
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
