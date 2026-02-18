export interface Product {
  _id: string;
  userId: string;
  name: string;
  category: string;
  purchaseDate: Date;
  warrantyPeriod: number;
  warrantyExpiry: Date;
  price?: number;
  retailer?: string;
  invoiceUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  name: string;
  category: string;
  purchaseDate: string;
  warrantyPeriod: string;
  price?: string;
  retailer?: string;
  notes?: string;
}

export interface ProductStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}
