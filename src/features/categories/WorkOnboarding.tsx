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
  
  // Novo estado: horários específicos por dia
  const [dayTimes, setDayTimes] = useState<Record<number, { start: string, end: string }>>({});
  
  // Horário padrão
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('18:00');

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setStep(step + newDirection);
  };

  const toggleDay = (dayIndex: number) => {
    setDays(prev => {
      if (prev.includes(dayIndex)) {
        const newDays = prev.filter(d => d !== dayIndex);
        // Remove o horário específico se desmarcar o dia
        const newDayTimes = { ...dayTimes };
        delete newDayTimes[dayIndex];
        setDayTimes(newDayTimes);
        return newDays;
      } else {
        // Ao adicionar um dia, define o horário padrão
        setDayTimes(dt => ({ ...dt, [dayIndex]: { start: timeStart, end: timeEnd } }));
        return [...prev, dayIndex];
      }
    });
  };

  const updateDayTime = (dayIndex: number, field: 'start' | 'end', value: string) => {
    setDayTimes(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [field]: value
      }
    }));
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
            schedule: { days, jobTitle, companyName, dayTimes, defaultStart: timeStart, defaultEnd: timeEnd }
          }
        }).eq('id', realCategoryId);
      } catch { /* settings column may not exist */ }

      // localStorage fallback
      const configured = JSON.parse(localStorage.getItem('configured_categories') || '{}');
      configured[category.id] = {
        isConfigured: true,
        type: 'work',
        schedule: { days, jobTitle, companyName, dayTimes, defaultStart: timeStart, defaultEnd: timeEnd }
      };
      localStorage.setItem('configured_categories', JSON.stringify(configured));

      // Create tasks
      const insertPayloads: any[] = [];
      const today = new Date();
      
      const parseTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return { h, m };
      };

      for (let i = 0; i < 14; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const dayOfWeek = targetDate.getDay();

        if (days.includes(dayOfWeek)) {
           // Usa o horário específico do dia, ou o padrão se não existir
           const specificTime = dayTimes[dayOfWeek] || { start: timeStart, end: timeEnd };
           const start = parseTime(specificTime.start);
           const end = parseTime(specificTime.end);
           
           targetDate.setHours(start.h, start.m, 0, 0);
           
           // Calcula a duração em minutos
           const durationMinutes = (end.h * 60 + end.m) - (start.h * 60 + start.m);
           
           const title = `${jobTitle || 'Expediente'} @ ${companyName || 'Trabalho'}`;
           insertPayloads.push({
             title,
             category: category.name,
             status: 'pending',
             start_time: targetDate.toISOString(),
             estimated_duration_minutes: durationMinutes > 0 ? durationMinutes : 480, // fallback 8h
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
            <Button size="lg" className="w-full mt-4 py-6 rounded-2xl font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" onClick={() => paginate(1)}>
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
                <input type="text" autoFocus className="w-full text-center text-2xl bg-transparent border-b-2 border-border/50 font-bold focus:outline-none focus:border-primary pb-3 placeholder:text-muted-foreground/30 transition-all" placeholder="Empresa (Ex: Google)" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                <input type="text" className="w-full mt-6 text-center text-xl bg-transparent border-b-2 font-medium focus:outline-none focus:border-foreground pb-2 placeholder:text-muted-foreground/40 transition-colors" placeholder="Cargo (Ex: Desenvolvedor)" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
             </div>
             <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6 font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" disabled={!jobTitle.trim() && !companyName.trim()} onClick={() => paginate(1)}>
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
                  <button key={d} onClick={() => toggleDay(index)} className={`h-14 w-14 rounded-full font-medium border-2 transition-all ${days.includes(index) ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/40' : 'border-border/50 bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:bg-secondary/60'}`}>
                    {d}
                  </button>
                ))}
             </div>
             <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6 font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" disabled={days.length === 0} onClick={() => paginate(1)}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        const weekDaysNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return (
           <div className="flex flex-col flex-1 py-4 h-[60vh]">
             <div className="space-y-2 text-center shrink-0 mb-4">
               <h2 className="text-2xl font-bold tracking-tight">Horário do Expediente</h2>
               <p className="text-muted-foreground text-sm">Ajuste os horários para cada dia, se necessário.</p>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-4 pb-20 pr-1">
                {/* Horário Padrão (Aplica para todos os novos dias) */}
                <div className="p-4 bg-secondary/30 border border-border/40 rounded-xl mb-6">
                  <p className="font-semibold text-sm mb-3 text-center">Horário Padrão</p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                       <label className="text-xs font-medium text-muted-foreground pl-1">Início</label>
                       <input type="time" value={timeStart} onChange={(e) => {
                         setTimeStart(e.target.value);
                         // Atualiza todos os dias que ainda estão com o horário padrão antigo
                         const newDayTimes = { ...dayTimes };
                         days.forEach(d => {
                           if (newDayTimes[d]?.start === timeStart) {
                             newDayTimes[d].start = e.target.value;
                           }
                         });
                         setDayTimes(newDayTimes);
                       }} className="w-full p-2 rounded-lg border bg-background font-medium text-sm" />
                    </div>
                    <div className="flex-1 space-y-1">
                       <label className="text-xs font-medium text-muted-foreground pl-1">Fim</label>
                       <input type="time" value={timeEnd} onChange={(e) => {
                         setTimeEnd(e.target.value);
                         const newDayTimes = { ...dayTimes };
                         days.forEach(d => {
                           if (newDayTimes[d]?.end === timeEnd) {
                             newDayTimes[d].end = e.target.value;
                           }
                         });
                         setDayTimes(newDayTimes);
                       }} className="w-full p-2 rounded-lg border bg-background font-medium text-sm" />
                    </div>
                  </div>
                </div>

                {/* Horários Específicos por Dia */}
                <div className="space-y-3">
                  <p className="font-semibold text-sm px-1">Ajustes Específicos:</p>
                  {days.sort().map(dayIndex => (
                    <div key={dayIndex} className="flex items-center justify-between p-3 border rounded-xl bg-background">
                      <span className="font-medium text-sm w-20">{weekDaysNames[dayIndex]}</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="time" 
                          value={dayTimes[dayIndex]?.start || timeStart} 
                          onChange={(e) => updateDayTime(dayIndex, 'start', e.target.value)}
                          className="p-1.5 rounded border bg-secondary/50 text-xs w-20 text-center" 
                        />
                        <span className="text-muted-foreground text-xs">até</span>
                        <input 
                          type="time" 
                          value={dayTimes[dayIndex]?.end || timeEnd} 
                          onChange={(e) => updateDayTime(dayIndex, 'end', e.target.value)}
                          className="p-1.5 rounded border bg-secondary/50 text-xs w-20 text-center" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
             </div>
             
             <div className="shrink-0 pt-6 mt-auto">
              <Button size="lg" className="w-full rounded-2xl py-6 font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" disabled={isSubmitting} onClick={handleFinish}>
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
