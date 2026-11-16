// PDF → page images, used only by the admin "Convert PDF to pages" button.
// pdf.js is imported lazily so the ~1 MB library never reaches the public site bundle.

export const MAX_PAGES = 30;
const PAGE_WIDTH = 1600;
const JPEG_QUALITY = 0.85;

let pdfjsPromise = null;

export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist');
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    })();
    pdfjsPromise.catch(() => {
      pdfjsPromise = null; // allow retry after a failed chunk load
    });
  }
  return pdfjsPromise;
}

/** Fetch PDF bytes from a URL. Throws a friendly Error on CORS/network failure. */
export async function fetchPdfBytes(url) {
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('CORS');
  }
  if (!res.ok) throw new Error(`The server answered ${res.status}. Check the PDF link.`);
  const buf = await res.arrayBuffer();
  if (!buf.byteLength) throw new Error('The PDF file is empty.');
  return new Uint8Array(buf);
}

/** Open a PDF from bytes. Returns { doc, numPages, destroy } — always call destroy() when done. */
export async function openPdf(data) {
  const pdfjs = await loadPdfjs();
  const task = pdfjs.getDocument({ data, isEvalSupported: false });
  try {
    const doc = await task.promise;
    return { doc, numPages: doc.numPages, destroy: () => task.destroy() };
  } catch (err) {
    await task.destroy().catch(() => {});
    if (err?.name === 'PasswordException') {
      throw new Error('This PDF is password-protected. Remove the password and try again.');
    }
    if (err?.name === 'InvalidPDFException') {
      throw new Error('That file is not a valid PDF.');
    }
    throw err;
  }
}

/** Render one PDF page (1-based) to a JPEG File, 1600 px wide. */
export async function pageToJpeg(doc, pageNumber) {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: PAGE_WIDTH / base.width });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // JPEG has no transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', JPEG_QUALITY));
  if (!blob) throw new Error('Could not render that page.');
  return new File([blob], `page-${pageNumber}.jpg`, { type: 'image/jpeg' });
}

