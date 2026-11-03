import React, { useState, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { MembersListPage } from '@/features/members/MembersListPage';
import { MemberCreatePage } from '@/features/members/MemberCreatePage';
import { MemberDetailPage } from '@/features/members/MemberDetailPage';
import { PlansListPage } from '@/features/plans/PlansListPage';
import { PlanDetailPage } from '@/features/plans/PlanDetailPage';
import { BatchesListPage } from '@/features/batches/BatchesListPage';
import { BatchCreatePage } from '@/features/batches/BatchCreatePage';
import { BatchDetailPage } from '@/features/batches/BatchDetailPage';
import { EnrollmentsListPage } from '@/features/enrollments/EnrollmentsListPage';
import { EnrollmentCreatePage } from '@/features/enrollments/EnrollmentCreatePage';
import { EnrollmentCatchUpPage } from '@/features/enrollments/EnrollmentCatchUpPage';
import { EnrollmentDetailPage } from '@/features/enrollments/EnrollmentDetailPage';
import { PaymentsListPage } from '@/features/payments/PaymentsListPage';
import { PaymentCreatePage } from '@/features/payments/PaymentCreatePage';
import { PaymentDetailPage } from '@/features/payments/PaymentDetailPage';
import { ReceiptsListPage } from '@/features/receipts/ReceiptsListPage';
import { ReceiptDetailPage } from '@/features/receipts/ReceiptDetailPage';
import { WithdrawalsListPage } from '@/features/withdrawals/WithdrawalsListPage';
import { WithdrawalDetailPage } from '@/features/withdrawals/WithdrawalDetailPage';
import { DocumentsListPage } from '@/features/documents/DocumentsListPage';
import { RemindersPage } from '@/features/reminders/RemindersPage';
import { FollowUpsPage } from '@/features/reminders/FollowUpsPage';
import { ReportsOverviewPage } from '@/features/reports/ReportsOverviewPage';
import { CollectionsReportPage } from '@/features/reports/CollectionsReportPage';
import { WithdrawalsReportPage } from '@/features/reports/WithdrawalsReportPage';
import { BatchReportPage } from '@/features/reports/BatchReportPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { Skeleton } from '@/components/ui/Skeleton';

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search || '/dashboard';
    }
    return '/dashboard';
  });

  // Handle URL change
  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Split path from search params
  const [pathOnly, searchOnly] = currentPath.split('?');
  const searchParams = useMemo(() => new URLSearchParams(searchOnly || ''), [searchOnly]);

  // Loading indicator for initial session verification
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Checking SCMS session...</p>
        </div>
      </div>
    );
  }

  // Public authentication routes
  if (pathOnly === '/login') {
    return <LoginPage onNavigate={navigate} />;
  }
  if (pathOnly === '/forgot-password') {
    return <ForgotPasswordPage onNavigate={navigate} />;
  }
  if (pathOnly === '/reset-password') {
    return <ResetPasswordPage onNavigate={navigate} />;
  }

  // Fallback to login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onNavigate={navigate} />;
  }

  // Authenticated route matching
  const renderRoute = () => {
    // Dashboard
    if (pathOnly === '/' || pathOnly === '/dashboard') {
      return <DashboardPage onNavigate={navigate} />;
    }

    // Members
    if (pathOnly === '/members') {
      return <MembersListPage onNavigate={navigate} />;
    }
    if (pathOnly === '/members/new') {
      return <MemberCreatePage onNavigate={navigate} />;
    }
    const memberMatch = pathOnly.match(/^\/members\/([^/]+)$/);
    if (memberMatch) {
      return <MemberDetailPage memberId={memberMatch[1]} onNavigate={navigate} />;
    }

    // Plans
    if (pathOnly === '/plans') {
      return <PlansListPage onNavigate={navigate} />;
    }
    const planMatch = pathOnly.match(/^\/plans\/([^/]+)$/);
    if (planMatch) {
      return <PlanDetailPage planId={planMatch[1]} onNavigate={navigate} />;
    }

    // Batches
    if (pathOnly === '/batches') {
      return <BatchesListPage onNavigate={navigate} />;
    }
    if (pathOnly === '/batches/new') {
      return <BatchCreatePage onNavigate={navigate} />;
    }
    const batchInstallmentsMatch = pathOnly.match(/^\/batches\/([^/]+)\/installments$/);
    if (batchInstallmentsMatch) {
      return (
        <BatchDetailPage
          batchId={batchInstallmentsMatch[1]}
          onNavigate={navigate}
          initialTab="installments"
        />
      );
    }
    const batchLifecycleMatch = pathOnly.match(/^\/batches\/([^/]+)\/lifecycle$/);
    if (batchLifecycleMatch) {
      return (
        <BatchDetailPage
          batchId={batchLifecycleMatch[1]}
          onNavigate={navigate}
          initialTab="lifecycle"
        />
      );
    }
    const batchMatch = pathOnly.match(/^\/batches\/([^/]+)$/);
    if (batchMatch) {
      return <BatchDetailPage batchId={batchMatch[1]} onNavigate={navigate} />;
    }

    // Enrollments
    if (pathOnly === '/enrollments') {
      return <EnrollmentsListPage onNavigate={navigate} />;
    }
    if (pathOnly === '/enrollments/new') {
      return <EnrollmentCreatePage onNavigate={navigate} />;
    }
    if (pathOnly === '/enrollments/catch-up') {
      return <EnrollmentCatchUpPage onNavigate={navigate} />;
    }
    const enrollmentMatch = pathOnly.match(/^\/enrollments\/([^/]+)$/);
    if (enrollmentMatch) {
      return <EnrollmentDetailPage enrollmentId={enrollmentMatch[1]} onNavigate={navigate} />;
    }

    // Payments
    if (pathOnly === '/payments') {
      return <PaymentsListPage onNavigate={navigate} />;
    }
    if (pathOnly === '/payments/new') {
      const enrId = searchParams.get('enrollmentId') || undefined;
      return <PaymentCreatePage initialEnrollmentId={enrId} onNavigate={navigate} />;
    }
    const paymentMatch = pathOnly.match(/^\/payments\/([^/]+)$/);
    if (paymentMatch) {
      return <PaymentDetailPage paymentId={paymentMatch[1]} onNavigate={navigate} />;
    }

    // Receipts
    if (pathOnly === '/receipts') {
      return <ReceiptsListPage onNavigate={navigate} />;
    }
    const receiptMatch = pathOnly.match(/^\/receipts\/([^/]+)$/);
    if (receiptMatch) {
      return <ReceiptDetailPage receiptId={receiptMatch[1]} onNavigate={navigate} />;
    }

    // Withdrawals
    if (pathOnly === '/withdrawals') {
      return <WithdrawalsListPage onNavigate={navigate} />;
    }
    const withdrawalMatch = pathOnly.match(/^\/withdrawals\/([^/]+)$/);
    if (withdrawalMatch) {
      return <WithdrawalDetailPage withdrawalId={withdrawalMatch[1]} onNavigate={navigate} />;
    }

    // Documents
    if (pathOnly === '/documents' || pathOnly.startsWith('/documents/')) {
      return <DocumentsListPage onNavigate={navigate} />;
    }

    // Reminders & Follow-ups
    if (pathOnly === '/reminders') {
      return <RemindersPage onNavigate={navigate} />;
    }
    if (pathOnly === '/follow-ups') {
      return <FollowUpsPage onNavigate={navigate} />;
    }

    // Reports
    if (pathOnly === '/reports') {
      return <ReportsOverviewPage onNavigate={navigate} />;
    }
    if (pathOnly === '/reports/collections') {
      return <CollectionsReportPage onNavigate={navigate} />;
    }
    if (pathOnly === '/reports/withdrawals') {
      return <WithdrawalsReportPage onNavigate={navigate} />;
    }
    const batchReportMatch = pathOnly.match(/^\/reports\/batches\/([^/]+)$/);
    if (batchReportMatch) {
      return <BatchReportPage batchId={batchReportMatch[1]} onNavigate={navigate} />;
    }

    // System
    if (pathOnly === '/change-password') {
      return <ChangePasswordPage onNavigate={navigate} />;
    }
    if (pathOnly === '/settings') {
      return <SettingsPage />;
    }

    // Default route
    return <DashboardPage onNavigate={navigate} />;
  };

  return (
    <AdminLayout currentPath={pathOnly} onNavigate={navigate}>
      {renderRoute()}
    </AdminLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  );
}
