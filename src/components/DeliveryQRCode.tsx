import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Delivery } from "@/lib/deliveryTypes";

interface DeliveryQRCodeProps {
  delivery: Delivery;
  size?: number;
}

const DeliveryQRCode = ({ delivery, size = 220 }: DeliveryQRCodeProps) => {
  const qrValue = JSON.stringify({
    im_delivery: delivery.qr_token,
    amount: delivery.amount,
    currency: delivery.currency,
  });

  const download = () => {
    const svg = document.getElementById(`delivery-qr-${delivery.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, size, size);
      const link = document.createElement("a");
      link.download = `qr-livraison-${delivery.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-4 bg-white rounded-2xl border border-border">
        <QRCodeSVG id={`delivery-qr-${delivery.id}`} value={qrValue} size={size} level="H" />
      </div>
      <div className="text-center">
        <p className="font-display text-sm font-bold">{delivery.product_name}</p>
        <p className="text-xs text-muted-foreground">{delivery.client_name} — {delivery.amount.toLocaleString()} {delivery.currency}</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={download} className="font-display text-xs">
        <Download size={14} className="mr-1" /> Télécharger le QR
      </Button>
    </div>
  );
};

export default DeliveryQRCode;
