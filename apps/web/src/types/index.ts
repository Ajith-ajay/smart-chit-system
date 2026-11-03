// ==========================================
// SCMS TYPE DEFINITIONS
// ==========================================

export type Role = 'ADMIN' | 'MANAGER' | 'STAFF' | 'USER';

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

// ------------------------------------------
// Member Types
// ------------------------------------------

export interface Member {
  id: string;
  memberCode?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  nomineeName?: string | null;
  nomineeRelation?: string | null;
  nomineePhone?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  branchName?: string | null;
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  kycType?: string | null;
  kycNumber?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  enrollmentsCount?: number;
}

export interface CreateMemberDto {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  nomineePhone?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  kycType?: string;
  kycNumber?: string;
}

export type UpdateMemberDto = Partial<CreateMemberDto> & { isActive?: boolean };

// ------------------------------------------
// Plan Types
// ------------------------------------------

export interface PlanTemplate {
  id: string;
  name: string;
  totalAmount: string | number;
  installmentCount: number;
  isActive: boolean;
  schedules: PlanScheduleItem[];
}

export interface PlanScheduleItem {
  installmentNumber: number;
  installmentAmount: string | number;
  withdrawalAmount: string | number;
}

// ------------------------------------------
// Batch Types
// ------------------------------------------

export type BatchStatus = 'PLANNED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';

