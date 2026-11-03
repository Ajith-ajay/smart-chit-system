import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { getApiBaseUrl, setApiBaseUrl, checkBackendConnection } from '@/lib/api/client';
import { useAuth } from '@/context/AuthContext';
import { Server, CheckCircle2, XCircle } from 'lucide-react';

export interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({ isOpen, onClose }) => {
  const { checkBackendHealth } = useAuth();
  const [url, setUrl] = useState(getApiBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    isOnline: boolean;
    status?: number;
    error?: string;
  } | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setApiBaseUrl(url);
    const res = await checkBackendConnection();
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSave = async () => {
    setApiBaseUrl(url);
    await checkBackendHealth();
    onClose();
  };

  const handleReset = () => {
    const defaultUrl = 'http://localhost:3000/api/v1';
    setUrl(defaultUrl);
    setApiBaseUrl(defaultUrl);
    setTestResult(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Backend API Configuration" maxWidth="md">
      <div className="space-y-4 text-xs text-slate-600">
        <p>
          Configure the active REST API URL for your NestJS 11 backend. Every action in this admin
          dashboard calls this endpoint.
        </p>

        <Input
          label="Backend Base URL"
          placeholder="e.g. http://localhost:3000/api/v1"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          helperText="Standard default is http://localhost:3000/api/v1"
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            isLoading={isTesting}
            icon={<Server className="w-3.5 h-3.5" />}
          >
            Test Connection
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset to Default
          </Button>
        </div>

        {testResult && (
          <div>
            {testResult.isOnline ? (
              <Alert variant="success" title="Backend Reachable">
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Successfully connected to NestJS backend! HTTP Status: {testResult.status}
                  </span>
                </div>
              </Alert>
            ) : (
              <Alert variant="error" title="Backend Unavailable">
                <div className="flex items-start gap-1.5 mt-1">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{testResult.error}</p>
                    <p className="text-[11px] text-rose-700 mt-1">
                      Tips: Ensure your NestJS server is running (e.g. `npm run start:dev`) and CORS
                      is enabled in `main.ts` (`app.enableCors()`).
                    </p>
                  </div>
                </div>
              </Alert>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save & Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
};
