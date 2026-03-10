import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Brain, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GlobalOnboardingProps {
  onComplete: () => void;
}

export function GlobalOnboarding({ onComplete }: GlobalOnboardingProps) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      icon: <Calendar className="w-12 h-12 text-primary" />,
      title: "Esqueça a agenda bagunçada",
      description: "O TempoApp organiza seu dia automaticamente. Chega de perder tempo planejando o que fazer."
    },
    {
      icon: <Brain className="w-12 h-12 text-primary" />,
      title: "Crie suas áreas de foco",
      description: "Separe sua vida em categorias: Trabalho, Treino, Faculdade. Cada área tem sua própria inteligência."
    },
    {
      icon: <Sparkles className="w-12 h-12 text-primary" />,
      title: "Deixe a IA trabalhar",
      description: "Diga seus horários uma única vez e nós montamos sua rotina perfeita para as próximas semanas."
    }
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
      navigate('/hub');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, type: "spring" }}
          className="flex flex-col items-center text-center max-w-sm w-full"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8 shadow-inner">
            {slides[step].icon}
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight mb-4 text-balance">
            {slides[step].title}
          </h1>
          
          <p className="text-muted-foreground text-lg mb-12 text-balance leading-relaxed">
            {slides[step].description}
          </p>

          {/* Indicadores de Progresso */}
          <div className="flex gap-2 mb-8">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : 'w-2 bg-primary/20'}`}
              />
            ))}
          </div>

          <Button 
            size="lg" 
            className="w-full rounded-2xl py-6 font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
            onClick={handleNext}
          >
            {step === slides.length - 1 ? "Configurar Minha Rotina" : "Continuar"}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
