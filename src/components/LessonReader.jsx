import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, FileText, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { useGate } from '../context/GateContext';

export default function LessonReader({ lesson, isOpen, onClose }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const containerRef = useRef(null);
  const { guard } = useGate();

  const pages = lesson?.pages || [];

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
      setZoomed(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') nextPage();
    if (e.key === 'ArrowLeft') prevPage();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage]);

  const handleTouchStart = (e) => {
    if (!containerRef.current) return;
    containerRef.current.touchStartX = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!containerRef.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = containerRef.current.touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextPage();
      else prevPage();
    }
  };

  const toggleZoom = () => {
    setZoomed(!zoomed);
  };

  const downloadImage = () => {
    const page = pages[currentPage];
    if (!page) return;
    
    // Use Cloudinary URL with fl_attachment for download
    const url = page.url.replace('/upload/', `/upload/fl_attachment:${lesson.quarter}-${page.label.replace(/\s+/g, '-')}/`);
    
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to download');
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${lesson.quarter}-${page.label.replace(/\s+/g, '-')}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      })
      .catch(() => {
        // Fallback: open in new tab
        window.open(page.url, '_blank', 'noopener,noreferrer');
      });
  };

  const downloadPdf = () => {
    if (!lesson.pdf) return;
    
    fetch(lesson.pdf)
      .then(res => {
        if (!res.ok) throw new Error('Failed to download PDF');
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${lesson.quarter}-${lesson.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      })
      .catch(() => {
        window.open(lesson.pdf, '_blank', 'noopener,noreferrer');
      });
  };

  if (!isOpen || !lesson) return null;

  const currentPageData = pages[currentPage];

  return (
    <div className="lesson-reader-modal" onClick={onClose}>
      <div className="lesson-reader-content" onClick={(e) => e.stopPropagation()} ref={containerRef}>
        <header className="lesson-reader-header">
          <div className="lesson-reader-title">
            <h2>{lesson.title}</h2>
            <span className="lesson-reader-counter">{currentPage + 1} / {pages.length}</span>
          </div>
          <div className="lesson-reader-actions">
            {lesson.hasVideo && (
              <button className="lesson-reader-btn" onClick={() => guard({ type: 'lesson', id: lesson.id }, () => onClose())}>
                <ArrowLeft size={16} /> Watch Video
              </button>
            )}
            <button className="lesson-reader-btn" onClick={downloadImage}>
              <ImageIcon size={16} /> Download Image
            </button>
            {lesson.hasPdf && (
              <button className="lesson-reader-btn" onClick={downloadPdf}>
                <FileText size={16} /> Download PDF
              </button>
            )}
            <button className="lesson-reader-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </header>

        <div
          className={`lesson-reader-main ${zoomed ? 'zoomed' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {currentPageData ? (
            <img
              src={currentPageData.url.replace('/upload/', '/upload/f_auto,q_auto,w_1600/')}
              alt={currentPageData.alt_text || currentPageData.label}
              onClick={toggleZoom}
              loading="lazy"
            />
          ) : (
            <div className="lesson-reader-empty">
              <Loader2 size={32} className="spin" />
              <p>Loading page...</p>
            </div>
          )}
        </div>

        <footer className="lesson-reader-footer">
          <div className="lesson-reader-tabs">
            {pages.map((page, index) => (
              <button
                key={page.id}
                className={`lesson-reader-tab ${index === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(index)}
              >
                {page.label || `Page ${index + 1}`}
              </button>
            ))}
          </div>
          <div className="lesson-reader-nav">
            <button onClick={prevPage} disabled={currentPage === 0}>
              <ArrowLeft size={20} />
            </button>
            <button onClick={nextPage} disabled={currentPage === pages.length - 1}>
              <ArrowRight size={20} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
