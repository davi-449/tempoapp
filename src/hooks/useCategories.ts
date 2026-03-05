import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface Category {
  id: string;
  name: string;
  color: string;
  emoji: string | null;
}

const DEFAULT_CATEGORIES = [
  { id: 'default-1', name: 'Pessoal', color: '#10b981', emoji: '🏠' },
  { id: 'default-2', name: 'Trabalho', color: '#3b82f6', emoji: '💼' },
  { id: 'default-3', name: 'Treino', color: '#f97316', emoji: '🏋️' },
  { id: 'default-4', name: 'Faculdade', color: '#a855f7', emoji: '📚' },
];

export function useCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_CATEGORIES;
      const { data, error } = await (supabase as any)
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching categories', error);
        return DEFAULT_CATEGORIES;
      }

      // Merge defaults with custom categories
      return [...DEFAULT_CATEGORIES, ...(data || [])] as Category[];
    },
    enabled: !!user,
  });

  const addCategory = useMutation({
    mutationFn: async (newCat: Omit<Category, 'id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await (supabase as any)
        .from('categories')
        .insert([{ ...newCat, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
      toast({ title: 'Categoria criada com sucesso!' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Erro ao criar', description: err.message });
    }
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith('default-')) {
        throw new Error('Não é possível excluir categorias padrão sem estar logado ou se não foram salvas no DB.');
      }
      const { error } = await (supabase as any).from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
      toast({ title: 'Categoria removida!' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Erro ao remover', description: err.message });
    }
  });

  return { categories, isLoading, addCategory, deleteCategory };
}
