export type DeviceStatus = "in_stock" | "sold" | "in_repair" | "swapped" | "retired";
export type ClaimType = "swap_48h" | "standard_repair";
export type ClaimStatus = "claimed" | "under_review" | "swap_approved" | "repaired" | "rejected";
export type RepairStatus = "assigned" | "in_progress" | "completed";

export interface DeviceBrand {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Device {
  id: string;
  serial_number: string;
  brand_id: string;
  model: string;
  status: DeviceStatus;
  store_id: string | null;
  qr_hash: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarrantyClaim {
  id: string;
  device_id: string;
  store_id: string | null;
  claimant_name: string | null;
  claimant_phone: string | null;
  claim_type: ClaimType;
  status: ClaimStatus;
  issue_description: string | null;
  media_urls: string[];
  technician_id: string | null;
  technician_notes: string | null;
  admin_notes: string | null;
  replacement_device_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SparePart {
  id: string;
  name: string;
  model_compatibility: string | null;
  stock_quantity: number;
  unit_price: number;
  supplier_ref: string | null;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface RepairOrder {
  id: string;
  claim_id: string;
  technician_id: string | null;
  parts_used: string[];
  repair_status: RepairStatus;
  created_at: string;
  completed_at: string | null;
}

export const claimStatusConfig: Record<ClaimStatus, { label: string; color: string }> = {
  claimed: { label: "Déclarée", color: "bg-blue-600" },
  under_review: { label: "En cours d'analyse", color: "bg-purple-600" },
  swap_approved: { label: "Échange approuvé", color: "bg-green-600" },
  repaired: { label: "Réparé", color: "bg-green-700" },
  rejected: { label: "Refusée", color: "bg-destructive" },
};

export const deviceStatusConfig: Record<DeviceStatus, { label: string; color: string }> = {
  in_stock: { label: "En stock", color: "bg-blue-600" },
  sold: { label: "Vendu", color: "bg-green-600" },
  in_repair: { label: "En réparation", color: "bg-orange-500" },
  swapped: { label: "Échangé", color: "bg-purple-600" },
  retired: { label: "Retiré", color: "bg-muted" },
};

export const claimTypeConfig: Record<ClaimType, { label: string; color: string }> = {
  swap_48h: { label: "Échange 48H", color: "bg-red-600" },
  standard_repair: { label: "Réparation standard", color: "bg-amber-600" },
};
