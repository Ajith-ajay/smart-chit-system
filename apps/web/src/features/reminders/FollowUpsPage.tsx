import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersApi } from '@/lib/api/reminders';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
import { FollowUp, FollowUpChannel, FollowUpStatus, CreateFollowUpDto, Enrollment } from '@/types';
import {
  PhoneCall,
  Plus,
  CheckCircle,
  Clock,
  Phone,
  MessageSquare,
  UserCheck,
  Calendar,
} from 'lucide-react';

export interface FollowUpsPageProps {
  onNavigate: (path: string) => void;
}

export const FollowUpsPage: React.FC<FollowUpsPageProps> = ({ onNavigate }) => {
  const queryClient = useQueryClient();
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [targetEnrollmentId, setTargetEnrollmentId] = useState('');
  const [channel, setChannel] = useState<FollowUpChannel>('CALL');
  const [status, setStatus] = useState<FollowUpStatus>('CONTACTED');
  const [notes, setNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [completingFollowUpId, setCompletingFollowUpId] = useState<string | null>(null);

  const {
    data: followUps = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['follow-ups'],
    queryFn: () => remindersApi.getFollowUps(),
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments-dropdown'],
    queryFn: async () => {
      const res = await enrollmentsApi.getAll({ limit: 100, status: 'ACTIVE' });
      return Array.isArray(res) ? res : res.data || [];
    },
  });
  const enrollments: Enrollment[] = enrollmentsData || [];

  const logMutation = useMutation({
    mutationFn: (dto: CreateFollowUpDto) => remindersApi.createFollowUp(targetEnrollmentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      setIsLogOpen(false);
      setNotes('');
      setNextFollowUpDate('');
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      remindersApi.completeFollowUp(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      setCompletingFollowUpId(null);
    },
  });

  const getStatusBadge = (st: FollowUpStatus) => {
    switch (st) {
      case 'PROMISED_TO_PAY':
      case 'COMPLETED':
        return <Badge variant="success">{st}</Badge>;
      case 'NO_ANSWER':
      case 'BUSY':
        return <Badge variant="warning">{st}</Badge>;
      case 'WRONG_NUMBER':
        return <Badge variant="error">{st}</Badge>;
      case 'CONTACTED':
      default:
        return <Badge variant="info">{st}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collection Follow-ups"
        description="Log phone calls, in-person member visits, promise-to-pay commitments, and track resolution"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsLogOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Log Follow-up
          </Button>
        }
      />

      {error && (
        <Alert variant="error" title="Could not load follow-ups">
          {extractErrorMessage(error)}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : followUps.length === 0 ? (
        <EmptyState
          title="No Follow-ups Logged"
          description="Keep detailed audit notes of member communication, promised payments, and phone calls."
          actionLabel="Log Follow-up"
          onAction={() => setIsLogOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Next Follow-up</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {followUps.map((fu: FollowUp) => (
                <TableRow key={fu.id}>
                  <TableCell className="text-xs">
                    <p className="font-semibold text-slate-900">
                      {fu.member
                        ? `${fu.member.firstName} ${fu.member.lastName}`
                        : 'Enrolled Member'}
                    </p>
                    <p className="text-slate-500 font-mono text-[11px]">{fu.member?.phone}</p>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-600">
                    <button
                      onClick={() => onNavigate(`/enrollments/${fu.enrollmentId}`)}
                      className="hover:underline"
                    >
                      ENR-{fu.enrollmentId.slice(0, 8)}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(fu.followUpDate || fu.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">{fu.channel}</TableCell>
                  <TableCell>{getStatusBadge(fu.status)}</TableCell>
                  <TableCell className="text-xs text-slate-700 max-w-xs">
                    <span className="truncate block" title={fu.notes || ''}>
                      {fu.notes || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {fu.nextFollowUpDate ? formatDate(fu.nextFollowUpDate) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {!fu.isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCompletingFollowUpId(fu.id)}
                        className="text-emerald-700 hover:text-emerald-800"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Complete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal: Log Follow-up */}
      <Modal
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        title="Log Member Communication"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            logMutation.mutate({
              channel,
              status,
              notes: notes.trim() || undefined,
              nextFollowUpDate: nextFollowUpDate || undefined,
            });
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

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Communication Channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as FollowUpChannel)}
            >
              <option value="CALL">Phone Call</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SMS">SMS Message</option>
              <option value="IN_PERSON">In-person Counter / Home Visit</option>
            </Select>

            <Select
              label="Interaction Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as FollowUpStatus)}
            >
              <option value="CONTACTED">Spoke with Member</option>
              <option value="PROMISED_TO_PAY">Promised to Pay</option>
              <option value="NO_ANSWER">No Answer / Ringing</option>
              <option value="BUSY">Line Busy</option>
              <option value="WRONG_NUMBER">Invalid Phone Number</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Interaction Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="e.g. Member stated salary is credited on 5th, promised to visit office on Saturday."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>

          <Input
            label="Next Follow-up Reminder Date (Optional)"
            type="date"
            value={nextFollowUpDate}
            onChange={(e) => setNextFollowUpDate(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsLogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!targetEnrollmentId || !notes.trim()}
              isLoading={logMutation.isPending}
              loadingText="Logging..."
            >
              Save Follow-up Log
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal: Mark Complete */}
      <ConfirmationModal
        isOpen={!!completingFollowUpId}
        onClose={() => setCompletingFollowUpId(null)}
        onConfirm={(reason) => {
          if (completingFollowUpId) {
            completeMutation.mutate({ id: completingFollowUpId, notes: reason });
          }
        }}
        title="Complete Follow-up"
        description="Mark this communication commitment as completed or payment settled."
        confirmText="Mark Completed"
        variant="primary"
        requireReason
        reasonLabel="Completion Resolution Notes"
        reasonPlaceholder="e.g. Member settled installment amount via UPI receipt #12345"
        isLoading={completeMutation.isPending}
      />
    </div>
  );
};
