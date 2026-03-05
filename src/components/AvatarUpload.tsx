import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AvatarUploadProps {
  url: string | null;
  onUpload: (url: string) => void;
  size?: number;
}

export const AvatarUpload = ({ url, onUpload, size = 100 }: AvatarUploadProps) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (url) {
      downloadImage(url);
    }
  }, [url]);

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) {
        throw error;
      }
      const downloadedUrl = URL.createObjectURL(data);
      setAvatarUrl(downloadedUrl);
    } catch (error: any) {
      console.log('Error downloading image: ', error.message);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem.');
      }
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      onUpload(filePath);

      const { error: updateError } = await (supabase as any).from('profiles').upsert({
        id: user.id,
        avatar_url: filePath,
        updated_at: new Date().toISOString(),
      });

      if (updateError) throw updateError;
      
      toast({ title: "Foto atualizada com sucesso!" });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao fazer upload', description: error.message });
    } finally {
      setUploading(false);
    }
  }

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <div className="relative flex flex-col items-center justify-center animate-fade-in">
      <div 
        className="relative rounded-full bg-foreground/10 flex items-center justify-center border-4 border-background shadow-sm overflow-hidden"
        style={{ width: size, height: size }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl font-bold text-muted-foreground">{initial}</span>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="absolute bottom-0 right-0 p-2 bg-foreground text-background rounded-full shadow-md cursor-pointer hover:scale-105 transition-transform">
        <label htmlFor="avatar-upload" className="cursor-pointer">
          <Camera className="w-4 h-4" />
        </label>
        <input
          id="avatar-upload"
          style={{ display: 'none' }}
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
    </div>
  );
};
