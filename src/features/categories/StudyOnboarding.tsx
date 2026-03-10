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

type Subject = { id: string; name: string; professor: string; days: number[]; startTime: string };

export function StudyOnboarding({ category, onComplete }: StudyOnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [institution, setInstitution] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tempName, setTempName] = useState('');
  const [tempProf, setTempProf] = useState('');
  const [tempTime, setTempTime] = useState('08:00');
  const [classTime, setClassTime] = useState<number>(50);
  const [enableHomeStudy, setEnableHomeStudy] = useState(false);
  const [homeTime, setHomeTime] = useState<number>(60);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setStep(step + newDirection);
  };

  const addSubject = () => {
    if (!tempName) return;
    setSubjects([...subjects, {
      id: Math.random().toString(),
      name: tempName,
      professor: tempProf,
      days: [],
      startTime: tempTime
    }]);
    setTempName('');
    setTempProf('');
    setTempTime('08:00');
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

  const updateSubjectTime = (subjId: string, newTime: string) => {
    setSubjects(prev => prev.map(s => s.id === subjId ? { ...s, startTime: newTime } : s));
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
          const { data, error } = await (supabase as any).from('categories').insert({
            name: category.name, color: category.color, emoji: category.emoji, user_id: userId
          }).select().single();
          if (!error && data) realCategoryId = data.id;
        } catch { /* fallback */ }
      }

      // Try saving settings (resilient)
      try {
        await (supabase as any).from('categories').update({
          settings: {
            isConfigured: true, type: 'study',
            schedule: { institution, subjects, classTime, enableHomeStudy, homeTime }
          }
        }).eq('id', realCategoryId);
      } catch { /* settings column may not exist */ }

      // localStorage fallback
      const configured = JSON.parse(localStorage.getItem('configured_categories') || '{}');
      configured[category.id] = {
        isConfigured: true, type: 'study',
        schedule: { institution, subjects, classTime, enableHomeStudy, homeTime }
      };
      localStorage.setItem('configured_categories', JSON.stringify(configured));

      // Generate tasks using REAL start times per subject
      const insertPayloads: any[] = [];
      const today = new Date();

      for (let i = 0; i < 21; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const dayOfWeek = targetDate.getDay();

        const daySubjects = subjects.filter(s => s.days.includes(dayOfWeek));

        daySubjects.forEach(subj => {
          // Parse the REAL start time from the subject
          const [h, m] = subj.startTime.split(':').map(Number);
          const classDT = new Date(targetDate);
          classDT.setHours(h, m, 0, 0);

          const profLabel = subj.professor ? `Prof. ${subj.professor}` : '';
          const titleParts = [`Aula: ${subj.name}`];
          if (profLabel) titleParts.push(profLabel);
          if (institution) titleParts.push(`@ ${institution}`);

          insertPayloads.push({
            title: titleParts.join(' · '),
            category: category.name,
            status: 'pending',
            start_time: classDT.toISOString(),
            estimated_duration_minutes: classTime,
            user_id: userId
          });

          // Only generate home study tasks if user opted in
          if (enableHomeStudy) {
            const homeDT = new Date(targetDate);
            homeDT.setHours(19, 0, 0, 0);
            insertPayloads.push({
              title: `📚 Revisão: ${subj.name}`,
              category: category.name,
              status: 'pending',
              start_time: homeDT.toISOString(),
              estimated_duration_minutes: homeTime,
              user_id: userId
            });
          }
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
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-6 flex-1 py-10 h-full min-h-[400px]">
            <div className="w-20 h-20 rounded-3xl flex flex-col items-center justify-center mb-2 shadow-2xl" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
              <span className="text-4xl">{category.emoji}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-balance">
              Setup da sua <span style={{ color: category.color }}>Grade Acadêmica</span>
            </h2>
            <p className="text-muted-foreground text-sm max-w-[280px]">
              Informe suas matérias, horários reais, e professores. Monto sua agenda completa.
            </p>
            <Button size="lg" className="w-full mt-4 py-6 rounded-2xl font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" onClick={() => paginate(1)}>
              Montar Grade <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">Qual sua Instituição?</h2>
              <p className="text-muted-foreground text-sm">Onde você estuda.</p>
            </div>
            <input type="text" autoFocus className="w-full text-center text-2xl bg-transparent border-b-2 border-border/50 font-bold focus:outline-none focus:border-primary pb-3 placeholder:text-muted-foreground/30 transition-all" placeholder="Ex: USP / ETEC / Fatec" value={institution} onChange={(e) => setInstitution(e.target.value)} />
            <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6 font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" disabled={!institution.trim()} onClick={() => paginate(1)}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col flex-1 py-4 h-[60vh] overflow-hidden">
            <div className="space-y-1 text-center mb-4 shrink-0">
              <h2 className="text-xl font-bold tracking-tight">Suas Matérias</h2>
              <p className="text-muted-foreground text-xs">Adicione cada matéria com horário e professor.</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <input type="text" className="w-full p-4 rounded-2xl border-2 border-border/50 bg-secondary/30 font-medium focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all" placeholder="Nome da Matéria..." value={tempName} onChange={(e) => setTempName(e.target.value)} />
              <div className="flex gap-2">
                <input type="text" className="flex-1 p-4 rounded-2xl border-2 border-border/50 bg-secondary/30 font-medium focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none text-sm transition-all" placeholder="Professor (Opcional)" value={tempProf} onChange={(e) => setTempProf(e.target.value)} />
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-muted-foreground whitespace-nowrap">Início:</label>
                  <input type="time" className="p-3 rounded-2xl border-2 border-border/50 bg-secondary/30 font-medium text-sm w-[100px] focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all" value={tempTime} onChange={(e) => setTempTime(e.target.value)} />
                </div>
              </div>
              <Button onClick={addSubject} disabled={!tempName} className="rounded-xl w-full"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1 pb-10">
              {subjects.map(s => (
                <div key={s.id} className="p-3 bg-secondary/30 border border-border/40 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-sm truncate">{s.name}</p>
                      {s.professor && <p className="text-xs text-muted-foreground truncate">Prof. {s.professor}</p>}
                    </div>
                    <button onClick={() => setSubjects(prev => prev.filter(x => x.id !== s.id))} className="text-rose-500/70 hover:text-rose-500 p-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="text-xs text-muted-foreground">Horário:</label>
                    <input type="time" value={s.startTime} onChange={(e) => updateSubjectTime(s.id, e.target.value)} className="p-1 rounded border bg-background text-xs" />
                  </div>
                </div>
              ))}
              {subjects.length === 0 && <p className="text-center text-sm text-muted-foreground mt-4 italic">Nenhuma adicionada ainda.</p>}
            </div>
            <div className="shrink-0 pt-4 bg-background mt-auto">
              <Button size="lg" className="w-full rounded-2xl py-6 font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" disabled={subjects.length === 0} onClick={() => paginate(1)}>
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
              <h2 className="text-xl font-bold tracking-tight">Dias de cada Aula</h2>
              <p className="text-muted-foreground text-xs px-4">Selecione os dias da semana para cada matéria.</p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-6 pb-20 pr-1">
              {subjects.map(subj => (
                <div key={subj.id} className="space-y-3">
                  <p className="font-semibold text-sm px-1 border-l-2 pl-2" style={{ borderColor: category.color }}>
                    {subj.name} <span className="text-xs font-normal text-muted-foreground">({subj.startTime})</span>
                  </p>
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
              <Button size="lg" className="w-full rounded-2xl py-6 font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" onClick={() => paginate(1)}>
                Avançar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col space-y-6 flex-1 py-10 h-full min-h-[400px]">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">Últimos Ajustes</h2>
            </div>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center justify-between">Duração de cada aula <span className="text-primary">{classTime} min</span></label>
                <input type="range" min="30" max="240" step="5" value={classTime} onChange={e => setClassTime(Number(e.target.value))} className="w-full accent-primary" />
              </div>

              <div className="pt-4 border-t">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={enableHomeStudy} onChange={e => setEnableHomeStudy(e.target.checked)} className="w-5 h-5 rounded accent-primary" />
                  <div>
                    <span className="text-sm font-semibold">Criar tarefas de revisão pós-aula</span>
                    <p className="text-xs text-muted-foreground">Agenda um bloco de revisão à noite para cada aula do dia.</p>
                  </div>
                </label>
              </div>

              {enableHomeStudy && (
                <div className="space-y-2 pl-8 animate-fade-in">
                  <label className="text-sm font-semibold flex items-center justify-between">Duração da revisão <span className="text-primary">{homeTime} min</span></label>
                  <input type="range" min="15" max="180" step="5" value={homeTime} onChange={e => setHomeTime(Number(e.target.value))} className="w-full accent-primary" />
                </div>
              )}
            </div>
            <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6 font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" disabled={isSubmitting} onClick={handleFinish}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Finalizar Agendamento'}
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