export interface Batch {
  id: string;
  name: string;
  code?: string;
  startDate: string;
  endDate?: string | null;
  status: BatchStatus;
  currentInstallment: number;
  totalInstallments: number;
  notes?: string | null;
  batchPlans?: BatchPlan[];
  enrollmentsCount?: number;
  totalCollected?: number;
  totalWithdrawn?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BatchPlan {
  id: string;
  batchId: string;
  planTemplateId: string;
  planTemplate?: PlanTemplate;
  totalSeats?: number;
  enrolledSeats?: number;
  installments?: BatchInstallment[];
}

export type InstallmentStatus = 'PENDING' | 'DUE' | 'PARTIALLY_COLLECTED' | 'COLLECTED' | 'OVERDUE';

export interface BatchInstallment {
  id: string;
  batchPlanId: string;
  installmentNumber: number;
  dueDate: string;
  scheduledAmount: number;
  withdrawalDate?: string | null;
  status: InstallmentStatus;
  collectedAmount: number;
  outstandingAmount: number;
  isCalendarMonthPassed?: boolean;
}

export interface CreateBatchDto {
  name: string;
  startDate: string;
  notes?: string;
  planTemplateIds?: string[];
}

export interface UpdateBatchDto {
  name?: string;
  startDate?: string;
  notes?: string;
  status?: BatchStatus;
}

export interface AddBatchPlanDto {
  planTemplateId: string;
  totalSeats?: number;
}

export interface LifecycleProcessDto {
  asOfDate?: string;
}

export interface LifecycleResult {
  message: string;
  batchId?: string;
  currentInstallment?: number;
  processedCount?: number;
  timestamp?: string;
  details?: Record<string, unknown>;
}

// ------------------------------------------
// Enrollment Types
// ------------------------------------------

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED';

export interface Enrollment {
  id: string;
  enrollmentNumber?: string;
  memberId: string;
  member?: Member;
  batchId: string;
  batch?: Batch;
  batchPlanId: string;
  batchPlan?: BatchPlan;
  startInstallment: number;
  status: EnrollmentStatus;
  scheduledAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  advanceAmount?: number;
  withdrawalEligibility?: {
    isEligible: boolean;
    reason?: string;
    maxEligibleAmount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentDto {
  memberId: string;
  batchId: string;
  batchPlanId: string;
  startInstallment?: number;
}

export interface CatchUpPreview {
  memberId: string;
  batchId: string;
  batchPlanId: string;
  currentInstallment: number;
  missedInstallments: number[];
  totalCatchUpAmount: number;
  breakdown: Array<{
    installmentNumber: number;
    scheduledAmount: number;
    dueDate: string;
  }>;
}

export interface CatchUpDto {
  batchId: string;
  batchPlanId: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
}

// ------------------------------------------
// Payment Types
// ------------------------------------------

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE';
export type PaymentStatus = 'SUCCESS' | 'REVERSED' | 'PENDING' | 'FAILED';
export type AllocationMode = 'AUTOMATIC' | 'MANUAL';

export interface PaymentAllocationItem {
  installmentNumber: number;
  amount: number;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  batchInstallmentId?: string;
  installmentNumber: number;
  allocatedAmount: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  receiptNumber?: string;
  enrollmentId: string;
  enrollment?: Enrollment;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  allocationMode: AllocationMode;
  status: PaymentStatus;
  allocations?: PaymentAllocation[];
  receipt?: Receipt;
  reversedAt?: string | null;
  reverseReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  allocationMode: AllocationMode;
  allocations?: PaymentAllocationItem[];
}

export interface ReversePaymentDto {
  reason?: string;
}

export interface PaymentSummary {
  enrollmentId: string;
  totalScheduled: number;
  totalPaid: number;
  totalOutstanding: number;
  advanceAmount: number;
  completedInstallments: number;
  partiallyPaidInstallments: number;
  pendingInstallments: number;
  installments: Array<{
    installmentNumber: number;
    dueDate: string;
    scheduledAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  }>;
}

// ------------------------------------------
// Receipt Types
// ------------------------------------------

export type ReceiptStatus = 'GENERATED' | 'CANCELLED' | 'REISSUED';

export interface Receipt {
  id: string;
  receiptNumber: string;
  paymentId: string;
  payment?: Payment;
  enrollmentId: string;
  enrollment?: Enrollment;
  memberId?: string;
  member?: Member;
  amount: number;
  issuedAt: string;
  status: ReceiptStatus;
  notes?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  reissuedAt?: string | null;
  reissuedReceiptId?: string | null;
  createdAt: string;
}

// ------------------------------------------
// Withdrawal Types
// ------------------------------------------

export type WithdrawalStatus =
  'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PARTIALLY_PAID' | 'FULLY_PAID';

export interface WithdrawalEligibility {
  isEligible: boolean;
  enrollmentId: string;
  currentInstallment?: number;
  paidInstallments?: number;
  eligibleMonth?: number;
  maxEligibleAmount: number;
  reason?: string;
  unpaidDues?: number;
}

export interface WithdrawalPayout {
  id: string;
  withdrawalId: string;
  amount: number;
  payoutDate: string;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  status: 'SUCCESS' | 'REVERSED';
  notes?: string | null;
  reversedAt?: string | null;
  reverseReason?: string | null;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  enrollmentId: string;
  enrollment?: Enrollment;
  installmentNumber?: number;
  requestedAmount: number;
  approvedAmount?: number | null;
  totalPaidAmount: number;
  remainingAmount: number;
  status: WithdrawalStatus;
  requestDate: string;
  approvedDate?: string | null;
  rejectedDate?: string | null;
  rejectReason?: string | null;
  notes?: string | null;
  payouts?: WithdrawalPayout[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWithdrawalDto {
  requestedAmount: number;
  installmentNumber?: number;
  notes?: string;
}

export interface ApproveWithdrawalDto {
  approvedAmount?: number;
  notes?: string;
}

export interface RejectWithdrawalDto {
  reason: string;
}

export interface CreatePayoutDto {
  amount: number;
  payoutDate?: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface ReversePayoutDto {
  reason?: string;
}

// ------------------------------------------
// Document & KYC Types
// ------------------------------------------

export type KycDocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface KycDocument {
  id: string;
  enrollmentId?: string | null;
  memberId?: string | null;
  documentType: string;
  documentNumber?: string | null;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  fileUrl?: string;
  status: KycDocumentStatus;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  rejectedAt?: string | null;
  rejectReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentDto {
  documentType: string;
  documentNumber?: string;
  file: File;
}

// ------------------------------------------
// Reminder & Follow-up Types
// ------------------------------------------

export type ReminderChannel = 'WHATSAPP' | 'SMS' | 'CALL' | 'EMAIL';
export type ReminderStatus = 'SCHEDULED' | 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';

export interface Reminder {
  id: string;
  enrollmentId: string;
  enrollment?: Enrollment;
  memberId?: string;
  member?: Member;
  installmentNumber?: number;
  dueDate?: string;
  channel: ReminderChannel;
  message: string;
  scheduledDate: string;
  status: ReminderStatus;
  sentAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
}

export interface CreateReminderDto {
  installmentNumber?: number;
  channel?: ReminderChannel;
  message: string;
  scheduledDate: string;
}

export interface DispatchDueResult {
  message?: string;
  totalProcessed: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  errors?: string[];
}

export type FollowUpChannel = 'CALL' | 'WHATSAPP' | 'SMS' | 'IN_PERSON';
export type FollowUpStatus =
  'CONTACTED' | 'NO_ANSWER' | 'BUSY' | 'PROMISED_TO_PAY' | 'WRONG_NUMBER' | 'COMPLETED';

export interface FollowUp {
  id: string;
  enrollmentId: string;
  enrollment?: Enrollment;
  memberId?: string;
  member?: Member;
  followUpDate: string;
  channel: FollowUpChannel;
  status: FollowUpStatus;
  notes?: string | null;
  nextFollowUpDate?: string | null;
  isCompleted: boolean;
  completedAt?: string | null;
  completedNotes?: string | null;
  createdAt: string;
}

export interface CreateFollowUpDto {
  followUpDate?: string;
  channel: FollowUpChannel;
  status: FollowUpStatus;
  notes?: string;
  nextFollowUpDate?: string;
}

// ------------------------------------------
// Report Types
// ------------------------------------------

export interface DashboardMetrics {
  activeMembers: number;
  activeEnrollments: number;
  runningBatches: number;
  completedBatches: number;
  totalCollections: number;
  totalWithdrawals: number;
  totalPayouts: number;
  pendingWithdrawals: number;
  collectionTrend?: Array<{
    period: string;
    amount: number;
  }>;
  withdrawalTrend?: Array<{
    period: string;
    amount: number;
  }>;
  batchProgress?: Array<{
    batchName: string;
    currentInstallment: number;
    totalInstallments: number;
    collectionRate: number;
  }>;
  planWiseCollection?: Array<{
    planName: string;
    collected: number;
    target: number;
  }>;
  recentPayments?: Payment[];
  recentWithdrawals?: Withdrawal[];
  recentEnrollments?: Enrollment[];
  recentReminders?: Reminder[];
}

export interface BatchReport {
  batch: Batch;
  totalPlans: number;
  totalSeats: number;
  enrolledSeats: number;
  totalExpectedCollection: number;
  totalActualCollection: number;
  collectionPercentage: number;
  totalWithdrawalApproved: number;
  totalPayoutsDistributed: number;
  plans: Array<{
    planName: string;
    chitValue: number;
    enrollmentCount: number;
    collected: number;
    outstanding: number;
  }>;
  installmentsProgress: Array<{
    installmentNumber: number;
    dueDate: string;
    expected: number;
    collected: number;
    outstanding: number;
  }>;
}

export interface EnrollmentReport {
  enrollment: Enrollment;
  member: Member;
  batch: Batch;
  plan: PlanTemplate;
  totalScheduled: number;
  totalPaid: number;
  totalOutstanding: number;
  ledger: Array<{
    installmentNumber: number;
    scheduledAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
    payments: Array<{
      id: string;
      date: string;
      amount: number;
      method: string;
      receiptNumber?: string;
    }>;
  }>;
  withdrawals: Withdrawal[];
}

export interface CollectionReportItem {
  id: string;
  paymentDate: string;
  receiptNumber?: string;
  memberName: string;
  memberPhone?: string;
  batchName: string;
  planName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  status: PaymentStatus;
}

export interface WithdrawalReportItem {
  id: string;
  requestDate: string;
  memberName: string;
  batchName: string;
  planName: string;
  requestedAmount: number;
  approvedAmount?: number | null;
  paidAmount: number;
  remainingAmount: number;
  status: WithdrawalStatus;
}
