import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { authApi } from '@/lib/api/auth';
import { extractErrorMessage } from '@/lib/api/client';
import { ArrowLeft, Mail } from 'lucide-react';

export interface ForgotPasswordPageProps {
  onNavigate: (path: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setStatus({
        type: 'success',
        message: 'Password reset instructions have been dispatched if the account exists.',
      });
    } catch (err) {
      setStatus({ type: 'error', message: extractErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <button
          onClick={() => onNavigate('/login')}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </button>

        <h1 className="text-xl font-bold tracking-tight text-slate-900">Forgot Password</h1>
        <p className="mt-1 text-xs text-slate-500 mb-6">
          Enter your registered email address to receive password recovery instructions.
        </p>

        {status && (
          <div className="mb-4">
            <Alert variant={status.type} title={status.type === 'success' ? 'Dispatched' : 'Error'}>
              {status.message}
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

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            loadingText="Sending reset link..."
            icon={<Mail className="w-4 h-4" />}
          >
            Send Reset Instructions
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => onNavigate('/reset-password')}
            className="text-xs text-slate-500 hover:text-slate-900 underline"
          >
            Have a reset token? Click here to reset
          </button>
        </div>
      </div>
    </div>
  );
};
