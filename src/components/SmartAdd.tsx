import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export const SmartAdd = () => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const { toast } = useToast();

  const handleAdd = () => {
    // Simulated add action for UI phase
    toast({
      title: "Tarefa processada",
      description: "Análise de conflitos em andamento...",
    });
    setTitle('');
    setLocation('');
  };

  return (
    <Sheet>
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
             <Button className="w-full py-6 text-lg font-medium rounded-2xl" onClick={handleAdd}>
               Adicionar na Agenda
             </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
