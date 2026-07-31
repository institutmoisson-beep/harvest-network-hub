export type DeliveryStatus =
  | "assigned"
  | "en_route"
  | "arrived"
  | "payment_claimed"
  | "payment_approved"
  | "payment_rejected"
  | "delivered"
  | "cancelled";

export type PaymentMethod = string;

export interface PaymentDestination {
  id: string;
  method: PaymentMethod;
  label: string;
  value: string;
  is_active: boolean;
  display_order: number;
}

export interface Delivery {
  id: string;
  order_type: "pack" | "commerce" | "custom";
  order_id: string;
  client_id: string;
  courier_id: string | null;
  assigned_by: string | null;
  product_name: string;
  amount: number;
  currency: string;
  client_name: string;
  client_phone: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_country: string | null;
  qr_token: string;
  status: DeliveryStatus;
  payment_method: PaymentMethod | null;
  payment_claimed_at: string | null;
  payment_reviewed_at: string | null;
  payment_reviewed_by: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export const deliveryStatusConfig: Record<DeliveryStatus, { label: string; color: string }> = {
  assigned: { label: "Assignée", color: "bg-blue-600" },
  en_route: { label: "Livreur en route", color: "bg-purple-600" },
  arrived: { label: "Livreur arrivé", color: "bg-orange-500" },
  payment_claimed: { label: "Paiement déclaré", color: "bg-yellow-600" },
  payment_approved: { label: "Paiement validé", color: "bg-green-600" },
  payment_rejected: { label: "Paiement refusé", color: "bg-destructive" },
  delivered: { label: "Livré", color: "bg-green-700" },
  cancelled: { label: "Annulée", color: "bg-muted" },
};

/** Visual accent per known method id; unrecognised (custom, admin-added) methods fall back to the brand gradient. */
export const paymentMethodColors: Record<string, string> = {
  orange_money: "bg-orange-500 hover:bg-orange-600",
  wave: "bg-sky-500 hover:bg-sky-600",
  moov_money: "bg-blue-700 hover:bg-blue-800",
  crypto: "bg-amber-600 hover:bg-amber-700",
};
export const defaultPaymentColor = "bg-gradient-purple hover:opacity-90";

/** Builds the deep-link / URL to open for a given payment destination + delivery amount. */
export function buildPaymentLink(destination: PaymentDestination, amount: number): string {
  const rounded = Math.round(amount);
  switch (destination.method) {
    case "wave":
      return `${destination.value}?amount=${rounded}`;
    case "orange_money":
      return `tel:*144*1*${encodeURIComponent(destination.value.replace(/\s/g, ""))}*${rounded}%23`;
    case "moov_money":
      return `tel:*555*1*${encodeURIComponent(destination.value.replace(/\s/g, ""))}*${rounded}%23`;
    case "crypto":
      return "#crypto";
    default:
      return destination.value;
  }
}
