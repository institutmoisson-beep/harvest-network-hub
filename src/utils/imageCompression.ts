import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";

const MAX_IMAGE_SIZE_MB = 0.5;
const MAX_IMAGE_DIMENSION = 1200;

const safeName = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();

const imageExtension = (file: File) => {
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  return "webp";
};

export const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/")) throw new Error("Le fichier sélectionné n'est pas une image.");
  const options = {
    maxSizeMB: MAX_IMAGE_SIZE_MB,
    maxWidthOrHeight: MAX_IMAGE_DIMENSION,
    useWebWorker: true,
    fileType: "image/webp" as const,
  };
  try {
    const compressed = await imageCompression(file, options);
    return new File([compressed], `${safeName(file.name) || "image"}.webp`, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
};

export const compressImages = async (files: FileList | File[]): Promise<File[]> => {
  const arr = Array.from(files);
  return Promise.all(arr.map(compressImage));
};

export const uploadOptimizedImages = async (files: FileList | File[], bucket: string, folder: string): Promise<string[]> => {
  const optimized = await compressImages(files);
  const urls: string[] = [];
  for (const file of optimized) {
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${imageExtension(file)}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type || "image/webp" });
    if (error) throw new Error(error.message);
    urls.push(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
  }
  return urls;
};

export const uploadOptimizedImage = async (file: File, bucket: string, folder: string): Promise<string> => {
  const [url] = await uploadOptimizedImages([file], bucket, folder);
  return url;
};
