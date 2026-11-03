import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CreditCard,
  HandCoins,
  CalendarDays,
  UserCheck,
  ArrowRight,
  BarChart3,
} from 'lucide-react';

export interface ReportsOverviewPageProps {
  onNavigate: (path: string) => void;
}

export const ReportsOverviewPage: React.FC<ReportsOverviewPageProps> = ({ onNavigate }) => {
  const reportCards = [
    {
      title: 'Collections Report',
      description:
        'Comprehensive financial report of all chit installment collections, payment methods, receipts, and allocations.',
      path: '/reports/collections',
      icon: CreditCard,
      color: 'text-emerald-600',
    },
    {
      title: 'Withdrawals & Payouts Report',
      description:
        'Detailed analysis of prize bid claims, approved amounts, multi-tranche payout distributions, and remaining obligations.',
      path: '/reports/withdrawals',
      icon: HandCoins,
      color: 'text-sky-600',
    },
    {
      title: 'Batch Operational Reports',
      description:
        'Progress reports per batch showing plan-wise seat enrollment, 20-month collection targets vs actuals, and lifecycle status.',
      path: '/batches',
      icon: CalendarDays,
      color: 'text-amber-600',
    },
    {
      title: 'Operations Dashboard',
      description:
        'Real-time KPI cards, collections and withdrawal trends, active running batches, and recent system transactions.',
      path: '/dashboard',
      icon: BarChart3,
      color: 'text-slate-800',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial & Operational Reports"
        description="Authoritative ledger analytics directly queried from PostgreSQL via NestJS reports module"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((rc) => {
          const Icon = rc.icon;
          return (
            <Card
              key={rc.path}
              className="p-6 flex flex-col justify-between hover:border-slate-300"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-slate-100 rounded-md">
                    <Icon className={`w-5 h-5 ${rc.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{rc.title}</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{rc.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate(rc.path)}
                  className="w-full justify-between"
                >
                  <span>Open Report</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
