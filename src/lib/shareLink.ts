export type ShareProductType = "pack" | "wholesale" | "distribution";

export interface ShareableProduct {
  id: string;
  type: ShareProductType;
  name: string;
  price: number;
  currency: string;
  image?: string | null;
}

/**
 * Builds the public, shareable landing page URL for a product/pack.
 * If a referral code is provided, it is attached so that anyone who signs up
 * from this link gets automatically linked to the sharer's network.
 */
export function buildShareUrl(product: ShareableProduct, referralCode?: string | null) {
  const url = new URL(`${window.location.origin}/p/${product.type}/${product.id}`);
  if (referralCode) url.searchParams.set("ref", referralCode);
  return url.toString();
}

/**
 * Builds the default promotional caption that accompanies a shared product,
 * including the "Tu es nouveau ? Inscris-toi avec mon code d'invitation" line.
 */
export function buildShareMessage(product: ShareableProduct, referralCode?: string | null) {
  const priceLine = `${Number(product.price).toLocaleString()} ${product.currency}`;
  const lines = [
    `🌾 ${product.name} — ${priceLine}`,
    product.type === "pack"
      ? "Découvre ce pack d'activation Institut Moisson !"
      : "Découvre ce produit disponible sur Institut Moisson !",
  ];
  if (referralCode) {
    lines.push(`\nTu es nouveau ? Inscris-toi avec mon code d'invitation : ${referralCode} 🌱`);
  }
  return lines.join("\n");
}
