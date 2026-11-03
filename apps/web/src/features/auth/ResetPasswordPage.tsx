import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { authApi } from '@/lib/api/auth';
import { extractErrorMessage } from '@/lib/api/client';
import { ArrowLeft, Lock } from 'lucide-react';

export interface ResetPasswordPageProps {
  onNavigate: (path: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ token: token.trim(), newPassword });
      setStatus({
        type: 'success',
        message: 'Password has been reset successfully! You can now log in with your new password.',
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

        <h1 className="text-xl font-bold tracking-tight text-slate-900">Reset Password</h1>
        <p className="mt-1 text-xs text-slate-500 mb-6">
          Enter the password reset token and your new password.
        </p>

        {status && (
          <div className="mb-4">
            <Alert
              variant={status.type}
              title={status.type === 'success' ? 'Password Reset' : 'Error'}
            >
              {status.message}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Reset Token"
            placeholder="Paste token received from server"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            loadingText="Resetting..."
            icon={<Lock className="w-4 h-4" />}
          >
            Set New Password
          </Button>
        </form>
      </div>
    </div>
  );
};
