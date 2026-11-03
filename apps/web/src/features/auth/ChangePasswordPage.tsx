import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/common/PageHeader';
import { authApi } from '@/lib/api/auth';
import { extractErrorMessage } from '@/lib/api/client';
import { KeyRound, CheckCircle2 } from 'lucide-react';

export interface ChangePasswordPageProps {
  onNavigate: (path: string) => void;
}

export const ChangePasswordPage: React.FC<ChangePasswordPageProps> = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setStatus({ type: 'success', message: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatus({ type: 'error', message: extractErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <PageHeader title="Change Password" description="Update your administrator credentials" />

      {status && (
        <div className="mb-4">
          <Alert variant={status.type} title={status.type === 'success' ? 'Success' : 'Error'}>
            {status.message}
          </Alert>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Minimum 6 characters"
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

          <div className="pt-2">
            <Button
              type="submit"
              isLoading={isLoading}
              loadingText="Updating password..."
              icon={<KeyRound className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
