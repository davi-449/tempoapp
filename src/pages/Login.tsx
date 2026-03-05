import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      if (isSignUp) {
        setError('');
        setLoading(false);
        setIsSignUp(false);
        // Show a simple message, the auth state listener will handle redirect
        setError('Conta criada! Faça login agora.');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">⏱️ TempoApp</h1>
          <p className="text-sm text-muted-foreground">
            Sua produtividade unificada
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-card border shadow-card rounded-xl text-sm"
              required
            />
            <Input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-card border shadow-card rounded-xl text-sm"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className={`text-xs text-center ${error.includes('Conta criada') ? 'text-emerald-600' : 'text-destructive'}`}>
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl text-sm font-semibold bg-foreground text-background hover:bg-foreground/90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSignUp ? (
              'Criar Conta'
            ) : (
              'Entrar'
            )}
          </Button>
        </form>

        {/* Toggle */}
        <div className="text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            type="button"
          >
            {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Criar agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
