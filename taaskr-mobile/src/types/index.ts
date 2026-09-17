// Taaskr Mobile API & Entity Type Definitions (Mapped 1:1 to Spring Boot Backend DTOs)

export type Role = 'USER' | 'PROVIDER' | 'SERVICE_PARTNER' | 'ADMIN';

export type BookingStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PARTNER_ASSIGNED'
  | 'PARTNER_ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'WORK_STARTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'IN_TRANSIT'
  | 'WORK_COMPLETED'
  | 'PAYMENT_COMPLETED'
  | 'PROVIDER_APPROVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'ONLINE' | 'CASH' | 'UPI' | 'AFTER_SERVICE';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  city?: string;
  pincode?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  approved?: boolean;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  city?: string;
  pincode?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  approved?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  active?: boolean;
}

export interface ServiceItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  durationMinutes?: number;
  imageUrl?: string;
  categoryId: number;
  categoryName?: string;
  active?: boolean;
}

export interface ProviderProfile {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  city?: string;
  pincode?: string;
  bio?: string;
  experienceYears?: number;
  rating?: number;
  approved?: boolean;
  online?: boolean;
  categories?: Category[];
}

export interface ServicePartner {
  id: number;
  providerId: number;
  providerName?: string;
  userId: number;
  name: string;
  phone: string;
  email?: string;
  title?: string;
  experience?: string;
  rating?: number;
  active: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  locationUpdatedAt?: string;
  createdAt?: string;
}

export interface Booking {
  id: number;
  bookingCode: string;
  serviceId: number;
  serviceName: string;
  categoryId?: number;
  categoryName?: string;
  userId: number;
  userName: string;
  providerId?: number;
  providerName?: string;
  assigned?: boolean;
  bookingDate: string;
  startTime: string;
  endTime: string;
  address: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  dropAddress?: string;
  dropCity?: string;
  dropPincode?: string;
  status: BookingStatus;
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  rating?: number;
  review?: string;
  servicePartnerId?: number;
  servicePartnerName?: string;
  servicePartnerPhone?: string;
  servicePartnerTitle?: string;
  servicePartnerRating?: number;
  partnerAssignedAt?: string;
  partnerAcceptedAt?: string;
  journeyStartedAt?: string;
  arrivedAt?: string;
  workStartedAt?: string;
  workCompletedAt?: string;
  paymentCompletedAt?: string;
  providerApprovedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LiveLocationTelemetry {
  bookingId: number;
  status: BookingStatus;
  partnerLatitude?: number;
  partnerLongitude?: number;
  distanceKm?: number;
  estimatedEtaMinutes?: number;
  isLive?: boolean;
  message?: string;
  timestamp: string;
}

export interface Address {
  id: number;
  userId: number;
  label?: string;
  addressLine: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  relatedBookingId?: number;
  createdAt?: string;
}

export interface Review {
  id: number;
  bookingId?: number;
  serviceId?: number;
  serviceName?: string;
  userId: number;
  userName: string;
  providerId?: number;
  providerName?: string;
  rating: number;
  review?: string;
  reviewText?: string;
  providerReply?: string;
  createdAt?: string;
}

export interface Dispute {
  id: number;
  bookingId: number;
  bookingCode?: string;
  userId: number;
  userName?: string;
  providerId?: number;
  providerName?: string;
  reason: string;
  description?: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  resolution?: string;
  refundAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payout {
  id: number;
  providerId: number;
  providerName?: string;
  amount: number;
  upiId?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  status: 'PENDING' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  transactionReference?: string;
  adminNotes?: string;
  requestedAt?: string;
  processedAt?: string;
}

export interface WalletOverview {
  providerId: number;
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  availableBalance: number;
  recentPayouts?: Payout[];
}

export interface KycDocument {
  id: number;
  providerId: number;
  providerName?: string;
  documentType: string;
  documentNumber?: string;
  fileUrl?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt?: string;
  verifiedAt?: string;
}

export interface Vehicle {
  id: number;
  userId: number;
  ownerName?: string;
  vehicleType: string;
  registrationNumber: string;
  model?: string;
  capacityKg?: number;
  isAvailable: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface VehicleEstimate {
  vehicleType: string;
  distanceKm: number;
  estimatedPrice: number;
  estimatedDurationMinutes?: number;
}

export interface PricingRule {
  id: number;
  vehicleType: string;
  basePrice: number;
  pricePerKm: number;
  minimumPrice: number;
}

export interface ProviderAvailability {
  id: number;
  providerId: number;
  availableDate: string;
  startTime: string;
  endTime: string;
}

export interface ProviderBankDetails {
  id?: number;
  providerId: number;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
}

export interface ProviderDiscussion {
  id: number;
  providerId: number;
  providerName?: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminReply?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAnalytics {
  totalUsers?: number;
  totalProviders?: number;
  totalBookings?: number;
  totalRevenue?: number;
  activeBookings?: number;
  completedBookings?: number;
  revenueByDay?: Record<string, number>;
  bookingsByStatus?: Record<string, number>;
}

export interface Favorite {
  id: number;
  userId: number;
  serviceId: number;
  service?: ServiceItem;
  createdAt?: string;
}

export interface OtpResponse {
  message: string;
  status?: string;
}

