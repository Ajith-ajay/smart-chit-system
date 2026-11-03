import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { batchesApi } from '@/lib/api/batches';
import { plansApi } from '@/lib/api/plans';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { formatDate, formatINR, toInputDate } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { Batch, BatchPlan, PlanTemplate, BatchInstallment } from '@/types';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Users,
  CreditCard,
  HandCoins,
  Cpu,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export interface BatchDetailPageProps {
  batchId: string;
  onNavigate: (path: string) => void;
  initialTab?: string;
}

export const BatchDetailPage: React.FC<BatchDetailPageProps> = ({
  batchId,
  onNavigate,
  initialTab = 'plans',
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [selectedPlanTemplateId, setSelectedPlanTemplateId] = useState('');
  const [planToRemove, setPlanToRemove] = useState<BatchPlan | null>(null);

  // Lifecycle confirmation modals state
  const [lifecycleAction, setLifecycleAction] = useState<
    'start' | 'complete' | 'cancel' | 'process-single' | 'process-all' | null
  >(null);
  const [asOfDate, setAsOfDate] = useState(toInputDate(new Date()));
  const [lifecycleResult, setLifecycleResult] = useState<unknown | null>(null);

  const {
    data: batch,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => batchesApi.getById(batchId),
  });

  const { data: allPlans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getAll(),
  });

  // Add plan mutation
  const addPlanMutation = useMutation({
    mutationFn: (planTemplateId: string) => batchesApi.addPlan(batchId, { planTemplateId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      setIsAddPlanModalOpen(false);
      setSelectedPlanTemplateId('');
    },
  });

  // Remove plan mutation
  const removePlanMutation = useMutation({
    mutationFn: (planTemplateId: string) => batchesApi.removePlan(batchId, planTemplateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      setPlanToRemove(null);
    },
  });

  // Lifecycle mutations
  const startMutation = useMutation({
    mutationFn: () => batchesApi.start(batchId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setLifecycleResult(data);
      setLifecycleAction(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => batchesApi.complete(batchId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setLifecycleResult(data);
      setLifecycleAction(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => batchesApi.cancel(batchId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setLifecycleResult(data);
      setLifecycleAction(null);
    },
  });

  const processLifecycleMutation = useMutation({
    mutationFn: (date?: string) => batchesApi.processLifecycle(batchId, { asOfDate: date }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setLifecycleResult(data);
      setLifecycleAction(null);
    },
  });

  const processAllMutation = useMutation({
    mutationFn: (date?: string) => batchesApi.processAllLifecycle({ asOfDate: date }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setLifecycleResult(data);
      setLifecycleAction(null);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/batches')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Batches
        </Button>
        <Alert variant="error" title="Batch Not Found">
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

  const tabs = [
    { id: 'plans', label: 'Plans', count: batch.batchPlans?.length || 0 },
    { id: 'installments', label: 'Installments (20 Months)' },
    { id: 'enrollments', label: 'Enrollments' },
    { id: 'lifecycle', label: 'Lifecycle Operations' },
    { id: 'reports', label: 'Batch Report' },
  ];

  // Derive installments
  const allInstallments: BatchInstallment[] = [];
  batch.batchPlans?.forEach((bp) => {
    if (bp.installments) {
      allInstallments.push(...bp.installments);
    }
  });

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('/batches')}
        icon={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Batches
      </Button>

      {/* Batch Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{batch.name}</h1>
              <Badge
                variant={
                  batch.status === 'RUNNING'
                    ? 'info'
                    : batch.status === 'COMPLETED'
                      ? 'success'
                      : batch.status === 'CANCELLED'
                        ? 'error'
                        : 'outline'
                }
              >
                {batch.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {batch.code || `ID: ${batch.id}`} · Start Date: {formatDate(batch.startDate)}
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600">
            <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200 text-center">
              <span className="text-[11px] text-slate-400 block uppercase">
                Current Installment
              </span>
              <strong className="text-base text-slate-900 font-bold">
                #{batch.currentInstallment || 0}
              </strong>{' '}
              / {batch.totalInstallments || 20}
            </div>

            <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200 text-center">
              <span className="text-[11px] text-slate-400 block uppercase">Batch Plans</span>
              <strong className="text-base text-slate-900 font-bold">
                {batch.batchPlans?.length || 0}
              </strong>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab('lifecycle')}
              icon={<Cpu className="w-3.5 h-3.5" />}
            >
              Manage Lifecycle
            </Button>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: Plans */}
      {activeTab === 'plans' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Included Chit Plans</h3>
              <p className="text-xs text-slate-500">
                A single batch can execute multiple plans concurrently (e.g. ₹50K, ₹1L, ₹2L)
              </p>
            </div>
            {batch.status !== 'COMPLETED' && batch.status !== 'CANCELLED' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsAddPlanModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Plan to Batch
              </Button>
            )}
          </div>

          {!batch.batchPlans || batch.batchPlans.length === 0 ? (
            <p className="text-xs text-slate-400 p-8 text-center border border-dashed rounded-md">
              No plans added to this batch yet. Click "Add Plan to Batch" to attach a plan template.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Template</TableHead>
                  <TableHead>Chit Value</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Enrollments / Seats</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.batchPlans.map((bp) => (
                  <TableRow key={bp.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {bp.planTemplate?.name ||
                            `Plan Template #${bp.planTemplateId.slice(0, 8)}`}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          BatchPlan ID: {bp.id.slice(0, 8)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 text-xs">
                      {Number(bp.planTemplate?.totalAmount)
                        ? formatINR(Number(bp.planTemplate.totalAmount))
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {bp.planTemplate?.installmentCount || 20} Installments
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {bp.enrolledSeats || 0} enrolled {bp.totalSeats ? `/ ${bp.totalSeats}` : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      {batch.status === 'PLANNED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPlanToRemove(bp)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* TAB 2: Installments (20 Months) */}
      {activeTab === 'installments' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                20-Installment Ledger Schedule
              </h3>
              <p className="text-xs text-slate-500">
                Tracking monthly collection progress & withdrawal eligibility
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline">Late Payments Remain Valid</Badge>
              <Badge variant="info">Calendar Month Passed ≠ Closed</Badge>
            </div>
          </div>

          <div className="rounded-md bg-amber-50/60 border border-amber-200 p-3 text-xs text-amber-900">
            <strong>Business Accounting Rule:</strong> A passed calendar month does not mark an
            installment closed. An installment is only closed when financially settled.
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Installment</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Target Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Calendar Status</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 20 }, (_, i) => {
                const instNum = i + 1;
                const isPassed = instNum < (batch.currentInstallment || 1);
                const isCurrent = instNum === (batch.currentInstallment || 1);

                return (
                  <TableRow key={instNum}>
                    <TableCell className="font-mono font-bold text-xs text-slate-900">
                      Installment #{instNum}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">Month {instNum}</TableCell>
                    <TableCell className="text-xs text-slate-700 font-medium">
                      Scheduled per plan
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={instNum <= (batch.currentInstallment || 1) ? 'info' : 'outline'}
                      >
                        {isCurrent ? 'CURRENT DUE' : isPassed ? 'CALENDAR PASSED' : 'FUTURE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {isPassed ? (
                        <span className="text-amber-700 font-medium">
                          Month Passed (Late valid)
                        </span>
                      ) : isCurrent ? (
                        <span className="text-sky-700 font-semibold">Active Cycle</span>
                      ) : (
                        'Upcoming'
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">Aggregated in Ledger</TableCell>
                    <TableCell className="text-right text-xs font-semibold text-slate-900">
                      Dynamic Ledger
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 3: Enrollments */}
      {activeTab === 'enrollments' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Batch Enrollments</h3>
              <p className="text-xs text-slate-500">Registered member seats in this batch</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate(`/enrollments/catch-up`)}
              >
                Late / Catch-up Enrollment
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onNavigate(`/enrollments/new`)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Enroll Member
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-500 p-6 text-center border border-dashed rounded-md">
            Click 'Enroll Member' to seat a member into one of this batch's plans, or 'Late /
            Catch-up Enrollment' if the batch is already running past installment #1.
          </p>
        </Card>
      )}

      {/* TAB 4: Lifecycle Operations */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-sm text-slate-900">Batch State Machine & Actions</h3>
            <p className="text-xs text-slate-500">
              Execute formal lifecycle state transitions on the NestJS backend
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Start Batch */}
              <div className="p-4 border rounded-md bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-sky-600" /> Start Batch
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Transitions status from PLANNED to RUNNING. Initializes installment #1.
                  </p>
                </div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={batch.status !== 'PLANNED'}
                    onClick={() => setLifecycleAction('start')}
                    className="w-full"
                  >
                    Start Batch
                  </Button>
                </div>
              </div>

              {/* Complete Batch */}
              <div className="p-4 border rounded-md bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Complete Batch
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Marks the batch COMPLETED after 20 installments and final dividend
                    distributions.
                  </p>
                </div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={batch.status !== 'RUNNING'}
                    onClick={() => setLifecycleAction('complete')}
                    className="w-full"
                  >
                    Complete Batch
                  </Button>
                </div>
              </div>

              {/* Cancel Batch */}
              <div className="p-4 border rounded-md bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" /> Cancel Batch
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Terminates the batch early. Requires administrative justification.
                  </p>
                </div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={batch.status === 'COMPLETED' || batch.status === 'CANCELLED'}
                    onClick={() => setLifecycleAction('cancel')}
                    className="w-full"
                  >
                    Cancel Batch
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Lifecycle monthly processor */}
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-sm text-slate-900">
              Monthly Lifecycle Rollover Processor
            </h3>
            <p className="text-xs text-slate-500">
              Advances batch current installment as of a target date and generates penalty/due
              snapshots without closing delinquent installments.
            </p>

            <div className="flex flex-col sm:flex-row items-end gap-3 pt-2">
              <div className="w-full sm:w-60">
                <Input
                  label="As Of Date"
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                />
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => setLifecycleAction('process-single')}
                icon={<Cpu className="w-4 h-4" />}
              >
                Process This Batch
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => setLifecycleAction('process-all')}
                icon={<Cpu className="w-4 h-4" />}
              >
                Process All Batches
              </Button>
            </div>

            {Boolean(lifecycleResult) && (
              <div className="mt-4 p-4 rounded-md bg-slate-900 text-white font-mono text-xs overflow-x-auto">
                <p className="font-semibold text-emerald-400 mb-1">
                  Backend Lifecycle Execution Response:
                </p>
                <pre>{JSON.stringify(lifecycleResult, null, 2)}</pre>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 5: Reports */}
      {activeTab === 'reports' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900">Batch Financial Summary</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate(`/reports/batches/${batch.id}`)}
            >
              Open Full Batch Report
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 border rounded bg-slate-50">
              <span className="text-slate-500">Batch Status</span>
              <p className="text-sm font-bold text-slate-900 mt-1">{batch.status}</p>
            </div>
            <div className="p-3 border rounded bg-slate-50">
              <span className="text-slate-500">Total Plans</span>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {batch.batchPlans?.length || 0}
              </p>
            </div>
            <div className="p-3 border rounded bg-slate-50">
              <span className="text-slate-500">Total Installments</span>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {batch.totalInstallments || 20}
              </p>
            </div>
            <div className="p-3 border rounded bg-slate-50">
              <span className="text-slate-500">Current Cycle</span>
              <p className="text-sm font-bold text-slate-900 mt-1">
                #{batch.currentInstallment || 0}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Add Plan Modal */}
      <Modal
        isOpen={isAddPlanModalOpen}
        onClose={() => setIsAddPlanModalOpen(false)}
        title="Add Plan Template to Batch"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Select a plan template to attach to this batch. Members can then be enrolled under this
            plan.
          </p>

          <Select
            label="Plan Template"
            value={selectedPlanTemplateId}
            onChange={(e) => setSelectedPlanTemplateId(e.target.value)}
          >
            <option value="">-- Select Plan Template --</option>
            {allPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatINR(Number(p.totalAmount))})
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsAddPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedPlanTemplateId}
              isLoading={addPlanMutation.isPending}
              onClick={() => addPlanMutation.mutate(selectedPlanTemplateId)}
            >
              Add Plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modals for Lifecycle */}
      <ConfirmationModal
        isOpen={lifecycleAction === 'start'}
        onClose={() => setLifecycleAction(null)}
        onConfirm={() => startMutation.mutate()}
        title="Start Batch"
        description="Are you sure you want to start this batch? This will mark the batch as RUNNING and open installment #1."
        confirmText="Start Batch"
        variant="primary"
        isLoading={startMutation.isPending}
      />

      <ConfirmationModal
        isOpen={lifecycleAction === 'complete'}
        onClose={() => setLifecycleAction(null)}
        onConfirm={() => completeMutation.mutate()}
        title="Complete Batch"
        description="Are you sure you want to mark this batch as COMPLETED? Verify that all installments and withdrawals have been settled."
        confirmText="Complete Batch"
        variant="primary"
        isLoading={completeMutation.isPending}
      />

      <ConfirmationModal
        isOpen={lifecycleAction === 'cancel'}
        onClose={() => setLifecycleAction(null)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel Batch"
        description="Are you sure you want to cancel this batch? This halts further installment processing."
        confirmText="Cancel Batch"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />

      <ConfirmationModal
        isOpen={lifecycleAction === 'process-single'}
        onClose={() => setLifecycleAction(null)}
        onConfirm={() => processLifecycleMutation.mutate(asOfDate)}
        title="Process Lifecycle Rollover"
        description={`Execute monthly lifecycle check and rollover for batch "${batch.name}" as of ${asOfDate}?`}
        confirmText="Process Batch"
        variant="primary"
        isLoading={processLifecycleMutation.isPending}
      />

      <ConfirmationModal
        isOpen={lifecycleAction === 'process-all'}
        onClose={() => setLifecycleAction(null)}
        onConfirm={() => processAllMutation.mutate(asOfDate)}
        title="Process All Running Batches"
        description={`Advance lifecycle checks across ALL running batches as of ${asOfDate}?`}
        confirmText="Process All"
        variant="primary"
        isLoading={processAllMutation.isPending}
      />

      <ConfirmationModal
        isOpen={!!planToRemove}
        onClose={() => setPlanToRemove(null)}
        onConfirm={() => {
          if (planToRemove) removePlanMutation.mutate(planToRemove.planTemplateId);
        }}
        title="Remove Plan from Batch"
        description="Are you sure you want to remove this plan template from the batch? This is only permitted prior to batch start."
        confirmText="Remove Plan"
        variant="danger"
        isLoading={removePlanMutation.isPending}
      />
    </div>
  );
};
