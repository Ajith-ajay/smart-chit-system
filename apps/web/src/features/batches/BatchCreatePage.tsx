import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { batchesApi } from '@/lib/api/batches';
import { plansApi } from '@/lib/api/plans';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { formatINR, toInputDate } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { CreateBatchDto, PlanTemplate } from '@/types';
import { ArrowLeft, CalendarPlus, CheckSquare, Square } from 'lucide-react';

export interface BatchCreatePageProps {
  onNavigate: (path: string) => void;
}

export const BatchCreatePage: React.FC<BatchCreatePageProps> = ({ onNavigate }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(toInputDate(new Date()));
  const [notes, setNotes] = useState('');
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch available plan templates
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getAll(),
  });

  const mutation = useMutation({
    mutationFn: (dto: CreateBatchDto) => batchesApi.create(dto),
    onSuccess: (newBatch) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      onNavigate(`/batches/${newBatch.id}`);
    },
    onError: (err) => {
      setErrorMsg(extractErrorMessage(err));
    },
  });

  const togglePlan = (id: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Batch name is required.');
      return;
    }
    if (!startDate) {
      setErrorMsg('Start date is required.');
      return;
    }

    mutation.mutate({
      name: name.trim(),
      startDate,
      notes: notes.trim() || undefined,
      planTemplateIds: selectedPlanIds.length > 0 ? selectedPlanIds : undefined,
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('/batches')}
        icon={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Batches
      </Button>

      <PageHeader
        title="Create Chit Batch"
        description="Initialize a new 20-month batch lifecycle and associate plan templates"
      />

      {errorMsg && (
        <Alert variant="error" title="Creation Failed">
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-5 space-y-4">
          <Input
            label="Batch Name"
            placeholder="e.g. Batch 2026-Alpha (₹1 Lakh & ₹50K Groups)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            helperText="The start date anchors installment 1 and subsequent monthly collection cycles."
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide">
              Operational Notes (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="e.g. Registered with registrar of chits. Monthly collection cutoff on 10th."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </Card>

        {/* Plan templates selection */}
        <Card className="p-5">
          <div className="mb-3">
            <h3 className="font-semibold text-sm text-slate-900">Include Plans in this Batch</h3>
            <p className="text-xs text-slate-500">
              Select which chit plan schemes will run inside this batch (can also be modified later)
            </p>
          </div>

          {plans.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">No plan templates available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plans.map((p: PlanTemplate) => {
                const isSelected = selectedPlanIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePlan(p.id)}
                    className={`p-3 rounded-md border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 font-medium'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-slate-500 font-mono">{formatINR(Number(p.totalAmount))}</p>
                    </div>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-slate-900" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate('/batches')}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
            loadingText="Creating Batch in Database..."
            icon={<CalendarPlus className="w-4 h-4" />}
          >
            Create Batch
          </Button>
        </div>
      </form>
    </div>
  );
};
