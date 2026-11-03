import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { membersApi } from '@/lib/api/members';
import { batchesApi } from '@/lib/api/batches';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { formatINR } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { CreateEnrollmentDto, Batch, Member } from '@/types';
import { ArrowLeft, UserPlus, Info } from 'lucide-react';

export interface EnrollmentCreatePageProps {
  onNavigate: (path: string) => void;
}

export const EnrollmentCreatePage: React.FC<EnrollmentCreatePageProps> = ({ onNavigate }) => {
  const queryClient = useQueryClient();
  const [memberId, setMemberId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [batchPlanId, setBatchPlanId] = useState('');
  const [startInstallment, setStartInstallment] = useState('1');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch members
  const { data: membersData } = useQuery({
    queryKey: ['members-dropdown'],
    queryFn: async () => {
      const res = await membersApi.getAll({ limit: 100, isActive: true });
      return Array.isArray(res) ? res : res.data || [];
    },
  });
  const membersList: Member[] = membersData || [];

  // Fetch batches
  const { data: batchesData } = useQuery({
    queryKey: ['batches-dropdown'],
    queryFn: async () => {
      const res = await batchesApi.getAll({ limit: 100 });
      return Array.isArray(res) ? res : res.data || [];
    },
  });
  const batchesList: Batch[] = batchesData || [];

  // Currently selected batch
  const selectedBatch = batchesList.find((b) => b.id === batchId);
  const availableBatchPlans = selectedBatch?.batchPlans || [];

  const mutation = useMutation({
    mutationFn: (dto: CreateEnrollmentDto) => enrollmentsApi.create(dto),
    onSuccess: (newEnrollment) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      onNavigate(`/enrollments/${newEnrollment.id}`);
    },
    onError: (err) => {
      setErrorMsg(extractErrorMessage(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!memberId) {
      setErrorMsg('Please select a member.');
      return;
    }
    if (!batchId) {
      setErrorMsg('Please select a batch.');
      return;
    }
    if (!batchPlanId) {
      setErrorMsg('Please select a plan inside this batch.');
      return;
    }

    mutation.mutate({
      memberId,
      batchId,
      batchPlanId,
      startInstallment: parseInt(startInstallment, 10) || 1,
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('/enrollments')}
        icon={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Enrollments
      </Button>

      <PageHeader
        title="Enroll Member into Chit Batch"
        description="Allocate an active chit fund seat to a registered member"
      />

      {errorMsg && (
        <Alert variant="error" title="Enrollment Failed">
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-5 space-y-4">
          <Select
            label="Select Member"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            required
          >
            <option value="">-- Choose Member --</option>
            {membersList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName} ({m.phone}) - {m.memberCode || m.id.slice(0, 8)}
              </option>
            ))}
          </Select>

          <Select
            label="Select Batch"
            value={batchId}
            onChange={(e) => {
              setBatchId(e.target.value);
              setBatchPlanId('');
            }}
            required
          >
            <option value="">-- Choose Batch --</option>
            {batchesList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} (Status: {b.status}, Current: #{b.currentInstallment || 0})
              </option>
            ))}
          </Select>

          <Select
            label="Select Batch Plan"
            value={batchPlanId}
            onChange={(e) => setBatchPlanId(e.target.value)}
            disabled={!batchId}
            helperText={
              !batchId
                ? 'Select a batch first'
                : availableBatchPlans.length === 0
                  ? 'No plans configured for this batch yet'
                  : undefined
            }
            required
          >
            <option value="">-- Choose Plan Template inside Batch --</option>
            {availableBatchPlans.map((bp) => (
              <option key={bp.id} value={bp.id}>
                {bp.planTemplate?.name || 'Plan'} ({formatINR(bp.planTemplate?.chitValue)})
              </option>
            ))}
          </Select>

          <Input
            label="Start Installment Number"
            type="number"
            min={1}
            max={20}
            value={startInstallment}
            onChange={(e) => setStartInstallment(e.target.value)}
            helperText="Default is installment #1. If batch has already run, consider Catch-up workflow."
            required
          />

          <div className="rounded-md bg-sky-50 border border-sky-200 p-3 text-xs text-sky-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Notice for Mid-Cycle Enrollments</p>
              <p className="text-[11px] mt-0.5 text-sky-700">
                If the batch is already running and the member needs to pay missed installments up
                front, please use the <strong>Late / Catch-up Enrollment</strong> workflow to
                generate an authoritative catch-up calculation.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate('/enrollments')}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
            loadingText="Enrolling Member..."
            icon={<UserPlus className="w-4 h-4" />}
          >
            Create Enrollment
          </Button>
        </div>
      </form>
    </div>
  );
};
