import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/lib/api/members';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { extractErrorMessage } from '@/lib/api/client';
import { CreateMemberDto } from '@/types';
import { ArrowLeft, UserPlus, Shield, Landmark, UserCheck } from 'lucide-react';

export interface MemberCreatePageProps {
  onNavigate: (path: string) => void;
}

export const MemberCreatePage: React.FC<MemberCreatePageProps> = ({ onNavigate }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateMemberDto>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',

    nomineeDetails: {
      name: '',
      relation: '',
      phone: '',
    },

    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
      kycType: '',
      kycNumber: '',
    },

    remarks: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (dto: CreateMemberDto) => membersApi.create(dto),
    onSuccess: (newMember) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      onNavigate(`/members/${newMember.id}`);
    },
    onError: (err) => {
      setFormError(extractErrorMessage(err));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('nomineeDetails.')) {
      const field = name.split('.')[1] as keyof NonNullable<CreateMemberDto['nomineeDetails']>;

      setFormData((prev) => ({
        ...prev,
        nomineeDetails: {
          ...prev.nomineeDetails,
          [field]: value,
        },
      }));

      return;
    }

    if (name.startsWith('bankDetails.')) {
      const field = name.split('.')[1] as keyof NonNullable<CreateMemberDto['bankDetails']>;

      setFormData((prev) => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [field]: value,
        },
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      setFormError('First Name, Last Name, and Phone Number are required.');
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/members')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Members
        </Button>
      </div>

      <PageHeader
        title="Add New Member"
        description="Register a new chit fund customer with full profile, nominee, and banking records"
      />

      {formError && (
        <Alert variant="error" title="Validation Failed">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <Card className="p-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 text-slate-800">
            <UserCheck className="w-4 h-4 text-slate-700" />
            <h3 className="font-semibold text-sm">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              placeholder="e.g. Ramesh"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              placeholder="e.g. Kumar"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={handleChange}
              helperText="10-digit mobile number for WhatsApp & notifications"
              required
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="e.g. ramesh@example.com"
              value={formData.email || ''}
              onChange={handleChange}
            />
            <div className="sm:col-span-2">
              <Input
                label="Street Address"
                name="address"
                placeholder="e.g. #42, 2nd Main, Gandhi Nagar"
                value={formData.address || ''}
                onChange={handleChange}
              />
            </div>
            <Input
              label="City"
              name="city"
              placeholder="e.g. Bengaluru"
              value={formData.city || ''}
              onChange={handleChange}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="State"
                name="state"
                placeholder="e.g. Karnataka"
                value={formData.state || ''}
                onChange={handleChange}
              />
              <Input
                label="Pincode"
                name="pincode"
                placeholder="e.g. 560001"
                value={formData.pincode || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </Card>

        {/* Nominee Details */}
        <Card className="p-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 text-slate-800">
            <Shield className="w-4 h-4 text-slate-700" />
            <h3 className="font-semibold text-sm">Nominee Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Nominee Name"
              name="nomineeDetails.name"
              placeholder="Ajith"
              value={formData.nomineeDetails?.name || ''}
              onChange={handleChange}
            />

            <Input
              label="Relationship"
              name="nomineeDetails.relation"
              placeholder="Brother/Sister/Gaurdian"
              value={formData.nomineeDetails?.relation || ''}
              onChange={handleChange}
            />

            <Input
              label="Nominee Phone"
              name="nomineeDetails.phone"
              placeholder="+919047251565"
              value={formData.nomineeDetails?.phone || ''}
              onChange={handleChange}
            />
          </div>
        </Card>

        {/* Bank & KYC Details */}
        <Card className="p-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 text-slate-800">
            <Landmark className="w-4 h-4 text-slate-700" />
            <h3 className="font-semibold text-sm">Banking & KYC Records</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bank Name"
              name="bankDetails.bankName"
              placeholder="e.g. State Bank of India"
              value={formData.bankDetails?.bankName || ''}
              onChange={handleChange}
            />
            <Input
              label="Account Number"
              name="bankDetails.accountNumber"
              placeholder="e.g. 10023456789"
              value={formData.bankDetails?.accountNumber || ''}
              onChange={handleChange}
            />
            <Input
              label="IFSC Code"
              name="bankDetails.ifscCode"
              placeholder="e.g. SBIN0001234"
              value={formData.bankDetails?.ifscCode || ''}
              onChange={handleChange}
            />
            <Input
              label="Branch Name"
              name="bankDetails.branchName"
              placeholder="e.g. MG Road Branch"
              value={formData.bankDetails?.branchName || ''}
              onChange={handleChange}
            />
            <Select
              label="KYC Document Type"
              name="bankDetails.kycType"
              value={formData.bankDetails?.kycType || ''}
              onChange={handleChange}
              options={[
                { label: 'Select KYC Type', value: '' },
                { label: 'Aadhaar Card', value: 'AADHAAR' },
                { label: 'PAN Card', value: 'PAN' },
                { label: 'Passport', value: 'PASSPORT' },
                { label: 'Voter ID', value: 'VOTER_ID' },
                { label: 'Driving License', value: 'DRIVING_LICENSE' },
              ]}
            />
            <Input
              label="KYC Document Number"
              name="bankDetails.kycNumber"
              placeholder="e.g. 1234 5678 9012"
              value={formData.bankDetails?.kycNumber || ''}
              onChange={handleChange}
            />
          </div>
        </Card>

        <Card>
          <Input
            label="Remark (optional)"
            name="remarks"
            placeholder="Add any remarks here..."
            value={formData?.remarks || ''}
            onChange={handleChange}
          />
        </Card>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate('/members')}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
            loadingText="Creating Member in Database..."
            icon={<UserPlus className="w-4 h-4" />}
          >
            Save Member Profile
          </Button>
        </div>
      </form>
    </div>
  );
};
