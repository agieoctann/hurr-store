export const API = (import.meta.env.VITE_API_URL as string) || 'https://hurr-store-production.up.railway.app/api';
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || 'https://hurr-store-production.up.railway.app';



export type AdminView = 'dashboard' | 'products' | 'orders' | 'finance' | 'users' | 'chat';
export type UserView = 'catalog' | 'orders' | 'history' | 'profile' | 'chat';


export interface AuthUser { id: string; email: string; role: string; name?: string; phone?: string; }

export interface Product {
  id: string; name: string; description?: string;
  category?: string; imageUrl?: string;
  brand?: string; material?: string; color?: string; weight?: string;
  sizes?: string[];         // Parsed from JSON by backend
  stockPerSize?: Record<string,string>; // Parsed from JSON by backend
  costPrice: number; sellingPrice: number;
  stock: number; minStock: number;
  discount?: number;
}


export interface CartItem { product: Product; qty: number; }

export interface OrderItem { qty: number; priceAtBuy: number; product: { name: string }; }

export interface Order {
  id: string; finalTotalAmount: number;
  paymentStatus: string; paymentMethod: string;
  deliveryStatus?: string;
  createdAt: string; orderItems: OrderItem[];
}

export interface FinanceReport {
  revenue: number; expenses: number;
  grossProfit: number; operationalExpenses: number; netProfit: number;
}

export interface LedgerEntry {
  id: string; transactionDate: string; type: string;
  category: string; amount: number; description?: string;
}

export interface AppUser {
  id: string; email: string; role: string; createdAt: string;
}

// helpers
export const fmt = (n: number | string) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n));

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

export const statusClass = (s: string) =>
  s === 'COMPLETED' ? 'badge-green' : s === 'FAILED' ? 'badge-danger' : 'badge-warning';

export const statusLabel = (s: string) =>
  s === 'COMPLETED' ? '✅ Selesai' : s === 'FAILED' ? '❌ Gagal' : '⏳ Pending';
