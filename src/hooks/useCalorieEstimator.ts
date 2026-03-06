/**
 * Calorie Estimator using MET (Metabolic Equivalent of Task) formula.
 * Calories = MET × Weight(kg) × Duration(hours)
 */

const MET_VALUES: Record<string, number> = {
  'strength': 6.0,      // Musculação
  'cardio_run': 8.0,    // Corrida
  'cardio_walk': 3.5,   // Caminhada
  'crossfit': 8.0,      // HIIT/Crossfit
  'flexibility': 2.5,   // Yoga/Alongamento
  'full body': 6.0,
  'abc': 6.0,
  'push/pull/legs': 6.0,
  'cardio': 7.0,
  'default': 5.0,
};

export function estimateCalories(
  weightKg: number,
  durationMinutes: number,
  workoutType?: string
): number {
  if (weightKg <= 0 || durationMinutes <= 0) return 0;
  
  const typeKey = (workoutType || 'default').toLowerCase();
  const met = MET_VALUES[typeKey] || MET_VALUES['default'];
  const durationHours = durationMinutes / 60;
  
  return Math.round(met * weightKg * durationHours);
}

/**
 * Gets weight from localStorage (saved during WorkoutOnboarding)
 * or returns a default.
 */
export function getUserWeight(): number {
  try {
    const configured = JSON.parse(localStorage.getItem('configured_categories') || '{}');
    for (const key of Object.keys(configured)) {
      const cfg = configured[key];
      if (cfg?.type === 'workout' && cfg?.healthMetrics?.weight) {
        return parseFloat(cfg.healthMetrics.weight) || 70;
      }
    }
  } catch { /* fallback */ }
  return 70; // default weight
}
