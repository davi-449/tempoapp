/**
 * Utility functions for grouping tasks by time and context.
 * These are PURE FUNCTIONS, not hooks — safe to call anywhere.
 */

interface TaskGroup {
  label: string;
  tasks: any[];
}

interface ContextGroup {
  key: string;
  label: string;
  tasks: any[];
}

/**
 * Groups tasks by temporal buckets: Hoje, Amanhã, Esta Semana, Futuro.
 */
export function groupTasksByTime(tasks: any[]): TaskGroup[] {
  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().substring(0, 10);
  
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  
  const groups: TaskGroup[] = [
    { label: '📅 Hoje', tasks: [] },
    { label: '📅 Amanhã', tasks: [] },
    { label: '📅 Esta Semana', tasks: [] },
    { label: '📅 Próximas', tasks: [] },
  ];
  
  const sorted = [...tasks].sort((a, b) => {
    const da = a.start_time ? new Date(a.start_time).getTime() : 0;
    const db = b.start_time ? new Date(b.start_time).getTime() : 0;
    return da - db;
  });
  
  sorted.forEach(task => {
    if (!task.start_time) {
      groups[3].tasks.push(task);
      return;
    }
    const dateStr = task.start_time.substring(0, 10);
    const taskDate = new Date(task.start_time);
    
    if (dateStr === todayStr) {
      groups[0].tasks.push(task);
    } else if (dateStr === tomorrowStr) {
      groups[1].tasks.push(task);
    } else if (taskDate <= endOfWeek && taskDate > tomorrow) {
      groups[2].tasks.push(task);
    } else {
      groups[3].tasks.push(task);
    }
  });
  
  return groups.filter(g => g.tasks.length > 0);
}

/**
 * Groups tasks by context — extracts subject/professor from title patterns.
 */
export function groupTasksByContext(tasks: any[], categoryType?: string): ContextGroup[] {
  if (!categoryType) return [];
  
  const groupMap = new Map<string, any[]>();
  
  tasks.forEach(task => {
    let key = 'Outros';
    
    if (categoryType === 'study') {
      // Parse: "Aula: Programação · Prof. João · @ ETEC"
      const match = task.title?.match(/^Aula:\s*([^·]+)/);
      if (match) key = match[1].trim();
      else if (task.title?.startsWith('📚')) {
        const revMatch = task.title.match(/Revisão:\s*(.+)/);
        if (revMatch) key = revMatch[1].trim();
      }
    } else if (categoryType === 'workout') {
      // Parse: "Treino A (Peito/Tríceps)" or "Meu Treino: Full Body"
      const match = task.title?.match(/Treino\s*([A-C])\s*\(([^)]+)\)/);
      if (match) key = `Treino ${match[1]} — ${match[2]}`;
      else {
        const simpleMatch = task.title?.match(/Meu Treino:\s*(.+)/);
        if (simpleMatch) key = simpleMatch[1].trim();
      }
    }
    
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(task);
  });
  
  return Array.from(groupMap.entries()).map(([key, tasks]) => ({
    key,
    label: key,
    tasks
  }));
}
