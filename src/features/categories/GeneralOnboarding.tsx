import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Category } from '@/types/data';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowRight } from 'lucide-react';

interface GeneralOnboardingProps {
  category: Category;
  onComplete: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 })
};

type RoutineFrequency = '1x' | '2x' | '3x' | '4x' | '5x' | 'daily';

export function GeneralOnboarding({ category, onComplete }: GeneralOnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [goal, setGoal] = useState<string>('');
  const [frequency, setFrequency] = useState<RoutineFrequency | null>(null);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setStep(step + newDirection);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;

      // Ghost Insert if default
      let realCategoryId = category.id;
      if (category.id.startsWith('default-')) {
        try {
          const { data, error } = await supabase.from('categories').insert({
            name: category.name,
            color: category.color,
            emoji: category.emoji,
            user_id: userId
          } as any).select().single();
          if (!error && data) realCategoryId = data.id;
        } catch { /* fallback */ }
      }

      // Try saving settings (resilient)
      try {
        await (supabase as any).from('categories').update({ 
          settings: { isConfigured: true, goal, frequency }
        }).eq('id', realCategoryId);
      } catch { /* settings column may not exist */ }

      // localStorage fallback
      const configured = JSON.parse(localStorage.getItem('configured_categories') || '{}');
      configured[category.id] = { isConfigured: true, goal, frequency };
      localStorage.setItem('configured_categories', JSON.stringify(configured));

      // Generate tasks
      const insertPayloads: any[] = [];
      const today = new Date();
      let daysCount = 0;
      
      switch (frequency) {
        case 'daily': daysCount = 14; break;
        case '5x': daysCount = 10; break;
        case '4x': daysCount = 8; break;
        case '3x': daysCount = 6; break;
        case '2x': daysCount = 4; break;
        case '1x': daysCount = 2; break;
        default: daysCount = 2;
      }

      for (let i = 0; i < daysCount; i++) {
         const targetDate = new Date();
         targetDate.setDate(today.getDate() + (i * Math.floor(14/daysCount)));
         insertPayloads.push({
           title: `Minha Rotina de ${category.name}`,
           category: category.name,
           status: 'pending',
           start_time: targetDate.toISOString(),
           user_id: userId
         });
      }

      if (insertPayloads.length > 0) {
        const { error } = await supabase.from('tasks').insert(insertPayloads);
        if (error) console.error('Task insert error:', error);
      }
      
      onComplete();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Tivemos um problema. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-6 flex-1 py-10 h-full min-h-[400px]">
            <div className="w-20 h-20 rounded-3xl flex flex-col items-center justify-center mb-2 shadow-2xl" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
              <span className="text-4xl">{category.emoji}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-balance">
              Vamos dominar sua área de <span style={{color: category.color}}>{category.name}</span>!
            </h2>
            <p className="text-muted-foreground text-sm max-w-[280px]">
              Para economizar seu tempo, vou configurar algumas tarefas semanais automaticamente pra você.
            </p>
            <Button size="lg" className="w-full mt-4 py-6 rounded-2xl font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" onClick={() => paginate(1)}>
              Começar Setup <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      
      case 1:
        return (
          <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
            <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">Qual sua meta principal?</h2>
               <p className="text-muted-foreground text-sm">Resuma o que deseja alcançar.</p>
            </div>
            <input type="text" autoFocus className="w-full text-center text-2xl bg-transparent border-b-2 border-border/50 font-bold focus:outline-none focus:border-primary pb-3 placeholder:text-muted-foreground/30 transition-all" placeholder="Ex: Evoluir hoje" value={goal} onChange={(e) => setGoal(e.target.value)} />
            <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6 font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" disabled={!goal.trim()} onClick={() => paginate(1)}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 2:
        const freqs = ['1x', '2x', '3x', '4x', '5x', 'daily'];
        return (
           <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
             <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">Qual a frequência?</h2>
               <p className="text-muted-foreground text-sm">Para criarmos as rotinas no seu calendário.</p>
             </div>
             <div className="grid grid-cols-2 gap-3 mt-4">
                {freqs.map(f => (
                  <button key={f} onClick={() => setFrequency(f as RoutineFrequency)} className={`py-4 rounded-2xl font-medium border-2 transition-all ${frequency === f ? 'border-primary bg-primary text-primary-foreground scale-[1.03] shadow-lg shadow-primary/40' : 'border-border/50 bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:bg-secondary/60'}`}>
                    {f === 'daily' ? 'Todo dia' : f + ' na semana'}
                  </button>
                ))}
             </div>
             <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6 font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" disabled={!frequency || isSubmitting} onClick={handleFinish}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Finalizar Setup'}
              </Button>
            </div>
           </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-background overflow-hidden relative">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }} className="w-full max-w-sm absolute top-10">
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
