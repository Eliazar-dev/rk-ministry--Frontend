import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, FileText, Image as ImageIcon, X } from 'lucide-react';
import { slugify } from '../api/client';
import { useGate } from '../context/GateContext';
import { useToast } from '../context/ToastContext';

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export default function LessonReader({ lesson, isOpen, onClose, onWatchVideo }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [imgReady, setImgReady] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const pinch = useRef(null);
  const swipe = useRef(null);
  const { guard } = useGate();
  const toast = useToast();

  const pages = lesson?.pages || [];
  const lessonSlug = slugify(lesson?.title || `lesson-${lesson?.id || ''}`);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
      setScale(1);
      setImgReady(false);
      document.body.style.overflow = 'hidden';
      contentRef.current?.querySelector('.lesson-reader-close')?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset image state whenever the visible page changes
  useEffect(() => {
    setImgReady(false);
    setScale(1);
  }, [currentPage, isOpen]);

  // Preload the next page so flipping feels instant; the rest stay lazy
  useEffect(() => {
    const nxt = pages[currentPage + 1];
    if (!nxt?.url) return;
    const im = new Image();
    im.src = nxt.url;
  }, [currentPage, pages]);

  const nextPage = () => {
    if (currentPage < pages.length - 1) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') return onClose();
    if (e.key === 'ArrowRight') return nextPage();
    if (e.key === 'ArrowLeft') return prevPage();
    // Focus trap: keep Tab inside the reader
    if (e.key === 'Tab' && contentRef.current) {
      const els = [...contentRef.current.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled);
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Touch: one finger swipes between pages, two fingers pinch to zoom
  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const handleTouchStart = (e) => {
    const t = e.touches;
    if (t.length === 2) {
      pinch.current = { d: dist(t), s: scale };
      swipe.current = null;
    } else if (t.length === 1) {
      swipe.current = { x: t[0].clientX, y: t[0].clientY };
      pinch.current = null;
    }
  };

  const handleTouchMove = (e) => {
    const t = e.touches;
    if (t.length === 2 && pinch.current) {
      e.preventDefault();
      setScale(clamp(pinch.current.s * (dist(t) / pinch.current.d), 1, 4));
    } else if (t.length === 1 && swipe.current && scale === 1) {
      const dx = t[0].clientX - swipe.current.x;
      const dy = t[0].clientY - swipe.current.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        swipe.current = null;
        dx < 0 ? nextPage() : prevPage();
      }
    }
  };

  const handleTouchEnd = () => {
    pinch.current = null;
    swipe.current = null;
  };

  const toggleZoom = () => setScale((s) => (s > 1 ? 1 : 2));

  /** Real file download: fetch the file as a blob and save it under `fname`.
   *  Avoids Cloudinary fl_attachment, which the account does not allow. */
  const saveFile = async (url, fname) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return;
    } catch {
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      } catch {
        toast('Press and hold the file to save it.');
      }
    }
  };

  const downloadImage = () => {
    const page = pages[currentPage];
    if (!page?.url) return;
    const labelSlug = slugify(page.label || `page-${currentPage + 1}`);
    saveFile(page.url, `${lessonSlug}-${labelSlug}.jpg`);
  };

  const downloadPdf = () => {
    if (!lesson?.pdf) return;
    saveFile(lesson.pdf, `${lessonSlug}.pdf`);
  };

  if (!isOpen || !lesson) return null;

  const currentPageData = pages[currentPage];
  const zoomed = scale > 1;

  return (
    <div className="lesson-reader-modal" onClick={onClose} role="presentation">
      <div
        className="lesson-reader-content"
        role="dialog"
        aria-modal="true"
        aria-label={`${lesson.title} — lesson pages`}
        onClick={(e) => e.stopPropagation()}
        ref={(el) => {
          contentRef.current = el;
          containerRef.current = el;
        }}
      >
        <header className="lesson-reader-header">
          <div className="lesson-reader-title">
            <h2>{lesson.title}</h2>
            <span className="lesson-reader-counter">{currentPage + 1} / {pages.length}</span>
          </div>
          <div className="lesson-reader-actions">
            {lesson.hasVideo && onWatchVideo && (
              <button className="lesson-reader-btn" onClick={() => guard({ type: 'lesson', id: lesson.id }, () => onWatchVideo(lesson))}>
                <ArrowLeft size={16} style={{ transform: 'scaleX(-1)' }} /> Watch Video
              </button>
            )}
            {currentPageData && (
              <button className="lesson-reader-btn" onClick={downloadImage}>
                <ImageIcon size={16} /> Download image
              </button>
            )}
            {lesson.hasPdf && (
              <button className="lesson-reader-btn" onClick={downloadPdf}>
                <FileText size={16} /> Download PDF
              </button>
            )}
            <button className="lesson-reader-close" onClick={onClose} aria-label="Close lesson">
              <X size={20} />
            </button>
          </div>
        </header>

        <div
          className={`lesson-reader-main ${zoomed ? 'zoomed' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {currentPageData ? (
            <div className="lesson-reader-imgwrap">
              {!imgReady && <div className="lesson-reader-skel" aria-hidden="true" />}
              <img
                src={currentPageData.url}
                alt={currentPageData.alt || currentPageData.label || `${lesson.title} page ${currentPage + 1}`}
                onClick={toggleZoom}
                onLoad={() => setImgReady(true)}
                onError={() => setImgReady(true)}
                style={{ transform: `scale(${scale})` }}
                draggable={false}
              />
            </div>
          ) : (
            <div className="lesson-reader-empty">
              <p>No pages in this lesson yet.</p>
            </div>
          )}
        </div>

        <footer className="lesson-reader-footer">
          <div className="lesson-reader-tabs" role="tablist" aria-label="Lesson days">
            {pages.map((page, index) => (
              <button
                key={page.id}
                role="tab"
                aria-selected={index === currentPage}
                className={`lesson-reader-tab ${index === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(index)}
              >
                {page.label || `Page ${index + 1}`}
              </button>
            ))}
          </div>
          <div className="lesson-reader-nav">
            <button onClick={prevPage} disabled={currentPage === 0} aria-label="Previous page"><ArrowLeft size={20} /></button>
            <button onClick={nextPage} disabled={currentPage === pages.length - 1} aria-label="Next page"><ArrowRight size={20} /></button>
          </div>
        </footer>
      </div>
    </div>
  );
}
