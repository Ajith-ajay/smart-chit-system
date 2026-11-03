import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { BackendConfigModal } from '@/components/common/BackendConfigModal';
import { Menu, LogOut, Server, User as UserIcon, ChevronRight, ShieldAlert } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api/client';

export interface HeaderProps {
  currentPath: string;
  onOpenMobileMenu: () => void;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onOpenMobileMenu, onNavigate }) => {
  const { user, logout, backendHealth } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onNavigate('/login');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  // Generate breadcrumb items
  const pathSegments = currentPath.split('/').filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, idx) => {
    const path = '/' + pathSegments.slice(0, idx + 1).join('/');
    const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { title, path };
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav
          aria-label="Breadcrumb"
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500"
        >
          <button
            onClick={() => onNavigate('/dashboard')}
            className="hover:text-slate-900 transition-colors font-medium"
          >
            SCMS
          </button>
          {breadcrumbItems.length === 0 ? (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="font-semibold text-slate-900">Dashboard</span>
            </>
          ) : (
            breadcrumbItems.map((item, idx) => (
              <React.Fragment key={item.path}>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                {idx === breadcrumbItems.length - 1 ? (
                  <span className="font-semibold text-slate-900 truncate max-w-[150px]">
                    {item.title}
                  </span>
                ) : (
                  <button
                    onClick={() => onNavigate(item.path)}
                    className="hover:text-slate-900 transition-colors truncate max-w-[120px]"
                  >
                    {item.title}
                  </button>
                )}
              </React.Fragment>
            ))
          )}
        </nav>
      </div>

      {/* Right: API Server status & User Controls */}
      <div className="flex items-center gap-3">
        {/* Backend Status indicator */}
        <button
          onClick={() => setShowConfigModal(true)}
          className={`flex items-center gap-2 px-2.5 py-1 rounded text-xs border transition-colors cursor-pointer ${
            backendHealth.isOnline === true
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : backendHealth.isOnline === false
                ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 animate-pulse'
                : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}
          title={`Backend API: ${getApiBaseUrl()}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendHealth.isOnline === true
                ? 'bg-emerald-500'
                : backendHealth.isOnline === false
                  ? 'bg-rose-500'
                  : 'bg-slate-400'
            }`}
          />
          <Server className="w-3.5 h-3.5" />
          <span className="hidden md:inline font-mono text-[11px]">
            {backendHealth.isOnline === true
              ? 'API Online'
              : backendHealth.isOnline === false
                ? 'API Offline'
                : 'Checking API'}
          </span>
        </button>

        {/* User profile & Logout */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-900">
                {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                {user.role}
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              <UserIcon className="h-4 w-4" />
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onNavigate('/login')}>
            Sign In
          </Button>
        )}
      </div>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        description="Are you sure you want to end your administrative session?"
        confirmText="Log Out"
        variant="danger"
        isLoading={isLoggingOut}
      />

      <BackendConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
    </header>
  );
};
