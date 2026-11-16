import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, FileImage, FileText, GripVertical, Image as ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { mp } from './api';
import { MAX_PAGES, fetchPdfBytes, openPdf, pageToJpeg } from './pdfToPages';
import { uploadToCloudinary } from './upload';
import { Skeleton, useConfirm, useToast } from './ui';

const results = (data) => (Array.isArray(data) ? data : data?.results || []);

export default function LessonPagesField({ value, onChange, lessonId, onPdfUrl, pdfUrl }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(0); // 0 = idle, otherwise "3/7"
  const [pct, setPct] = useState(null);
  const [buildingPdf, setBuildingPdf] = useState(false);
  const [pdfPct, setPdfPct] = useState(null);
  const [converting, setConverting] = useState(null); // {done,total,page} while converting a PDF
  const [convFailed, setConvFailed] = useState([]); // 1-based page numbers that failed
  const [pickPdf, setPickPdf] = useState(false); // show "choose file" after a CORS-blocked fetch
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const dragFrom = useRef(null);
  const pagesRef = useRef([]);
  const orderRef = useRef(0);
  const pdfDocRef = useRef(null);

  // Load pages when lessonId changes
  useEffect(() => {
    if (!lessonId) {
      setPages([]);
      return;
    }
    setLoading(true);
    mp(`lesson-pages/?lesson=${lessonId}`)
      .then((data) => setPages(results(data).sort((a, b) => a.order - b.order)))
      .catch((err) => {
        console.error('Failed to load lesson pages:', err);
        toast('Could not load the lesson pages. Refresh and try again.', 'error');
      })
      .finally(() => setLoading(false));
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update parent when pages change
  useEffect(() => {
    pagesRef.current = pages;
    onChange(pages);
  }, [pages, onChange]);

  const patch = async (pageId, updates) => {
    try {
      const updated = await mp(`lesson-pages/${pageId}/`, { method: 'PATCH', body: updates });
      setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, ...updated } : p)));
    } catch (err) {
      console.error('Update failed:', err);
      toast('Could not save that page. Try again.', 'error');
    }
  };

  const handleFileSelect = async (files) => {
    const list = Array.from(files || []).filter((f) => /^image\//.test(f.type));
    if (!list.length || !lessonId) return;
    setUploading(0);
    let done = 0;
    try {
      for (const file of list) {
        setUploading(`${done + 1}/${list.length}`);
        setPct(0);
        const url = await uploadToCloudinary(file, {
          type: 'image',
          folder: 'lessons',
          maxWidth: 1800,
          onProgress: setPct,
        });
        const newPage = await mp('lesson-pages/', {
          method: 'POST',
          body: { lesson: lessonId, image_url: url, label: `Page ${pages.length + done + 1}`, order: pages.length + done },
        });
        setPages((prev) => [...prev, newPage]);
        done += 1;
      }
      toast(`Uploaded ${list.length} page${list.length > 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Upload failed:', err);
      toast(err.message || 'Upload failed. Please try again.', 'error');
    } finally {
      setUploading(0);
      setPct(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (page) => {
    const ok = await confirm({
      title: 'Delete this page?',
      message: page.label ? `"${page.label}" will be removed from the lesson.` : 'This page will be removed from the lesson.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await mp(`lesson-pages/${page.id}/`, { method: 'DELETE' });
      const remaining = pages.filter((p) => p.id !== page.id).map((p, i) => ({ ...p, order: i }));
      setPages(remaining);
      mp('lesson-pages/reorder/', {
        method: 'POST',
        body: remaining.map((p) => ({ id: p.id, order: p.order })),
      }).catch(() => {});
      toast('Page deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      toast('Could not delete the page. Try again.', 'error');
    }
  };

  const move = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    const prev = pages;
    const next = [...pages];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const reordered = next.map((p, i) => ({ ...p, order: i }));
    setPages(reordered);
    try {
      await mp('lesson-pages/reorder/', {
        method: 'POST',
        body: reordered.map((p) => ({ id: p.id, order: p.order })),
      });
    } catch (err) {
      console.error('Reorder failed:', err);
      setPages(prev);
      toast('Could not save the new order. Try again.', 'error');
    }
  };

  const onDrop = (toIndex) => (e) => {
    e.preventDefault();
    if (dragFrom.current != null && dragFrom.current !== toIndex) move(dragFrom.current, toIndex);
    dragFrom.current = null;
  };

  const handleBuildPdf = async () => {
    if (!pages.length) {
      toast('Add at least one page first', 'error');
      return;
    }
    setBuildingPdf(true);
    try {
      const pdfDoc = await PDFDocument.create();
      for (let i = 0; i < pages.length; i++) {
        setPdfPct(`${i + 1}/${pages.length}`);
        const res = await fetch(pages[i].url);
        if (!res.ok) throw new Error(`Could not fetch page ${i + 1}`);
        const bytes = await res.arrayBuffer();
        const isPng = /\.png($|\?)/i.test(pages[i].url);
        const image = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        pdfDoc.addPage([image.width, image.height]).drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      const blob = new Blob([await pdfDoc.save()], { type: 'application/pdf' });
      const file = new File([blob], `lesson-${lessonId || 'pages'}.pdf`, { type: 'application/pdf' });
      const url = await uploadToCloudinary(file, { type: 'raw', folder: 'pdfs', onProgress: setPdfPct });
      // Show the new PDF link in the form's PDF field (saved when the lesson form is saved).
      onPdfUrl?.(url);
      toast('PDF built — save the lesson to keep it');
    } catch (err) {
      console.error('Build PDF failed:', err);
      toast(err.message || 'Could not build the PDF. Try again.', 'error');
    } finally {
      setBuildingPdf(false);
      setPdfPct(null);
    }
  };

  /** Render + upload a list of 1-based PDF page numbers. Returns the ones that failed. */
  const processPages = async (indices) => {
    const doc = pdfDocRef.current?.doc;
    if (!doc) return indices;
    const failed = [];
    let created = 0;
    for (const n of indices) {
      setConverting({ done: created, total: indices.length, page: n });
      try {
        const img = await pageToJpeg(doc, n);
        setPct(0);
        const url = await uploadToCloudinary(img, { type: 'image', folder: 'lessons', onProgress: setPct });
        const rec = await mp('lesson-pages/', {
          method: 'POST',
          body: { lesson: lessonId, image_url: url, label: `Page ${n}`, order: orderRef.current },
        });
        orderRef.current += 1;
        created += 1;
        setPages((prev) => [...prev, rec]);
        setConvFailed((prev) => prev.filter((f) => f !== n));
      } catch (err) {
        console.error(`PDF page ${n} failed:`, err);
        failed.push(n);
        setConvFailed((prev) => (prev.includes(n) ? prev : [...prev, n].sort((a, b) => a - b)));
      }
    }
    setPct(null);
    return failed;
  };

  const deleteAllPages = async () => {
    const ids = pagesRef.current.map((p) => p.id);
    await Promise.all(ids.map((id) => mp(`lesson-pages/${id}/`, { method: 'DELETE' }).catch(() => {})));
    pagesRef.current = [];
    orderRef.current = 0;
    setPages([]);
  };

  /** file = a locally picked PDF (used when fetching the URL is blocked by CORS). */
  const startConvert = async (file) => {
    if (!lessonId || converting) return;
    setConvFailed([]);
    setConverting({ done: 0, total: 0, page: 0 });
    pdfDocRef.current?.destroy?.().catch(() => {});
    pdfDocRef.current = null;
    try {
      const data = file
        ? new Uint8Array(await file.arrayBuffer())
        : await fetchPdfBytes(pdfUrl);
      const handle = await openPdf(data);
      pdfDocRef.current = handle;
      if (handle.numPages > MAX_PAGES) {
        await handle.destroy();
        pdfDocRef.current = null;
        throw new Error(`This PDF has ${handle.numPages} pages. The limit is ${MAX_PAGES} — please split it into smaller files.`);
      }
      if (pagesRef.current.length) {
        const ok = await confirm({
          title: 'Replace existing pages?',
          message: `This lesson already has ${pagesRef.current.length} page(s). Converting the PDF will delete them and create ${handle.numPages} new page(s).`,
          confirmLabel: 'Replace',
          danger: true,
        });
        if (!ok) {
          await handle.destroy();
          pdfDocRef.current = null;
          return;
        }
        await deleteAllPages();
      }
      orderRef.current = pagesRef.current.length;
      const failed = await processPages(Array.from({ length: handle.numPages }, (_, i) => i + 1));
      if (!failed.length) {
        await handle.destroy().catch(() => {});
        pdfDocRef.current = null;
        toast(`Converted ${handle.numPages} page${handle.numPages > 1 ? 's' : ''} from the PDF`);
      } else {
        toast(`${handle.numPages - failed.length} of ${handle.numPages} pages converted — retry the failed ones below`, 'error');
      }
    } catch (err) {
      console.error('PDF conversion failed:', err);
      if (err.message === 'CORS' && !file) {
        setPickPdf(true);
        toast('Could not read the PDF from its link — choose the PDF file from your computer instead.', 'error');
      } else {
        toast(err.message || 'Could not convert the PDF. Try again.', 'error');
      }
    } finally {
      setConverting(null);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const retryFailed = async () => {
    if (!pdfDocRef.current || !convFailed.length || converting) return;
    orderRef.current = pagesRef.current.length;
    setConverting({ done: 0, total: convFailed.length, page: 0 });
    try {
      const still = await processPages(convFailed);
      setConvFailed(still);
      if (!still.length) {
        await pdfDocRef.current?.destroy?.().catch(() => {});
        pdfDocRef.current = null;
        toast('All pages converted');
      }
    } finally {
      setConverting(null);
      setPct(null);
    }
  };

  if (loading) {
    return <div className="a-lesson-pages"><Skeleton h={120} /></div>;
  }

  const busy = uploading !== 0 || buildingPdf || converting !== null;

  return (
    <div className="a-lesson-pages">
      <div className="a-lesson-pages-header">
        <button className="a-btn" onClick={() => fileInputRef.current?.click()} disabled={busy || !lessonId}>
          {uploading !== 0 ? <><Loader2 size={16} className="spin" /> Uploading {uploading}…</> : <><Plus size={16} /> Add pages</>}
        </button>
        <button className="a-btn" onClick={handleBuildPdf} disabled={busy || !pages.length} title={pages.length ? '' : 'Add at least one page first'}>
          {buildingPdf ? <><Loader2 size={16} className="spin" /> Building {pdfPct || ''}…</> : <><FileText size={16} /> Build PDF from pages</>}
        </button>
        {pdfUrl && (
          <button
            className="a-btn"
            onClick={() => startConvert()}
            disabled={busy || !lessonId}
            title={lessonId ? 'Turn the lesson PDF into page images' : 'Save the lesson first'}
          >
            {converting ? (
              <><Loader2 size={16} className="spin" /> {converting.total ? `Page ${converting.page} of ${converting.total}` : 'Opening PDF…'}…</>
            ) : (
              <><FileImage size={16} /> Convert PDF to pages</>
            )}
          </button>
        )}
        {pickPdf && !converting && (
          <button className="a-btn" onClick={() => pdfInputRef.current?.click()}>
            <FileText size={16} /> Choose PDF file…
          </button>
        )}
        {pct !== null && (
          <div className="a-progress" style={{ flex: 1, minWidth: 120 }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div><i style={{ width: `${pct}%` }} /></div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && startConvert(e.target.files[0])}
        />
      </div>
      {!lessonId && <small className="a-help">Save the lesson first, then add its pages here.</small>}
      {convFailed.length > 0 && !converting && (
        <div className="a-lesson-pages-warn" role="alert">
          <span>
            Could not convert page{convFailed.length > 1 ? 's' : ''} {convFailed.join(', ')} of the PDF.
          </span>
          <button className="a-btn" onClick={retryFailed} disabled={busy}>
            Retry failed page{convFailed.length > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {pages.length === 0 ? (
        <div className="a-lesson-pages-empty">
          <ImageIcon size={32} />
          <p>No pages yet. Add images to create lesson pages.</p>
        </div>
      ) : (
        <div className="a-lesson-pages-grid">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className="a-lesson-page-card"
              draggable
              onDragStart={() => (dragFrom.current = index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop(index)}
            >
              <div className="a-lesson-page-img">
                <img src={page.url} alt={page.alt_text || page.label} loading="lazy" />
                <span className="a-lesson-page-grip"><GripVertical size={14} /></span>
                <div className="a-lesson-page-actions">
                  <button className="a-icon" onClick={() => move(index, index - 1)} disabled={index === 0} title="Move up"><ArrowUp size={16} /></button>
                  <button className="a-icon" onClick={() => move(index, index + 1)} disabled={index === pages.length - 1} title="Move down"><ArrowDown size={16} /></button>
                  <button className="a-icon" onClick={() => handleDelete(page)} title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              <input
                className="a-input a-small"
                defaultValue={page.label}
                placeholder="Label (e.g. Friday, Oct 23)"
                onBlur={(e) => e.target.value !== page.label && patch(page.id, { label: e.target.value })}
              />
              <input
                className="a-input a-small"
                defaultValue={page.alt_text}
                placeholder="Alt text"
                onBlur={(e) => e.target.value !== page.alt_text && patch(page.id, { alt_text: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
