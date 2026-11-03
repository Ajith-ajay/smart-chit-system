import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api/payments';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { formatINR, toInputDate } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import {
  AllocationMode,
  CreatePaymentDto,
  Enrollment,
  PaymentMethod,
  PaymentAllocationItem,
} from '@/types';
import { ArrowLeft, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';

export interface PaymentCreatePageProps {
  initialEnrollmentId?: string;
  onNavigate: (path: string) => void;
}

export const PaymentCreatePage: React.FC<PaymentCreatePageProps> = ({
  initialEnrollmentId,
  onNavigate,
}) => {
  const queryClient = useQueryClient();
  const [enrollmentId, setEnrollmentId] = useState(initialEnrollmentId || '');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(toInputDate(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('AUTOMATIC');
  const [manualAllocations, setManualAllocations] = useState<Record<number, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch enrollments for dropdown
  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments-dropdown'],
    queryFn: async () => {
      const res = await enrollmentsApi.getAll({ limit: 100, status: 'ACTIVE' });
      return Array.isArray(res) ? res : res.data || [];
    },
  });
  const enrollmentsList: Enrollment[] = enrollmentsData || [];

  // Fetch summary for chosen enrollment
  const { data: summary } = useQuery({
    queryKey: ['enrollment-summary', enrollmentId],
    queryFn: () => paymentsApi.getEnrollmentSummary(enrollmentId),
    enabled: Boolean(enrollmentId),
  });

  const mutation = useMutation({
    mutationFn: (dto: CreatePaymentDto) => paymentsApi.create(enrollmentId, dto),
    onSuccess: (newPayment) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-summary', enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      onNavigate(`/payments/${newPayment.id}`);
    },
    onError: (err) => {
      setErrorMsg(extractErrorMessage(err));
    },
  });

  const handleManualAllocationChange = (instNumber: number, val: string) => {
    setManualAllocations((prev) => ({
      ...prev,
      [instNumber]: val,
    }));
  };

  // Compute manual total
  const manualTotal = Object.values(manualAllocations).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0,
  );
  const paymentAmountNum = parseFloat(amount) || 0;
  const isAllocationBalanced = Math.abs(manualTotal - paymentAmountNum) < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!enrollmentId) {
      setErrorMsg('Please select an enrollment.');
      return;
    }
    if (paymentAmountNum <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    let allocationsPayload: PaymentAllocationItem[] | undefined = undefined;

    if (allocationMode === 'MANUAL') {
      if (!isAllocationBalanced) {
        setErrorMsg(
          `Manual allocation total (${formatINR(manualTotal)}) must exactly equal payment amount (${formatINR(paymentAmountNum)}).`,
        );
        return;
      }
      allocationsPayload = Object.entries(manualAllocations)
        .filter(([_, val]) => (parseFloat(val) || 0) > 0)
        .map(([instNum, val]) => ({
          installmentNumber: parseInt(instNum, 10),
          amount: parseFloat(val),
        }));
    }

    mutation.mutate({
      amount: paymentAmountNum,
      paymentDate,
      paymentMethod,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
      allocationMode,
      allocations: allocationsPayload,
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(enrollmentId ? `/enrollments/${enrollmentId}` : '/payments')}
        icon={<ArrowLeft className="w-4 h-4" />}
      >
        Back
      </Button>

      <PageHeader
        title="Collect Chit Payment"
        description="Records collections with automatic oldest-due settlement, partial installments, daily deposits, or manual allocation"
      />

      {errorMsg && (
        <Alert variant="error" title="Payment Submission Error">
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Payment Fields */}
        <Card className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Select
                label="Target Enrollment"
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
                required
              >
                <option value="">-- Choose Member Enrollment --</option>
                {enrollmentsList.map((enr) => (
                  <option key={enr.id} value={enr.id}>
                    {enr.enrollmentNumber || enr.id.slice(0, 8)} - {enr.member?.firstName}{' '}
                    {enr.member?.lastName} ({enr.batch?.name} - {formatINR(enr.scheduledAmount)})
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="Payment Amount (₹)"
              type="number"
              step="0.01"
              placeholder="e.g. 5000, 2500, or 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              helperText="Accepts full installment, partial amounts, micro/daily payments, or advance bulk sum."
              required
              autoFocus
            />

            <Input
              label="Payment Date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />

            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              required
            >
              <option value="CASH">Cash Deposit</option>
              <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="CHEQUE">Cheque</option>
              <option value="ONLINE">Online Portal</option>
            </Select>

            <Input
              label="Transaction Reference / Cheque #"
              placeholder="e.g. UTR-987654321 / Cheque #004521"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />

            <div className="sm:col-span-2">
              <Input
                label="Internal Audit Notes (Optional)"
                placeholder="e.g. Received at counter by cashier"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Allocation Mode Selector */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Allocation Strategy</h3>
              <p className="text-xs text-slate-500">
                Determine how this payment is applied against installment schedule
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
              <button
                type="button"
                onClick={() => setAllocationMode('AUTOMATIC')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  allocationMode === 'AUTOMATIC'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Automatic (Oldest First)
              </button>
              <button
                type="button"
                onClick={() => setAllocationMode('MANUAL')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  allocationMode === 'MANUAL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Manual Allocation
              </button>
            </div>
          </div>

          {allocationMode === 'AUTOMATIC' ? (
            <div className="rounded-md bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Automatic Allocation Mode Enabled</p>
              <p className="mt-1">
                The NestJS backend will automatically allocate this payment against the oldest
                outstanding installments in chronological sequence. Any excess amount beyond
                outstanding dues will be preserved as advance credit.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Manual Allocation Mode</p>
                  <p className="text-[11px] mt-0.5">
                    Specify the exact amount to apply to each installment (e.g. Scenario F:
                    explicitly allocating to a later installment). Total must match payment amount (
                    {formatINR(paymentAmountNum)}).
                  </p>
                </div>
              </div>

              {/* Installments table */}
              {summary?.installments ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Installment</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Already Paid</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead className="w-40 text-right">Allocation Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.installments.map((inst) => (
                      <TableRow key={inst.installmentNumber}>
                        <TableCell className="font-mono text-xs font-semibold text-slate-900">
                          Installment #{inst.installmentNumber}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {formatINR(inst.scheduledAmount)}
                        </TableCell>
                        <TableCell className="text-xs text-emerald-700">
                          {formatINR(inst.paidAmount)}
                        </TableCell>
                        <TableCell className="text-xs text-rose-700 font-semibold">
                          {formatINR(inst.outstandingAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={manualAllocations[inst.installmentNumber] || ''}
                            onChange={(e) =>
                              handleManualAllocationChange(inst.installmentNumber, e.target.value)
                            }
                            className="w-32 py-1 px-2 text-xs text-right rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Select an enrollment to view installment schedule.
                </p>
              )}

              {/* Manual balance footer */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                <span>
                  Allocated: <strong>{formatINR(manualTotal)}</strong> /{' '}
                  <strong>{formatINR(paymentAmountNum)}</strong>
                </span>
                <span
                  className={
                    isAllocationBalanced ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'
                  }
                >
                  {isAllocationBalanced
                    ? '✓ Allocations Match Total'
                    : `Difference: ${formatINR(Math.abs(paymentAmountNum - manualTotal))}`}
                </span>
              </div>
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate('/payments')}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
            loadingText="Processing Payment..."
            icon={<CreditCard className="w-4 h-4" />}
          >
            Submit Payment Transaction
          </Button>
        </div>
      </form>
    </div>
  );
};
