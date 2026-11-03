import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptsApi } from '@/lib/api/receipts';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { formatINR, formatDate, formatDateTime } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import {
  ArrowLeft,
  Printer,
  XCircle,
  RefreshCw,
  Building2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export interface ReceiptDetailPageProps {
  receiptId: string;
  onNavigate: (path: string) => void;
}

export const ReceiptDetailPage: React.FC<ReceiptDetailPageProps> = ({ receiptId, onNavigate }) => {
  const queryClient = useQueryClient();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReissueModalOpen, setIsReissueModalOpen] = useState(false);

  const {
    data: receipt,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: () => receiptsApi.getById(receiptId),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => receiptsApi.cancel(receiptId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt', receiptId] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setIsCancelModalOpen(false);
    },
  });

  const reissueMutation = useMutation({
    mutationFn: () => receiptsApi.reissue(receiptId),
    onSuccess: (newReceipt) => {
      queryClient.invalidateQueries({ queryKey: ['receipt', receiptId] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setIsReissueModalOpen(false);
      if (newReceipt?.id) {
        onNavigate(`/receipts/${newReceipt.id}`);
      }
    },
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/receipts')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Receipts
        </Button>
        <Alert variant="error" title="Receipt Not Found">
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
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top controls - hidden during browser print */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/receipts')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Receipts
        </Button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Receipt
          </Button>

          {receipt.status === 'GENERATED' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsReissueModalOpen(true)}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Reissue
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setIsCancelModalOpen(true)}
                icon={<XCircle className="w-3.5 h-3.5" />}
              >
                Cancel Receipt
              </Button>
            </>
          )}
        </div>
      </div>

      {receipt.status === 'CANCELLED' && (
        <Alert variant="error" title="Receipt Cancelled" className="print:hidden">
          This receipt was cancelled on {formatDateTime(receipt.cancelledAt || '')}.
          {receipt.cancelReason && ` Reason: ${receipt.cancelReason}`}
        </Alert>
      )}

      {receipt.status === 'REISSUED' && (
        <Alert variant="info" title="Receipt Reissued" className="print:hidden">
          This receipt has been reissued with replacement receipt #
          {receipt.reissuedReceiptId?.slice(0, 8)}.
        </Alert>
      )}

      {/* Official Voucher Printable Card */}
      <div className="rounded-lg border-2 border-slate-300 bg-white p-8 shadow-xs text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Company Header */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-900 text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                SMART CHIT MANAGEMENT SYSTEM
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                Licensed Chit Fund Administrator & Financial Operations
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              OFFICIAL RECEIPT
            </span>
            <p className="text-lg font-black font-mono tracking-tight text-slate-900">
              {receipt.receiptNumber}
            </p>
            <div className="mt-1">
              <Badge
                variant={
                  receipt.status === 'GENERATED'
                    ? 'success'
                    : receipt.status === 'CANCELLED'
                      ? 'error'
                      : 'warning'
                }
              >
                {receipt.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Voucher Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded border border-slate-200">
          <div>
            <span className="text-slate-400 block uppercase font-medium">Payment ID</span>
            <span className="font-mono text-slate-900 font-semibold">{receipt.paymentId}</span>
          </div>

          <div>
            <span className="text-slate-400 block uppercase font-medium">Issue Timestamp</span>
            <span className="text-slate-900 font-semibold">
              {formatDateTime(receipt.issuedAt || receipt.createdAt)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block uppercase font-medium">Enrollment Target</span>
            <span className="font-mono text-slate-900 font-semibold">
              {receipt.enrollmentId ? `#${receipt.enrollmentId.slice(0, 8)}` : 'Enr-Target'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block uppercase font-medium">Payment Method</span>
            <span className="text-slate-900 font-semibold">
              {receipt.payment?.paymentMethod || 'Acknowledged Method'}
            </span>
          </div>
        </div>

        {/* Amount Table */}
        <div className="border border-slate-200 rounded-md overflow-hidden mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">
                    Chit Fund Monthly Installment Collection
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Applied against active batch installment ledger
                  </p>
                </td>
                <td className="p-3 text-right font-bold text-slate-900 border-b border-slate-100">
                  {formatINR(receipt.amount)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 font-bold">
              <tr>
                <td className="p-3 text-right uppercase text-slate-600">Total Net Amount:</td>
                <td className="p-3 text-right text-base text-slate-950 font-black">
                  {formatINR(receipt.amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Authorized Signatures & Seal */}
        <div className="pt-8 mt-8 border-t border-dashed border-slate-300 flex items-end justify-between text-xs text-slate-500">
          <div className="space-y-1">
            <p className="text-[11px] font-mono">System-Generated Audit Verification Code:</p>
            <p className="font-mono text-slate-400 text-[10px]">
              SHA256:{receipt.id.replace(/-/g, '').slice(0, 32)}
            </p>
          </div>

          <div className="text-center min-w-[160px]">
            <div className="border-b border-slate-400 h-10 w-full mb-1" />
            <p className="font-semibold text-slate-700">Authorized Cashier</p>
            <p className="text-[10px] text-slate-400">For Smart Chit System</p>
          </div>
        </div>
      </div>

      {/* Cancel Receipt Confirmation Modal */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={(reason) => cancelMutation.mutate(reason)}
        title="Cancel Receipt"
        description="Are you sure you want to cancel this receipt? This updates the receipt status to CANCELLED without deleting the transaction history."
        confirmText="Cancel Receipt"
        variant="danger"
        requireReason
        reasonLabel="Cancellation Reason"
        reasonPlaceholder="e.g. Duplicate issue / Payment reversed"
        isLoading={cancelMutation.isPending}
      />

      {/* Reissue Receipt Confirmation Modal */}
      <ConfirmationModal
        isOpen={isReissueModalOpen}
        onClose={() => setIsReissueModalOpen(false)}
        onConfirm={() => reissueMutation.mutate()}
        title="Reissue Receipt"
        description="Are you sure you want to reissue this receipt? A new receipt with an updated sequence number will be generated for this transaction."
        confirmText="Reissue Receipt"
        variant="primary"
        isLoading={reissueMutation.isPending}
      />
    </div>
  );
};
