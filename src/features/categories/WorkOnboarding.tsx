import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Category } from '@/types/data';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowRight } from 'lucide-react';

interface WorkOnboardingProps {
  category: Category;
  onComplete: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 })
};

export function WorkOnboarding({ category, onComplete }: WorkOnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [days, setDays] = useState<number[]>([]);
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('18:00');

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
      if (days.length === 0) throw new Error("Selecione os dias úteis.");

      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;

      // Ghost Insert if default category
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

      // Try saving settings to DB (resilient)
      try {
        await (supabase as any).from('categories').update({ 
          settings: {
            isConfigured: true,
            type: 'work',
            schedule: { days, jobTitle, companyName, timeStart, timeEnd }
          }
        }).eq('id', realCategoryId);
      } catch { /* settings column may not exist */ }

      // localStorage fallback
      const configured = JSON.parse(localStorage.getItem('configured_categories') || '{}');
      configured[category.id] = {
        isConfigured: true,
        type: 'work',
        schedule: { days, jobTitle, companyName, timeStart, timeEnd }
      };
      localStorage.setItem('configured_categories', JSON.stringify(configured));

      // Create tasks
      const insertPayloads: any[] = [];
      const today = new Date();
      const parseTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return { h, m };
      };
      const start = parseTime(timeStart);

      for (let i = 0; i < 14; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        
        if (days.includes(targetDate.getDay())) {
           targetDate.setHours(start.h, start.m, 0, 0);
           const title = `${jobTitle || 'Expediente'} @ ${companyName || 'Trabalho'}`;
           insertPayloads.push({
             title,
             category: category.name,
             status: 'pending',
             start_time: targetDate.toISOString(),
             user_id: userId
           });
        }
      }

      if (insertPayloads.length > 0) {
        const { error } = await supabase.from('tasks').insert(insertPayloads);
        if (error) console.error('Task insert error:', error);
      }
      
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
              Setup de <span style={{color: category.color}}>Carreira</span> Automático
            </h2>
            <p className="text-muted-foreground text-sm max-w-[280px]">
              Vou bloquear sua agenda para proteger seu expediente com exatidão e formalidade.
            </p>
            <Button size="lg" className="w-full mt-4 py-6 rounded-2xl" onClick={() => paginate(1)}>
               Começar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      
      case 1:
        return (
          <div className="flex flex-col space-y-6 flex-1 py-10 h-full min-h-[400px]">
             <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">Onde você atua?</h2>
             </div>
             <div className="space-y-4 w-full px-2">
                <input type="text" autoFocus className="w-full text-center text-xl bg-transparent border-b-2 font-medium focus:outline-none focus:border-foreground pb-2 placeholder:text-muted-foreground/40 transition-colors" placeholder="Empresa (Ex: Google)" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                <input type="text" className="w-full mt-6 text-center text-xl bg-transparent border-b-2 font-medium focus:outline-none focus:border-foreground pb-2 placeholder:text-muted-foreground/40 transition-colors" placeholder="Cargo (Ex: Desenvolvedor)" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
             </div>
             <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6" disabled={!jobTitle.trim() && !companyName.trim()} onClick={() => paginate(1)}>
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
               <h2 className="text-2xl font-bold tracking-tight">Seus dias úteis</h2>
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
        return (
           <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
             <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">Horário do Expediente</h2>
             </div>
             <div className="flex items-center justify-between gap-4 mt-6">
                <div className="flex-1 space-y-2">
                   <label className="text-sm font-medium text-muted-foreground pl-1">Início</label>
                   <input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className="w-full p-4 rounded-xl border-2 bg-background font-medium text-lg" />
                </div>
                <div className="flex-1 space-y-2">
                   <label className="text-sm font-medium text-muted-foreground pl-1">Fim</label>
                   <input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className="w-full p-4 rounded-xl border-2 bg-background font-medium text-lg" />
                </div>
             </div>
             <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6" disabled={isSubmitting} onClick={handleFinish}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Oficializar'}
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
