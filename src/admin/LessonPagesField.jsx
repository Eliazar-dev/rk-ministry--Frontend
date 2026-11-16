import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, FileText, GripVertical, Image as ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { mp } from './api';
import { uploadToCloudinary } from './upload';
import { Skeleton, useConfirm, useToast } from './ui';

const results = (data) => (Array.isArray(data) ? data : data?.results || []);

export default function LessonPagesField({ value, onChange, lessonId, onPdfUrl }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(0); // 0 = idle, otherwise "3/7"
  const [pct, setPct] = useState(null);
  const [buildingPdf, setBuildingPdf] = useState(false);
  const [pdfPct, setPdfPct] = useState(null);
  const fileInputRef = useRef(null);
  const dragFrom = useRef(null);

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

  if (loading) {
    return <div className="a-lesson-pages"><Skeleton h={120} /></div>;
  }

  const busy = uploading !== 0 || buildingPdf;

  return (
    <div className="a-lesson-pages">
      <div className="a-lesson-pages-header">
        <button className="a-btn" onClick={() => fileInputRef.current?.click()} disabled={busy || !lessonId}>
          {uploading !== 0 ? <><Loader2 size={16} className="spin" /> Uploading {uploading}…</> : <><Plus size={16} /> Add pages</>}
        </button>
        <button className="a-btn" onClick={handleBuildPdf} disabled={busy || !pages.length} title={pages.length ? '' : 'Add at least one page first'}>
          {buildingPdf ? <><Loader2 size={16} className="spin" /> Building {pdfPct || ''}…</> : <><FileText size={16} /> Build PDF from pages</>}
        </button>
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
      </div>
      {!lessonId && <small className="a-help">Save the lesson first, then add its pages here.</small>}

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
