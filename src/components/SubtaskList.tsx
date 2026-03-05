import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Subtask } from '@/types/data';
import { CheckCircle2, Circle, GripVertical, Plus, Trash2, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface SubtaskListProps {
  taskId: string;
}

export const SubtaskList = ({ taskId }: SubtaskListProps) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubtasks();
  }, [taskId]);

  const fetchSubtasks = async () => {
    setIsLoading(true);
    // @ts-ignore - Table 'subtasks' not yet in database.types.ts
    const { data, error } = await (supabase as any)
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('order', { ascending: true });

    if (!error && data) {
      setSubtasks(data as Subtask[]);
    }
    setIsLoading(false);
  };

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsAdding(true);
    // @ts-ignore
    const { data, error } = await (supabase as any).from('subtasks').insert({
      task_id: taskId,
      title: newTaskTitle,
      order: subtasks.length,
    } as any).select().single();

    if (!error && data) {
      setSubtasks([...subtasks, data as Subtask]);
      setNewTaskTitle('');
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar o exercício/subtarefa.' });
    }
    setIsAdding(false);
  };

  const toggleCompleted = async (id: string, currentStatus: boolean) => {
    // Optimistic Update
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, is_completed: !currentStatus } : s));
    
    // @ts-ignore
    const { error } = await (supabase as any).from('subtasks').update({
      is_completed: !currentStatus
    } as any).eq('id', id);

    if (error) {
      // Revert if error
      setSubtasks(prev => prev.map(s => s.id === id ? { ...s, is_completed: currentStatus } : s));
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic Delete
    const previous = [...subtasks];
    setSubtasks(prev => prev.filter(s => s.id !== id));

    // @ts-ignore
    const { error } = await (supabase as any).from('subtasks').delete().eq('id', id);
    if (error) {
      setSubtasks(previous);
      toast({ variant: 'destructive', title: 'Erro ao excluir' });
    }
  };

  if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex flex-col gap-3">
      {/* Title / Header */}
      <h4 className="text-sm font-semibold tracking-tight text-foreground/80 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4" /> Checklist
      </h4>

      {/* List */}
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {subtasks.map((subtask) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={subtask.id}
              className={`flex items-center gap-3 group rounded-xl p-2 transition-all ${subtask.is_completed ? 'bg-secondary/30 opacity-60' : 'bg-secondary/40 hover:bg-secondary/60'}`}
            >
              <button onClick={() => toggleCompleted(subtask.id, subtask.is_completed)} className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
                {subtask.is_completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
              </button>
              
              <span className={`flex-1 text-sm ${subtask.is_completed ? 'line-through' : ''}`}>
                {subtask.title}
              </span>

              <button 
                onClick={() => handleDelete(subtask.id)} 
                className="opacity-0 group-hover:opacity-100 shrink-0 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Input */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 mt-2">
        <Input 
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
          placeholder="Adicionar exercício/item..."
          className="h-10 bg-secondary/30 border-dashed border-2 rounded-xl text-sm focus-visible:ring-1"
        />
        <Button size="icon" disabled={isAdding || !newTaskTitle.trim()} type="submit" className="shrink-0 h-10 w-10 rounded-xl tap-bounce">
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};
