import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/lib/api/client';
import { BackendConfigModal } from '@/components/common/BackendConfigModal';
import { AlertTriangle, Server, RefreshCw } from 'lucide-react';

export const BackendStatusBanner: React.FC = () => {
  const { backendHealth, checkBackendHealth } = useAuth();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // If backend is checked and offline
  if (backendHealth.isOnline === false) {
    return (
      <>
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Backend Unavailable:</strong> Could not connect to NestJS API at{' '}
              <code className="bg-rose-100/80 px-1 py-0.5 rounded font-mono text-[11px]">
                {getApiBaseUrl()}
              </code>
              . Ensure your NestJS server is running with CORS enabled.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => checkBackendHealth()}
              disabled={backendHealth.isChecking}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-800 bg-rose-100 hover:bg-rose-200 rounded border border-rose-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${backendHealth.isChecking ? 'animate-spin' : ''}`} />
              Retry
            </button>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors cursor-pointer"
            >
              <Server className="w-3 h-3" />
              Configure API URL
            </button>
          </div>
        </div>

        <BackendConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      </>
    );
  }

  return (
    <>
      <BackendConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </>
  );
};
