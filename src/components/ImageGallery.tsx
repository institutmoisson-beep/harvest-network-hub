import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, Package, Maximize2 } from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";

interface ImageGalleryProps {
  images: string[];
  name: string;
  /** Tailwind height class for the main image area, e.g. "h-44" or "h-56". */
  heightClass?: string;
  /** Show a row of clickable thumbnails below the main image (used in detail views). */
  showThumbnails?: boolean;
  className?: string;
}

const ImageGallery = ({ images, name, heightClass = "h-44", showThumbnails = false, className = "" }: ImageGalleryProps) => {
  const cleanImages = images.filter(Boolean);
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (cleanImages.length === 0) {
    return (
      <div className={`${heightClass} bg-gradient-purple flex items-center justify-center rounded-t-2xl ${className}`}>
        <Package size={40} className="text-primary-foreground/50" />
      </div>
    );
  }

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((p) => (p === 0 ? cleanImages.length - 1 : p - 1));
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((p) => (p === cleanImages.length - 1 ? 0 : p + 1));
  };

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setLightboxOpen(true)}
        className={`relative ${heightClass} overflow-hidden group cursor-zoom-in`}
      >
        <img
          src={cleanImages[current]}
          alt={`${name} - image ${current + 1}`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <Maximize2 size={20} className="text-white opacity-0 group-hover:opacity-90 transition-opacity drop-shadow" />
        </div>

        {cleanImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={14} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {cleanImages.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-white/50"}`}
                />
              ))}
            </div>
            <div className="absolute top-2 right-2 bg-background/60 rounded-full px-2 py-0.5 text-[10px] flex items-center gap-1">
              <ImageIcon size={10} /> {current + 1}/{cleanImages.length}
            </div>
          </>
        )}
      </div>

      {showThumbnails && cleanImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto mt-2 pb-1">
          {cleanImages.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                i === current ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} alt={`${name} miniature ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <ImageLightbox
        images={cleanImages}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={current}
        name={name}
      />
    </div>
  );
};

export default ImageGallery;
