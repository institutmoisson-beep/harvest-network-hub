export type DeliveryStatus =
  | "assigned"
  | "en_route"
  | "arrived"
  | "payment_claimed"
  | "payment_approved"
  | "payment_rejected"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "orange_money" | "wave" | "moov_money" | "crypto";

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

export const paymentMethods: { id: PaymentMethod; label: string; color: string }[] = [
  { id: "orange_money", label: "Orange Money", color: "bg-orange-500 hover:bg-orange-600" },
  { id: "wave", label: "Wave", color: "bg-sky-500 hover:bg-sky-600" },
  { id: "moov_money", label: "Moov Money", color: "bg-blue-700 hover:bg-blue-800" },
  { id: "crypto", label: "Crypto (USDT)", color: "bg-amber-600 hover:bg-amber-700" },
];

/**
 * Merchant / receiving details per payment channel. In production these
 * should come from admin-configurable settings; centralised here so they're
 * easy to update in one place once real merchant accounts are available.
 */
export const paymentDestinations: Record<PaymentMethod, { label: string; value: string }> = {
  orange_money: { label: "Numéro Orange Money", value: "+225 07 00 00 00 00" },
  moov_money: { label: "Numéro Moov Money", value: "+225 01 00 00 00 00" },
  wave: { label: "Lien de paiement Wave", value: "https://pay.wave.com/m/M_ci_INSTITUT_MOISSON/c/ci/" },
  crypto: { label: "Adresse USDT (TRC20)", value: "TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" },
};

/** Builds the deep-link / URL to open for a given payment method + delivery. */
export function buildPaymentLink(method: PaymentMethod, delivery: Pick<Delivery, "amount" | "id">): string {
  const amount = Math.round(delivery.amount);
  switch (method) {
    case "wave":
      return `${paymentDestinations.wave.value}?amount=${amount}&reference=${delivery.id.slice(0, 8)}`;
    case "orange_money":
      return `tel:*144*1*${encodeURIComponent(paymentDestinations.orange_money.value.replace(/\s/g, ""))}*${amount}%23`;
    case "moov_money":
      return `tel:*555*1*${encodeURIComponent(paymentDestinations.moov_money.value.replace(/\s/g, ""))}*${amount}%23`;
    case "crypto":
      return `#crypto`;
    default:
      return "#";
  }
}
