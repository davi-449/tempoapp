import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Category } from '@/types/data';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowRight, Plus, Trash2 } from 'lucide-react';

interface StudyOnboardingProps {
  category: Category;
  onComplete: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 })
};

type Subject = { id: string; name: string; professor: string; days: number[] };

export function StudyOnboarding({ category, onComplete }: StudyOnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [institution, setInstitution] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tempName, setTempName] = useState('');
  const [tempProf, setTempProf] = useState('');
  const [classTime, setClassTime] = useState<number>(60);
  const [homeTime, setHomeTime] = useState<number>(60);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setStep(step + newDirection);
  };

  const addSubject = () => {
    if (!tempName) return;
    setSubjects([...subjects, { id: Math.random().toString(), name: tempName, professor: tempProf, days: [] }]);
    setTempName('');
    setTempProf('');
  };

  const toggleSubjectDay = (subjId: string, dayIndex: number) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjId) {
        const hasDay = s.days.includes(dayIndex);
        return { ...s, days: hasDay ? s.days.filter(d => d !== dayIndex) : [...s.days, dayIndex] };
      }
      return s;
    }));
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
          settings: {
            isConfigured: true,
            type: 'study',
            schedule: { institution, subjects, classTime, homeTime }
          }
        }).eq('id', realCategoryId);
      } catch { /* settings column may not exist */ }

      // localStorage fallback
      const configured = JSON.parse(localStorage.getItem('configured_categories') || '{}');
      configured[category.id] = {
        isConfigured: true,
        type: 'study',
        schedule: { institution, subjects, classTime, homeTime }
      };
      localStorage.setItem('configured_categories', JSON.stringify(configured));

      // Generate tasks
      const insertPayloads: any[] = [];
      const today = new Date();
      
      for (let i = 0; i < 21; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const dayOfWeek = targetDate.getDay();
        
        const daySubjects = subjects.filter(s => s.days.includes(dayOfWeek));
        
        daySubjects.forEach(subj => {
           const classDT = new Date(targetDate);
           classDT.setHours(8, 0, 0, 0);
           insertPayloads.push({
             title: `Aula: ${subj.name} (${subj.professor || 'Sem Prof.'}) @ ${institution || 'Local'}`,
             category: category.name,
             status: 'pending',
             start_time: classDT.toISOString(),
             estimated_duration_minutes: classTime,
             user_id: userId
           });

           const homeDT = new Date(targetDate);
           homeDT.setHours(19, 0, 0, 0);
           insertPayloads.push({
             title: `📚 Foco Pós-Aula: ${subj.name}`,
             category: category.name,
             status: 'pending',
             start_time: homeDT.toISOString(),
             estimated_duration_minutes: homeTime,
             user_id: userId
           });
        });
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
              Setup Ninja da sua <span style={{color: category.color}}>Rotina Escolar</span>
            </h2>
            <p className="text-muted-foreground text-sm max-w-[280px]">
              Vou mapear suas matérias, professores e dias pra blindar seu tempo e garantir aprovações.
            </p>
            <Button size="lg" className="w-full mt-4 py-6 rounded-2xl" onClick={() => paginate(1)}>
               Montar Grade de Estudos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      
      case 1:
        return (
          <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
             <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">Qual sua Instituição?</h2>
               <p className="text-muted-foreground text-sm">Onde você vai conquistar o mundo.</p>
             </div>
             <input type="text" autoFocus className="w-full text-center text-xl bg-transparent border-b-2 font-medium focus:outline-none focus:border-foreground pb-2 placeholder:text-muted-foreground/40 transition-colors" placeholder="Ex: USP / Descomplica" value={institution} onChange={(e) => setInstitution(e.target.value)} />
             <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6" disabled={!institution.trim()} onClick={() => paginate(1)}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col flex-1 py-4 h-[60vh] overflow-hidden">
             <div className="space-y-1 text-center mb-6 shrink-0">
               <h2 className="text-xl font-bold tracking-tight">Suas Matérias Mestre</h2>
             </div>
             <div className="flex flex-col gap-3 shrink-0">
                <input type="text" className="w-full p-3 rounded-xl border-2 bg-background font-medium focus:border-foreground outline-none" placeholder="Nome da Disciplina..." value={tempName} onChange={(e) => setTempName(e.target.value)} />
                <div className="flex gap-2">
                   <input type="text" className="flex-1 p-3 rounded-xl border-2 bg-background font-medium focus:border-foreground outline-none text-sm" placeholder="Professor (Opcional)" value={tempProf} onChange={(e) => setTempProf(e.target.value)} />
                   <Button onClick={addSubject} disabled={!tempName} className="h-full px-6 rounded-xl"><Plus className="w-5 h-5" /></Button>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto mt-6 space-y-2 pr-1 pb-10">
                {subjects.map(s => (
                   <div key={s.id} className="p-3 bg-secondary/30 border border-border/40 rounded-xl flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                         <p className="font-semibold text-sm truncate">{s.name}</p>
                         {s.professor && <p className="text-xs text-muted-foreground truncate">Prof. {s.professor}</p>}
                      </div>
                      <button onClick={() => setSubjects(prev => prev.filter(x => x.id !== s.id))} className="text-rose-500/70 hover:text-rose-500 p-2"><Trash2 className="w-4 h-4" /></button>
                   </div>
                ))}
                {subjects.length === 0 && <p className="text-center text-sm text-muted-foreground mt-4 italic">Nenhuma adicionada ainda.</p>}
             </div>
             <div className="shrink-0 pt-4 bg-background mt-auto">
              <Button size="lg" className="w-full rounded-2xl py-6" disabled={subjects.length === 0} onClick={() => paginate(1)}>
                Mapear Dias <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case 3:
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return (
           <div className="flex flex-col flex-1 py-4 h-[60vh]">
             <div className="space-y-1 text-center shrink-0 mb-4">
               <h2 className="text-xl font-bold tracking-tight">Conectando os Dias</h2>
               <p className="text-muted-foreground text-xs px-4">Selecione em que dias acontecem cada aula.</p>
             </div>
             <div className="flex-1 overflow-y-auto space-y-6 pb-20 pr-1">
                {subjects.map(subj => (
                   <div key={subj.id} className="space-y-3">
                      <p className="font-semibold text-sm px-1 border-l-2 pl-2" style={{borderColor: category.color}}>{subj.name}</p>
                      <div className="flex flex-wrap gap-2">
                         {weekDays.map((d, index) => (
                          <button key={d} onClick={() => toggleSubjectDay(subj.id, index)} className={`h-10 w-10 text-xs rounded-full font-medium border-2 transition-all ${subj.days.includes(index) ? 'border-foreground bg-foreground text-background scale-105' : 'border-border/50 bg-white text-muted-foreground'}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                   </div>
                ))}
             </div>
             <div className="shrink-0 pt-6 mt-auto">
              <Button size="lg" className="w-full rounded-2xl py-6" onClick={() => paginate(1)}>
                Avançar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
           </div>
        );

      case 4:
        return (
           <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
             <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">O Fator Decisivo</h2>
               <p className="text-muted-foreground text-sm">Tempo de retenção do conteúdo.</p>
             </div>
             <div className="space-y-6 mt-4">
                <div className="space-y-2">
                   <label className="text-sm font-semibold flex items-center justify-between">Duração das Aulas <span className="text-primary">{classTime} min</span></label>
                   <input type="range" min="30" max="240" step="10" value={classTime} onChange={e => setClassTime(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div className="space-y-2 pt-4 border-t">
                   <label className="text-sm font-semibold flex items-center justify-between">Revisão/Lição de Casa <span className="text-primary">{homeTime} min</span></label>
                   <input type="range" min="30" max="240" step="10" value={homeTime} onChange={e => setHomeTime(Number(e.target.value))} className="w-full accent-primary" />
                </div>
             </div>
             <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6" disabled={isSubmitting} onClick={handleFinish}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Finalizar Super Agendamento'}
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
