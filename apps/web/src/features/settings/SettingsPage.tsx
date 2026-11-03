import React, { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { getApiBaseUrl, setApiBaseUrl, checkBackendConnection } from '@/lib/api/client';
import { useAuth } from '@/context/AuthContext';
import {
  Server,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Terminal,
  Database,
  Cpu,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { backendHealth, checkBackendHealth } = useAuth();
  const [url, setUrl] = useState(getApiBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    isOnline: boolean;
    status?: number;
    error?: string;
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

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
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    const defaultUrl = 'http://localhost:3000/api/v1';
    setUrl(defaultUrl);
    setApiBaseUrl(defaultUrl);
    setTestResult(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="API & Backend Connectivity Settings"
        description="Configure target NestJS 11 endpoint, verify CORS & database communication"
      />

      {isSaved && (
        <Alert variant="success" title="Settings Saved">
          Backend API Base URL updated successfully and active for all subsequent requests.
        </Alert>
      )}

      {/* Connection Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-slate-700" />
            <h3 className="font-semibold text-sm text-slate-900">NestJS 11 Base API URL</h3>
          </div>
          <Badge variant={backendHealth.isOnline ? 'success' : 'error'}>
            {backendHealth.isOnline ? 'API REACHABLE' : 'API OFFLINE'}
          </Badge>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The Smart Chit Management System frontend communicates with the real NestJS 11 + Prisma +
          PostgreSQL server. Set the exact base URL of your running backend below:
        </p>

        <div className="space-y-3">
          <Input
            label="Backend Base URL"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setIsSaved(false);
            }}
            placeholder="http://localhost:3000/api/v1"
            helperText="Default standard route prefix is /api/v1"
          />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTest}
              isLoading={isTesting}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Test Backend Ping
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleSave}>
              Save Configuration
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
              Reset Default
            </Button>
          </div>
        </div>

        {testResult && (
          <div className="pt-2">
            {testResult.isOnline ? (
              <Alert variant="success" title="Connection Established">
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Successfully reached NestJS server at <strong>{url}</strong> (HTTP Response:{' '}
                    {testResult.status}). All SCMS modules ready.
                  </span>
                </div>
              </Alert>
            ) : (
              <Alert variant="error" title="Cannot Reach NestJS Backend">
                <div className="flex items-start gap-2 mt-1">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{testResult.error}</p>
                    <p className="mt-1 text-[11px] text-rose-700">
                      If running locally, ensure:
                      <br />
                      1. Your NestJS server is running (e.g. <code>npm run start:dev</code>)
                      <br />
                      2. CORS is enabled in <code>main.ts</code> via <code>app.enableCors()</code>
                    </p>
                  </div>
                </div>
              </Alert>
            )}
          </div>
        )}
      </Card>

      {/* Backend Tech Architecture */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-700" /> System Architecture & Rules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <strong className="text-slate-900 block mb-1">Decimal Financial Integrity</strong>
            <p>
              Prisma 7 Decimal numbers compute all dividend offsets, installment deductions, and
              payout distributions. The frontend renders authoritative ledger amounts without
              modifying decimals.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <strong className="text-slate-900 block mb-1">Calendar vs Financial Settlement</strong>
            <p>
              Calendar month progression does NOT automatically close delinquent installments. Late
              payments remain valid until fully settled.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <strong className="text-slate-900 block mb-1">Reversal Over Deletion</strong>
            <p>
              Payments, receipts, and payouts are never hard deleted. Financial integrity requires
              reversing transactions with an audit reason while preserving historical ledger
              entries.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <strong className="text-slate-900 block mb-1">No Postman Required</strong>
            <p>
              All 40+ endpoints (Auth, Members, Batches, Plans, Enrollments, Catch-up, Payments,
              Receipts, Withdrawals, KYC Uploads, Reminders, Follow-ups, Lifecycle) can be executed
              directly from this browser console.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
