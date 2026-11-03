import React from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  CalendarDays,
  UserPlus,
  CreditCard,
  Receipt as ReceiptIcon,
  HandCoins,
  FileText,
  Bell,
  PhoneCall,
  BarChart3,
  Settings,
  KeyRound,
  ShieldCheck,
  Building2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const sections = [
    {
      title: null,
      items: [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'BUSINESS',
      items: [
        { name: 'Members', path: '/members', icon: Users },
        { name: 'Plans', path: '/plans', icon: Layers },
        { name: 'Batches', path: '/batches', icon: CalendarDays },
        { name: 'Enrollments', path: '/enrollments', icon: UserPlus },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        { name: 'Payments', path: '/payments', icon: CreditCard },
        { name: 'Receipts', path: '/receipts', icon: ReceiptIcon },
        { name: 'Withdrawals', path: '/withdrawals', icon: HandCoins },
      ],
    },
    {
      title: 'DOCUMENTS',
      items: [{ name: 'KYC / Documents', path: '/documents', icon: FileText }],
    },
    {
      title: 'COMMUNICATION',
      items: [
        { name: 'Reminders', path: '/reminders', icon: Bell },
        { name: 'Follow-ups', path: '/follow-ups', icon: PhoneCall },
      ],
    },
    {
      title: 'REPORTS',
      items: [
        { name: 'Reports Overview', path: '/reports', icon: BarChart3 },
        { name: 'Collections Report', path: '/reports/collections', icon: CreditCard },
        { name: 'Withdrawals Report', path: '/reports/withdrawals', icon: HandCoins },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Change Password', path: '/change-password', icon: KeyRound },
        { name: 'API & Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  const handleItemClick = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-300 transition-transform duration-200 md:static md:translate-x-0',
          isOpenMobile ? 'translate-x-0' : '-translate-x-0 max-md:-translate-x-full',
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-900 shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">SCMS ADMIN</h1>
              <p className="text-[10px] text-slate-400 font-mono">Smart Chit System</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded p-1 text-slate-400 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.path === '/dashboard'
                      ? currentPath === '/dashboard' || currentPath === '/'
                      : currentPath === item.path || currentPath.startsWith(item.path + '/');
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleItemClick(item.path)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors text-left cursor-pointer select-none',
                        isActive
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive ? 'text-white' : 'text-slate-400',
                        )}
                      />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <p className="text-[11px] font-medium text-slate-300">NestJS 11 · Prisma 7</p>
              <p className="text-[10px] text-slate-400 font-mono">PostgreSQL Ledger</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
