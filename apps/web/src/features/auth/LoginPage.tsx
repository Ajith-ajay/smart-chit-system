import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { extractErrorMessage } from '@/lib/api/client';
import { Building2, Lock, Mail, ShieldAlert } from 'lucide-react';

export interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      onNavigate('/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 text-white shadow-xs">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">SCMS Admin Portal</h1>
          <p className="mt-1 text-xs text-slate-500">
            Sign in to manage Smart Chit batches, enrollments, and payments
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="error" title="Sign In Failed">
              {error}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@smartchit.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                Password <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="remember-me" className="text-xs text-slate-600 select-none">
              Remember session on this device
            </label>
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            isLoading={isLoading}
            loadingText="Verifying credentials..."
          >
            Sign In to SCMS
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400">
          <span>Backend endpoint: NestJS JWT Authentication (/api/v1/auth/login)</span>
        </div>
      </div>
    </div>
  );
};
