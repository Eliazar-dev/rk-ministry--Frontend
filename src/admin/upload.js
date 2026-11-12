// Direct-to-Cloudinary uploads: the server only signs the request, the file goes from the browser to
// Cloudinary (faster, and not limited by Vercel's 4.5 MB request body cap).
import { http } from '../api/http';

export const LIMITS = { image: 10, raw: 40, video: 100 }; // MB
export const ACCEPT = {
  image: 'image/jpeg,image/png,image/webp,image/gif',
  raw: 'application/pdf,.pdf',
  video: 'video/mp4,video/quicktime,video/webm',
};

export function checkFile(file, type) {
  const mb = file.size / 1048576;
  if (type === 'image' && !/^image\//.test(file.type)) return 'Please choose an image (JPG, PNG or WebP).';
  if (type === 'raw' && file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return 'Please choose a PDF file.';
  if (type === 'video' && !/^video\//.test(file.type)) return 'Please choose a video file (MP4 works best).';
  if (mb > LIMITS[type]) return `That file is ${mb.toFixed(1)} MB. The limit is ${LIMITS[type]} MB.`;
  return '';
}

/** Resize big photos in the browser (max 1600 px, JPEG 85%) so the upload is quick. Falls back to the original. */
export async function shrinkImage(file, max = 1600, quality = 0.85) {
  if (file.size < 300 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // JPEG has no transparency
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.\w+$/, '')}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/** Resolves with the file's secure_url. `signal` cancels the upload. */
export async function uploadToCloudinary(file, { type = 'image', folder = 'covers', onProgress, signal } = {}) {
  const sign = await http('/manage/upload-sign/', { method: 'POST', body: { folder, type }, signal });
  const body = type === 'image' ? await shrinkImage(file) : file;
  const fd = new FormData();
  fd.append('file', body);
  fd.append('api_key', sign.api_key);
  fd.append('timestamp', sign.timestamp);
  fd.append('signature', sign.signature);
  fd.append('folder', sign.folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', sign.upload_url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let d = {};
      try {
        d = JSON.parse(xhr.responseText);
      } catch {
        /* not JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && d.secure_url) resolve(d.secure_url);
      else reject(new Error(d?.error?.message || 'Upload failed. Please try again.'));
    };
    xhr.onerror = () => reject(new Error('Network problem while uploading. Check your connection and try again.'));
    const abort = () => {
      xhr.abort();
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    if (signal) {
      if (signal.aborted) return abort();
      signal.addEventListener('abort', abort, { once: true });
    }
    xhr.send(fd);
  });
}
