export type UserRole = 'store_owner' | 'customer' | 'ngo' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
}

export type ProductStatus = 'available' | 'discounted' | 'donated' | 'expired' | 'sold';

export interface Product {
  id: string;
  name: string;
  originalPrice: number;
  discountedPrice?: number;
  discountPercentage?: number;
  expiryDate: string; // ISO string YYYY-MM-DD
  quantity: number;
  ownerId: string;
  ownerName?: string;
  status: ProductStatus;
  category: string;
  description?: string;
  imageUrl?: string;
  createdAt: number;
}

export interface Donation {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  ngoId?: string;
  status: 'pending' | 'claimed' | 'completed';
  claimedAt?: number;
  completedAt?: number;
}

export interface Order {
  id: string;
  productId: string;
  customerId: string;
  storeId: string;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'completed';
  createdAt: number;
}