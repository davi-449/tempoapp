import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Category } from '@/types/data';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowRight } from 'lucide-react';

interface StudyOnboardingProps {
  category: Category;
  onComplete: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 })
};

export function StudyOnboarding({ category, onComplete }: StudyOnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [days, setDays] = useState<number[]>([]);
  const [focusTime, setFocusTime] = useState<number>(120);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setStep(step + newDirection);
  };

  const toggleDay = (dayIndex: number) => {
    setDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    
    try {
      if (days.length === 0) throw new Error("Selecione os dias da semana.");

      const insertPayloads = [];
      const today = new Date();
      
      // Look ahead 21 days
      for (let i = 0; i < 21; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        
        if (days.includes(targetDate.getDay())) {
           // Define evening by default
           targetDate.setHours(19, 0, 0, 0);

           const title = `📚 Foco Acadêmico: ${subject || 'Estudos'}`;
           
           insertPayloads.push({
             title: title,
             category: category.name,
             status: 'pending',
             start_time: targetDate.toISOString(),
             estimated_duration_minutes: focusTime,
             task_type: 'task',
             user_id: (await supabase.auth.getUser()).data.user?.id
           });
        }
      }

      if (insertPayloads.length > 0) {
        await supabase.from('tasks').insert(insertPayloads);
      }

      const currentSettings = (category as any).settings || {};
      const newSettings = {
         ...currentSettings,
         isConfigured: true,
         type: 'study',
         schedule: { days, subject, focusTime }
      };

      // @ts-ignore
      await (supabase as any).from('categories').update({ settings: newSettings }).eq('id', category.id);
      
      onComplete();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Erro no setup. Tente novamente.');
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
              Agenda Ninja de <span style={{color: category.color}}>Estudos</span>
            </h2>
            <p className="text-muted-foreground text-sm max-w-[280px]">
              Vou montar seus slots de estudo profundo ("Deep Work") para evitar procrastinação.
            </p>
            <Button size="lg" className="w-full mt-4 py-6 rounded-2xl" onClick={() => paginate(1)}>
               Começar Planejamento <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      
      case 1:
        return (
          <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
             <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">O que você está focado em dominar agora?</h2>
             </div>
             <input type="text" autoFocus className="w-full text-center text-xl bg-transparent border-b-2 font-medium focus:outline-none focus:border-foreground pb-2 placeholder:text-muted-foreground/40 transition-colors" placeholder="Ex: React Masterclass / Concurso Receita" value={subject} onChange={(e) => setSubject(e.target.value)} />
             <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6" disabled={!subject.trim()} onClick={() => paginate(1)}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 2:
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return (
          <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
             <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">Dias de Aula/Estudo</h2>
             </div>
             <div className="flex flex-wrap gap-3 justify-center mt-4">
                {weekDays.map((d, index) => (
                  <button key={d} onClick={() => toggleDay(index)} className={`h-14 w-14 rounded-full font-medium border-2 transition-all ${days.includes(index) ? 'border-foreground bg-foreground text-background scale-105 shadow-xl' : 'border-border/50 bg-white text-muted-foreground hover:border-foreground/30'}`}>
                    {d}
                  </button>
                ))}
             </div>
             <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6" disabled={days.length === 0} onClick={() => paginate(1)}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        const focusTimes = [30, 60, 90, 120, 180];
        return (
           <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
             <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">Tempo de Foco</h2>
               <p className="text-muted-foreground text-sm">Quantos minutos ininterruptos?</p>
             </div>
             <div className="flex flex-col gap-3 mt-4">
                {focusTimes.map(t => (
                  <button key={t} onClick={() => setFocusTime(t)} className={`py-4 rounded-2xl font-medium border-2 transition-all ${focusTime === t ? 'border-foreground bg-foreground text-background scale-[1.02] shadow-xl' : 'border-border/50 bg-white text-muted-foreground hover:border-foreground/30'}`}>
                    {t} Minutos
                  </button>
                ))}
             </div>
             <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6" disabled={isSubmitting} onClick={handleFinish}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Finalizar Setup Acadêmico'}
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
