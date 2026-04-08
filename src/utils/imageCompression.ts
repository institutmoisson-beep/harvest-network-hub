import imageCompression from "browser-image-compression";

export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/webp" as const,
  };
  try {
    const compressed = await imageCompression(file, options);
    return compressed;
  } catch {
    return file;
  }
};

export const compressImages = async (files: FileList | File[]): Promise<File[]> => {
  const arr = Array.from(files);
  return Promise.all(arr.map(compressImage));
};
