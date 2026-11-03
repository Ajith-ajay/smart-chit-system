import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api/payments';
import { receiptsApi } from '@/lib/api/receipts';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { formatINR, formatDate, formatDateTime } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import {
  ArrowLeft,
  RotateCcw,
  Receipt as ReceiptIcon,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

export interface PaymentDetailPageProps {
  paymentId: string;
  onNavigate: (path: string) => void;
}

export const PaymentDetailPage: React.FC<PaymentDetailPageProps> = ({ paymentId, onNavigate }) => {
  const queryClient = useQueryClient();
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);

  const {
    data: payment,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => paymentsApi.getById(paymentId),
  });

  // Query receipt associated with payment
  const { data: receipt } = useQuery({
    queryKey: ['payment-receipt', paymentId],
    queryFn: () => receiptsApi.getByPaymentId(paymentId),
    enabled: Boolean(payment),
  });

  const reverseMutation = useMutation({
    mutationFn: (reason?: string) => paymentsApi.reverse(paymentId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', paymentId] });
      queryClient.invalidateQueries({ queryKey: ['payment-receipt', paymentId] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setIsReverseModalOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/payments')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Payments
        </Button>
        <Alert variant="error" title="Payment Not Found">
          {extractErrorMessage(error)}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onNavigate(payment.enrollmentId ? `/enrollments/${payment.enrollmentId}` : '/payments')
          }
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>

        <div className="flex items-center gap-2">
          {receipt && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate(`/receipts/${receipt.id}`)}
              icon={<ReceiptIcon className="w-3.5 h-3.5" />}
            >
              View Receipt ({receipt.receiptNumber})
            </Button>
          )}

          {payment.status === 'SUCCESS' && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setIsReverseModalOpen(true)}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reverse Payment
            </Button>
          )}
        </div>
      </div>

      <PageHeader
        title={`Payment Transaction ${payment.receipt?.receiptNumber || `#${payment.id.slice(0, 8)}`}`}
        description={`Executed on ${formatDate(payment.paymentDate)} via ${payment.paymentMethod}`}
      />

      {payment.status === 'REVERSED' && (
        <Alert variant="warning" title="Transaction Reversed">
          This payment was reversed on {formatDateTime(payment.reversedAt || '')}. Reversal
          preserves financial history and restored the installment debt.
          {payment.reverseReason && (
            <p className="mt-1 font-semibold text-amber-950">Reason: {payment.reverseReason}</p>
          )}
        </Alert>
      )}

      {/* Transaction Details Card */}
      <Card className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block uppercase">Payment Amount</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{formatINR(payment.amount)}</p>
          </div>

          <div>
            <span className="text-slate-400 block uppercase">Payment Method</span>
            <p className="text-sm font-bold text-slate-900 mt-1">{payment.paymentMethod}</p>
          </div>

          <div>
            <span className="text-slate-400 block uppercase">Transaction Status</span>
            <div className="mt-1">
              <Badge variant={payment.status === 'SUCCESS' ? 'success' : 'error'}>
                {payment.status}
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block uppercase">Allocation Mode</span>
            <p className="text-sm font-semibold text-slate-900 mt-1">{payment.allocationMode}</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Transaction Reference / Cheque #</span>
            <span className="text-slate-800 font-mono mt-0.5 block">
              {payment.reference || 'None provided'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Target Enrollment</span>
            <button
              onClick={() => onNavigate(`/enrollments/${payment.enrollmentId}`)}
              className="text-slate-900 font-semibold underline mt-0.5 block text-left"
            >
              Enrollment #{payment.enrollmentId.slice(0, 8)}
            </button>
          </div>

          {payment.notes && (
            <div className="sm:col-span-2">
              <span className="text-slate-400 block">Audit Notes</span>
              <p className="text-slate-700 mt-0.5">{payment.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Allocations breakdown */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Installment Allocations</h3>
            <p className="text-xs text-slate-500">
              How this payment was applied to specific installment schedule lines
            </p>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </div>

        {!payment.allocations || payment.allocations.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center border border-dashed rounded-md">
            No line-item allocations attached or payment was placed into advance pool.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Installment</TableHead>
                <TableHead>Allocation Record ID</TableHead>
                <TableHead className="text-right">Allocated Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payment.allocations.map((alloc) => (
                <TableRow key={alloc.id}>
                  <TableCell className="font-mono text-xs font-bold text-slate-900">
                    Installment #{alloc.installmentNumber}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">
                    {alloc.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-slate-900">
                    {formatINR(alloc.allocatedAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Confirmation Modal for Reverse */}
      <ConfirmationModal
        isOpen={isReverseModalOpen}
        onClose={() => setIsReverseModalOpen(false)}
        onConfirm={(reason) => reverseMutation.mutate(reason)}
        title="Reverse Payment"
        description="Are you sure you want to reverse this payment? Reversal preserves the financial history and does not delete the original transaction. Installment allocations will be rolled back."
        confirmText="Confirm Reversal"
        variant="danger"
        requireReason
        reasonLabel="Reason for Reversal"
        reasonPlaceholder="e.g. Counter deposit entry correction / Cheque returned"
        isLoading={reverseMutation.isPending}
      />
    </div>
  );
};
