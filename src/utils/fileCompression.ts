import { zipSync, gzipSync, deflateSync } from 'fflate';

export interface CompressionResult {
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  savedBytes: number;
  durationMs: number;
  speedMBps: number;
  fileName: string;
}

export type CompressionLevel = 'fast' | 'balanced' | 'max';

/**
 * High-speed client-side compression for large files
 */
export async function compressLargeFile(
  file: File,
  level: CompressionLevel = 'balanced',
  onProgress?: (percent: number) => void
): Promise<CompressionResult> {
  const startTime = performance.now();
  onProgress?.(10);

  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(30);

  const uint8Data = new Uint8Array(arrayBuffer);
  onProgress?.(45);

  let compressedData: Uint8Array;
  let finalFileName = '';
  let mimeType = 'application/zip';

  // Map level to fflate level (1-9)
  const fflateLevel = level === 'fast' ? 1 : level === 'balanced' ? 6 : 9;

  // Check if image for smart image compression or general high-speed zip
  if (file.type.startsWith('image/') && !file.type.includes('svg')) {
    try {
      const imgBitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const quality = level === 'fast' ? 0.8 : level === 'balanced' ? 0.6 : 0.45;

      let targetWidth = imgBitmap.width;
      let targetHeight = imgBitmap.height;

      // Scale down if extremely large
      if (level === 'max' && (targetWidth > 1920 || targetHeight > 1920)) {
        const ratio = Math.min(1920 / targetWidth, 1920 / targetHeight);
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
      } else if (level === 'balanced' && (targetWidth > 2560 || targetHeight > 2560)) {
        const ratio = Math.min(2560 / targetWidth, 2560 / targetHeight);
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imgBitmap, 0, 0, targetWidth, targetHeight);
        const compressedBlob: Blob = await new Promise((resolve) => {
          canvas.toBlob(
            (b) => resolve(b || new Blob([uint8Data], { type: file.type })),
            'image/jpeg',
            quality
          );
        });

        // If canvas made it smaller, use it
        if (compressedBlob.size < file.size) {
          const endTime = performance.now();
          const durationMs = Math.max(1, Math.round(endTime - startTime));
          const speedMBps = Number(((file.size / (1024 * 1024)) / (durationMs / 1000)).toFixed(2));
          const ratio = Math.round(((file.size - compressedBlob.size) / file.size) * 100);

          onProgress?.(100);
          return {
            compressedBlob,
            originalSize: file.size,
            compressedSize: compressedBlob.size,
            ratio: Math.max(0, ratio),
            savedBytes: Math.max(0, file.size - compressedBlob.size),
            durationMs,
            speedMBps,
            fileName: file.name.replace(/\.[^/.]+$/, '') + '_compressed.jpg'
          };
        }
      }
    } catch {
      // Fallback to binary zip
    }
  }

  onProgress?.(60);

  // Fast ZIP archive compression using fflate
  const fileObj: Record<string, [Uint8Array, { level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 }]> = {
    [file.name]: [uint8Data, { level: fflateLevel as 1 | 6 | 9 }]
  };

  compressedData = zipSync(fileObj);
  finalFileName = file.name + '.zip';

  onProgress?.(90);

  const compressedBlob = new Blob([compressedData], { type: mimeType });
  const endTime = performance.now();
  const durationMs = Math.max(1, Math.round(endTime - startTime));
  const speedMBps = Number(((file.size / (1024 * 1024)) / (durationMs / 1000)).toFixed(2));
  const ratio = Math.round(((file.size - compressedBlob.size) / file.size) * 100);

  onProgress?.(100);

  return {
    compressedBlob,
    originalSize: file.size,
    compressedSize: compressedBlob.size,
    ratio: Math.max(0, ratio),
    savedBytes: Math.max(0, file.size - compressedBlob.size),
    durationMs,
    speedMBps,
    fileName: finalFileName
  };
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
