/**
 * Comprime uma imagem antes do upload, mantendo qualidade suficiente para OCR.
 * - Redimensiona para no máximo 2400px no maior lado
 * - Re-encoda como JPEG com qualidade ~85
 * - Mantém PDF e arquivos pequenos intactos
 *
 * Útil principalmente para fotos de celular (geralmente 8-12MB → ~500KB).
 */

const MAX_DIMENSION = 2400;
const JPEG_QUALITY = 0.85;
// Não comprime se o arquivo já é menor que isso
const SKIP_COMPRESSION_BYTES = 800 * 1024; // 800 KB

export async function maybeCompressImage(file: File): Promise<File> {
  // Não mexe em PDFs nem em arquivos pequenos
  if (file.type === "application/pdf") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.size < SKIP_COMPRESSION_BYTES) return file;

  try {
    const img = await loadImage(file);
    const { width, height } = computeNewSize(img.width, img.height);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(b => resolve(b), "image/jpeg", JPEG_QUALITY);
    });
    if (!blob) return file;

    // Se a compressão piorou o tamanho (já era pequeno), mantém original
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Falha ao carregar imagem"));
    };
    img.src = url;
  });
}

function computeNewSize(w: number, h: number): { width: number; height: number } {
  const largest = Math.max(w, h);
  if (largest <= MAX_DIMENSION) return { width: w, height: h };
  const ratio = MAX_DIMENSION / largest;
  return {
    width: Math.round(w * ratio),
    height: Math.round(h * ratio),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
