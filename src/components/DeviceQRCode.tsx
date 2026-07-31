import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeviceQRCodeProps {
  qrHash: string;
  serialNumber: string;
  size?: number;
}

const DeviceQRCode = ({ qrHash, serialNumber, size = 200 }: DeviceQRCodeProps) => {
  const verifyUrl = `${window.location.origin}/verify/${qrHash}`;

  const download = () => {
    const svg = document.getElementById(`device-qr-${qrHash}`);
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
      link.download = `qr-appareil-${serialNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-4 bg-white rounded-2xl border border-border">
        <QRCodeSVG id={`device-qr-${qrHash}`} value={verifyUrl} size={size} level="H" />
      </div>
      <p className="text-xs text-muted-foreground font-mono">{serialNumber}</p>
      <Button type="button" size="sm" variant="outline" onClick={download} className="font-display text-xs">
        <Download size={14} className="mr-1" /> Télécharger le QR
      </Button>
    </div>
  );
};

export default DeviceQRCode;
