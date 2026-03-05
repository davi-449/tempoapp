import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Loader2, Settings2 } from "lucide-react";
import { useCategories } from '@/hooks/useCategories';

export const CategoryManager = () => {
  const { categories, addCategory, deleteCategory } = useCategories();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📌');
  const [color, setColor] = useState('#3b82f6');

  const handleCreate = () => {
    if (!name.trim()) return;
    addCategory.mutate({ name, emoji, color });
    setName('');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 rounded-full bg-white shadow-sm border-0 text-xs font-semibold">
          <Settings2 className="w-3.5 h-3.5 mr-1" /> Gerir Categorias
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-[32px] sm:max-w-md mx-auto p-6 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold tracking-tight">Categorias</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center bg-secondary/50 p-2 rounded-2xl">
            <Input 
              value={emoji} 
              onChange={e => setEmoji(e.target.value)} 
              className="w-12 h-10 border-0 bg-white text-center rounded-xl px-0 shadow-sm"
              maxLength={2}
            />
            <Input 
              placeholder="Nova categoria..." 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="h-10 border-0 bg-transparent px-2"
            />
            <div className="flex items-center gap-2 pr-1">
              <input 
                type="color" 
                value={color} 
                onChange={e => setColor(e.target.value)} 
                className="w-8 h-8 rounded-full border-0 cursor-pointer overflow-hidden appearance-none bg-transparent outline-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full shadow-sm"
              />
              <Button 
                size="icon" 
                className="h-8 w-8 rounded-full tap-bounce"
                onClick={handleCreate}
                disabled={addCategory.isPending || !name.trim()}
              >
                {addCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Atuais</h4>
            {categories.map(cat => (
              <div key={cat.id} className="flex flex-row items-center justify-between p-3 rounded-2xl bg-white shadow-sm border-0">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-lg leading-none">{cat.emoji}</span>
                  <span className="font-semibold text-sm">{cat.name}</span>
                </div>
                {!cat.id.startsWith('default-') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                    onClick={() => deleteCategory.mutate(cat.id)}
                    disabled={deleteCategory.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
