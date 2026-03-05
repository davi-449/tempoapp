import React from 'react';
import { Category } from '@/types/data';
import { GeneralOnboarding } from './GeneralOnboarding';
import { WorkoutOnboarding } from './WorkoutOnboarding';
import { WorkOnboarding } from './WorkOnboarding';
import { StudyOnboarding } from './StudyOnboarding';

interface DynamicOnboardingProps {
  category: Category;
  onComplete: () => void;
}

export function DynamicOnboarding({ category, onComplete }: DynamicOnboardingProps) {
  const name = category.name.toLowerCase();

  if (name.includes('treino') || name.includes('academia') || name.includes('musculação')) {
    return <WorkoutOnboarding category={category} onComplete={onComplete} />;
  }
  
  if (name.includes('trabalho') || name.includes('work') || name.includes('job') || name.includes('trampo') || name.includes('carreira')) {
    return <WorkOnboarding category={category} onComplete={onComplete} />;
  }

  if (name.includes('estudo') || name.includes('faculdade') || name.includes('escola') || name.includes('curso')) {
    return <StudyOnboarding category={category} onComplete={onComplete} />;
  }

  return <GeneralOnboarding category={category} onComplete={onComplete} />;
}
