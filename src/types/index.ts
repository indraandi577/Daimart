// ============================================================
// TYPES & INTERFACES - DaiMart Supermarket App
// ============================================================

export type UserRole = "owner" | "kasir" | "gudang";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

// ─── PRODUK ─────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  category_id: string;
  category?: Category;
  price_sell: number;       // Harga jual
  price_buy: number;        // Harga beli / HPP
  stock: number;
  stock_minimum: number;    // Stok minimum sebelum alert
  unit: string;             // pcs, kg, dus, dll
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type StockStatus = "normal" | "low" | "empty";

export function getStockStatus(product: Product): StockStatus {
  if (product.stock <= 0) return "empty";
  if (product.stock <= product.stock_minimum) return "low";
  return "normal";
}

// ─── TRANSAKSI / POS ────────────────────────────────────────

export interface CartItem {
  product: Product;
  qty: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  transaction_code: string;
  kasir_id: string;
  kasir?: User;
  items: TransactionItem[];
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_method: "cash" | "qris" | "debit";
  status: "completed" | "cancelled";
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product?: Product;
  product_name: string;    // snapshot nama saat transaksi
  price_sell: number;      // snapshot harga saat transaksi
  qty: number;
  subtotal: number;
}

// ─── DASHBOARD ──────────────────────────────────────────────

export interface DashboardStats {
  total_omset: number;
  total_laba: number;
  total_transaksi: number;
  total_produk_terjual: number;
}

export interface SalesChartData {
  date: string;
  omset: number;
  transaksi: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_qty: number;
  total_omset: number;
}
