import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersApi } from '@/lib/api/reminders';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { formatDate, formatDateTime, toInputDate } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { Reminder, ReminderStatus, DispatchDueResult, Enrollment } from '@/types';
import {
  Bell,
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';

export interface RemindersPageProps {
  onNavigate: (path: string) => void;
}

export const RemindersPage: React.FC<RemindersPageProps> = ({ onNavigate }) => {
  const queryClient = useQueryClient();
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<DispatchDueResult | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // New reminder modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [targetEnrollmentId, setTargetEnrollmentId] = useState('');
  const [installmentNumber, setInstallmentNumber] = useState('1');
  const [message, setMessage] = useState('');
  const [scheduledDate, setScheduledDate] = useState(toInputDate(new Date()));

  // Fetch reminders list
  const {
    data: reminders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => remindersApi.getAll(),
  });

  // Fetch enrollments for create modal
  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments-dropdown'],
    queryFn: async () => {
      const res = await enrollmentsApi.getAll({ limit: 100, status: 'ACTIVE' });
      return Array.isArray(res) ? res : res.data || [];
    },
  });
  const enrollments: Enrollment[] = enrollmentsData || [];

  // Dispatch due WhatsApp reminders mutation
  const dispatchMutation = useMutation({
    mutationFn: () => remindersApi.dispatchDueWhatsApp(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setDispatchResult(result);
      setDispatchError(null);
      setIsDispatchModalOpen(false);
    },
    onError: (err) => {
      setDispatchError(extractErrorMessage(err));
      setDispatchResult(null);
      setIsDispatchModalOpen(false);
    },
  });

  // Create reminder mutation
  const createMutation = useMutation({
    mutationFn: () =>
      remindersApi.create(targetEnrollmentId, {
        channel: 'WHATSAPP',
        message: message.trim(),
        scheduledDate,
        installmentNumber: parseInt(installmentNumber, 10) || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setIsCreateOpen(false);
      setMessage('');
    },
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReminderStatus }) =>
      remindersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const getStatusBadge = (status: ReminderStatus) => {
    switch (status) {
      case 'SENT':
        return <Badge variant="success">SENT</Badge>;
      case 'FAILED':
        return <Badge variant="error">FAILED</Badge>;
      case 'SCHEDULED':
        return <Badge variant="info">SCHEDULED</Badge>;
      case 'PENDING':
        return <Badge variant="warning">PENDING</Badge>;
      case 'CANCELLED':
      default:
        return <Badge variant="outline">CANCELLED</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Reminders & WhatsApp Dispatch"
        description="Schedule installment notifications and trigger WhatsApp dispatch for due reminders"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Schedule Reminder
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsDispatchModalOpen(true)}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Dispatch Due WhatsApp Reminders
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="error" title="Could not load reminders">
          {extractErrorMessage(error)}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Dispatch Error Notification */}
      {dispatchError && (
        <Alert variant="error" title="WhatsApp Dispatch Failed">
          <p>{dispatchError}</p>
          <p className="mt-1 text-[11px] text-rose-700">
            Ensure WhatsApp API credentials (e.g. WHATSAPP_API_KEY, WHATSAPP_PHONE_NUMBER_ID) are
            configured in the NestJS backend environment.
          </p>
        </Alert>
      )}

      {/* Dispatch Result Card */}
      {dispatchResult && (
        <Card className="p-4 bg-emerald-50/50 border-emerald-200 text-xs">
          <div className="flex items-center gap-2 font-semibold text-emerald-950 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp Dispatch Completed:</span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-white p-2 rounded border border-emerald-200">
              <span className="text-[10px] text-slate-500 uppercase block">Processed</span>
              <span className="text-base font-bold text-slate-900">
                {dispatchResult.totalProcessed}
              </span>
            </div>
            <div className="bg-white p-2 rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-700 uppercase block font-semibold">
                Sent Successfully
              </span>
              <span className="text-base font-bold text-emerald-700">
                {dispatchResult.sentCount}
              </span>
            </div>
            <div className="bg-white p-2 rounded border border-emerald-200">
              <span className="text-[10px] text-rose-700 uppercase block font-semibold">
                Failed
              </span>
              <span className="text-base font-bold text-rose-700">
                {dispatchResult.failedCount}
              </span>
            </div>
            <div className="bg-white p-2 rounded border border-emerald-200">
              <span className="text-[10px] text-slate-500 uppercase block">Skipped</span>
              <span className="text-base font-bold text-slate-900">
                {dispatchResult.skippedCount}
              </span>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <EmptyState
          title="No Reminders Scheduled"
          description="Schedule upcoming installment notifications or WhatsApp alerts for enrolled members."
          actionLabel="Schedule Reminder"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target Member</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Message Text</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.map((r: Reminder) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">
                    <p className="font-semibold text-slate-900">
                      {r.member
                        ? `${r.member.firstName} ${r.member.lastName}`
                        : r.memberId
                          ? `Member ${r.memberId.slice(0, 8)}`
                          : 'Enrolled Member'}
                    </p>
                    <p className="text-slate-500 font-mono text-[11px]">{r.member?.phone}</p>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-600">
                    <button
                      onClick={() => onNavigate(`/enrollments/${r.enrollmentId}`)}
                      className="hover:underline"
                    >
                      ENR-{r.enrollmentId.slice(0, 8)}
                    </button>
                    {r.installmentNumber && (
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Inst #{r.installmentNumber}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      {r.channel}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 max-w-xs">
                    <span className="truncate block" title={r.message}>
                      {r.message}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(r.scheduledDate)}
                  </TableCell>
                  <TableCell>{getStatusBadge(r.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {r.status !== 'SENT' && r.status !== 'CANCELLED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateStatusMutation.mutate({ id: r.id, status: 'CANCELLED' })
                          }
                          className="text-slate-500 hover:text-rose-600"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Confirmation Modal for WhatsApp Dispatch */}
      <ConfirmationModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        onConfirm={() => dispatchMutation.mutate()}
        title="Dispatch Due WhatsApp Reminders"
        description="This will attempt to dispatch all currently due reminders via the backend WhatsApp integration service. If WhatsApp credentials are not configured on the NestJS backend, the real error will be reported."
        confirmText="Dispatch Now"
        variant="primary"
        isLoading={dispatchMutation.isPending}
      />

      {/* Modal: Schedule Reminder */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule Payment Reminder"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <Select
            label="Target Member Enrollment"
            value={targetEnrollmentId}
            onChange={(e) => setTargetEnrollmentId(e.target.value)}
            required
          >
            <option value="">-- Choose Enrollment --</option>
            {enrollments.map((enr) => (
              <option key={enr.id} value={enr.id}>
                {enr.enrollmentNumber || enr.id.slice(0, 8)} ({enr.member?.firstName}{' '}
                {enr.member?.lastName})
              </option>
            ))}
          </Select>

          <Input
            label="Installment Number (Optional)"
            type="number"
            min={1}
            max={20}
            value={installmentNumber}
            onChange={(e) => setInstallmentNumber(e.target.value)}
          />

          <Input
            label="Scheduled Date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              WhatsApp Reminder Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="e.g. Dear Member, your chit installment is due for settlement. Kindly visit the counter or pay via UPI."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!targetEnrollmentId || !message.trim()}
              isLoading={createMutation.isPending}
              loadingText="Scheduling..."
            >
              Save Reminder
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
