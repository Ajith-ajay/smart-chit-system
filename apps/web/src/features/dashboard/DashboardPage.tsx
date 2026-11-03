import { PageHeader } from '@/components/common/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { extractErrorMessage } from '@/lib/api/client';
import { reportsApi } from '@/lib/api/reports';
import { formatDate, formatINR } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  CreditCard,
  HandCoins,
  IndianRupee,
  PlayCircle,
  Plus,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => reportsApi.getDashboard(),
  });

  console.log('Ajith is deduging the dashboard data', data);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        description="Real-time financial status, batch progress, and operational activity from NestJS backend"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('/payments/new')}
              icon={<CreditCard className="w-3.5 h-3.5" />}
            >
              Collect Payment
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('/enrollments/new')}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Enroll Member
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onNavigate('/members/new')}
              icon={<Users className="w-3.5 h-3.5" />}
            >
              Add Member
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="error" title="Backend Connection Issue">
          {extractErrorMessage(error)}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry Fetching Dashboard Data
            </Button>
          </div>
        </Alert>
      )}

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Active Members</span>
              <Users className="w-4 h-4 text-slate-600" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {data.activeMembers ?? 0}
            </p>
            <span className="text-[11px] text-slate-400">Total verified members</span>
          </Card>

          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Active Enrollments</span>
              <UserCheck className="w-4 h-4 text-slate-600" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {data.activeEnrollments ?? 0}
            </p>
            <span className="text-[11px] text-slate-400">Seats currently running</span>
          </Card>

          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Running Batches</span>
              <PlayCircle className="w-4 h-4 text-sky-600" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-sky-900">
              {data.runningBatches ?? 0}
            </p>
            <span className="text-[11px] text-slate-400">In monthly cycle</span>
          </Card>

          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Completed Batches</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-900">
              {data.completedBatches ?? 0}
            </p>
            <span className="text-[11px] text-slate-400">Fully closed cycles</span>
          </Card>

          <Card className="p-4 border-slate-200 bg-emerald-50/30">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium text-emerald-900">Total Collections</span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-950">
              {formatINR(data.totalCollections ?? 0)}
            </p>
            <span className="text-[11px] text-emerald-700">Gross collections</span>
          </Card>

          <Card className="p-4 border-slate-200 bg-sky-50/30">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium text-sky-900">Total Withdrawals</span>
              <HandCoins className="w-4 h-4 text-sky-600" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-sky-950">
              {formatINR(data.totalWithdrawals ?? 0)}
            </p>
            <span className="text-[11px] text-sky-700">Approved claims</span>
          </Card>

          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Total Payouts</span>
              <CreditCard className="w-4 h-4 text-slate-600" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {formatINR(data.totalPayouts ?? 0)}
            </p>
            <span className="text-[11px] text-slate-400">Disbursed to members</span>
          </Card>

          <Card className="p-4 border-slate-200 bg-amber-50/30">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium text-amber-900">Pending Withdrawals</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-amber-950">
              {data.pendingWithdrawals ?? 0}
            </p>
            <span className="text-[11px] text-amber-700">Awaiting payout / approval</span>
          </Card>
        </div>
      ) : null}

      {/* Visual Charts */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Collection & Withdrawal Trends */}
          <Card className="p-5">
            <CardHeader className="mb-2 pb-2">
              <div>
                <CardTitle>Collections Trend</CardTitle>
                <CardDescription>
                  Historical and installment monthly collection volume
                </CardDescription>
              </div>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <div className="h-64 w-full">
              {data.collectionTrend && data.collectionTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.collectionTrend}>
                    <defs>
                      <linearGradient id="colGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="period" stroke="#64748b" fontSize={11} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(val) => `₹${val / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [formatINR(Number(value)), 'Collected']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#0f172a"
                      strokeWidth={2}
                      fill="url(#colGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No collection trend data recorded yet.
                </div>
              )}
            </div>
          </Card>

          {/* Batch Progress */}
          <Card className="p-5">
            <CardHeader className="mb-2 pb-2">
              <div>
                <CardTitle>Running Batch Progress</CardTitle>
                <CardDescription>Current installment vs total duration</CardDescription>
              </div>
            </CardHeader>
            <div className="h-64 w-full">
              {data.batchProgress && data.batchProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.batchProgress}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="batchName" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      formatter={(value: any) => [String(value ?? ''), 'Current Installment']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                      }}
                    />
                    <Bar dataKey="currentInstallment" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No running batches active.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Recent Activity Rows */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <Card className="p-5">
            <CardHeader className="mb-3 pb-2">
              <div>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest collection transactions logged</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('/payments')}
                className="text-xs text-slate-600"
              >
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardHeader>
            {data.recentPayments && data.recentPayments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.recentPayments.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {p.receipt?.receiptNumber || p.id.slice(0, 8)}
                      </p>
                      <p className="text-slate-500">
                        {p.paymentMethod} · {formatDate(p.paymentDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{formatINR(p.amount)}</p>
                      <Badge variant={p.status === 'SUCCESS' ? 'success' : 'warning'}>
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No payment transactions yet.
              </p>
            )}
          </Card>

          {/* Recent Withdrawals */}
          <Card className="p-5">
            <CardHeader className="mb-3 pb-2">
              <div>
                <CardTitle>Recent Withdrawals</CardTitle>
                <CardDescription>Member withdrawal claims</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('/withdrawals')}
                className="text-xs text-slate-600"
              >
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardHeader>
            {data.recentWithdrawals && data.recentWithdrawals.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.recentWithdrawals.map((w) => (
                  <div key={w.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Enrollment #{w.enrollmentId.slice(0, 8)}
                      </p>
                      <p className="text-slate-500">Requested: {formatDate(w.requestDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{formatINR(w.requestedAmount)}</p>
                      <Badge
                        variant={
                          w.status === 'FULLY_PAID' || w.status === 'APPROVED'
                            ? 'success'
                            : w.status === 'REJECTED'
                              ? 'error'
                              : 'warning'
                        }
                      >
                        {w.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No withdrawal claims logged yet.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
