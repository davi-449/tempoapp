import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const SmartAdd = () => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!title.trim()) return;
    setIsLoading(true);

    try {
      // Fake User UUID from the DB (will be replaced by Auth)
      const mockUserId = "some-uuid-or-ignored"; // RLS bypass for MVP UI or handled via real auth check
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const userId = userData?.user?.id; // Allow anonymous for UI mockup test
      
      toast({
        title: "Processando...",
        description: "Analisando agenda, trânsito e conflitos com Gemini...",
      });

      // Call the Edge Function
      const { data: conflictData, error: funcError } = await supabase.functions.invoke('conflict-engine', {
        body: {
          title,
          proposed_start_time: new Date().toISOString(), // Defaulting to 'now' for MVP 
          location: location || null,
          user_id: userId || '00000000-0000-0000-0000-000000000000', // Mock UUID
          category: 'pessoal' // default fallback
        }
      });

      if (funcError) throw funcError;

      if (conflictData.has_conflict) {
         toast({
            variant: "destructive",
            title: "Aviso de Conflito ⚠️",
            description: conflictData.warning,
         });
         setIsLoading(false);
         return; // Interrompe pra n salvar 
      }

      // Se deu bom, insere a task real
      const { error: insertError } = await supabase.from('tasks').insert({
          title,
          category: 'pessoal',
          location: location || null,
          start_time: new Date().toISOString(),
          end_time: conflictData.predicted_end_time,
          estimated_duration_minutes: conflictData.estimated_minutes,
          user_id: userId || '00000000-0000-0000-0000-000000000000',
      });

      if (insertError) throw insertError;

      toast({
        title: "Sucesso!",
        description: `Tarefa salva. Estimativa da IA: ${conflictData.estimated_minutes} min.`,
      });

      setTitle('');
      setLocation('');
      setIsOpen(false);
      
      // Dispatch an event so Timeline can refresh
      window.dispatchEvent(new Event('task-added'));
      
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message || "Falha na análise" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" className="h-14 w-14 rounded-full shadow-xl bg-black hover:bg-black/90 text-white fixed bottom-6 right-6 z-50 transition-transform active:scale-95">
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[50vh] rounded-t-3xl sm:max-w-md mx-auto p-6 flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">Nova Tarefa Inteligente</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col gap-4 mt-6">
          <Input 
            placeholder="Ex: Cinema com a Tati às 21h..." 
            className="text-lg py-6 border-0 bg-secondary/50 focus-visible:ring-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Input 
            placeholder="Localização (Opcional)" 
            className="py-6 border-0 bg-secondary/50 focus-visible:ring-1"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          
          <div className="flex gap-2 w-full pt-4 mt-auto">
             <Button className="w-full py-6 text-lg font-medium rounded-2xl" onClick={handleAdd} disabled={isLoading || !title.trim()}>
               {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : null}
               {isLoading ? "Consultando IA..." : "Adicionar na Agenda"}
             </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
