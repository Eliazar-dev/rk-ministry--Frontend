import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Download, FileText, Image as ImageIcon, Loader2, Plus, Trash2, Video } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { mp } from './api';
import ImageField from './ImageField';
import { Skeleton, useToast } from './ui';

export default function LessonPagesField({ value, onChange, lessonId }) {
  const toast = useToast();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [buildingPdf, setBuildingPdf] = useState(false);
  const fileInputRef = useRef(null);

  // Load pages when lessonId changes
  useEffect(() => {
    if (!lessonId) {
      setPages([]);
      return;
    }
    setLoading(true);
    mp(`lesson-pages/?lesson=${lessonId}`)
      .then((data) => {
        setPages(data.sort((a, b) => a.order - b.order));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load lesson pages:', err);
        setLoading(false);
      });
  }, [lessonId]);

  // Update parent when pages change
  useEffect(() => {
    onChange(pages);
  }, [pages, onChange]);

  const handleFileSelect = async (files) => {
    if (!files.length || !lessonId) return;
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Resize image client-side
        const resized = await resizeImage(file, 1800, 0.85);
        
        // Upload to Cloudinary via signed upload
        const uploadData = await getUploadSignature('image', 'lessons');
        const formData = new FormData();
        formData.append('file', resized);
        formData.append('api_key', uploadData.api_key);
        formData.append('timestamp', uploadData.timestamp);
        formData.append('signature', uploadData.signature);
        formData.append('folder', uploadData.folder);

        const uploadResponse = await fetch(uploadData.upload_url, {
          method: 'POST',
          body: formData,
        });
        const uploadResult = await uploadResponse.json();

        // Create lesson page
        const newPage = await mp('lesson-pages/', {
          method: 'POST',
          body: {
            lesson: lessonId,
            image_url: uploadResult.secure_url,
            label: `Page ${pages.length + i + 1}`,
            order: pages.length + i,
          },
        });

        setPages((prev) => [...prev, newPage]);
      }
      toast(`Uploaded ${files.length} page(s)`);
    } catch (err) {
      console.error('Upload failed:', err);
      toast('Failed to upload images', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (pageId) => {
    try {
      await mp(`lesson-pages/${pageId}/`, { method: 'DELETE' });
      setPages((prev) => prev.filter((p) => p.id !== pageId));
      toast('Page deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      toast('Failed to delete page', 'error');
    }
  };

  const handleReorder = async (fromIndex, toIndex) => {
    const newPages = [...pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);
    
    // Update order values
    const reordered = newPages.map((p, i) => ({ ...p, order: i }));
    setPages(reordered);

    // Send reorder to backend
    try {
      await mp('lesson-pages/reorder/', {
        method: 'POST',
        body: reordered.map((p) => ({ id: p.id, order: p.order })),
      });
    } catch (err) {
      console.error('Reorder failed:', err);
      toast('Failed to reorder pages', 'error');
      // Revert on error
      setPages(pages);
    }
  };

  const handleUpdatePage = async (pageId, updates) => {
    try {
      const updated = await mp(`lesson-pages/${pageId}/`, {
        method: 'PATCH',
        body: updates,
      });
      setPages((prev) => prev.map((p) => (p.id === pageId ? updated : p)));
    } catch (err) {
      console.error('Update failed:', err);
      toast('Failed to update page', 'error');
    }
  };

  const handleBuildPdf = async () => {
    if (pages.length === 0) {
      toast('Add at least one page first', 'error');
      return;
    }
    setBuildingPdf(true);

    try {
      // Create PDF from images
      const pdfDoc = await PDFDocument.create();
      
      for (const page of pages) {
        // Fetch image
        const imageResponse = await fetch(page.url);
        const imageBytes = await imageResponse.arrayBuffer();
        
        // Embed image
        let image;
        if (page.url.toLowerCase().endsWith('.png')) {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          image = await pdfDoc.embedJpg(imageBytes);
        }
        
        // Create page matching image dimensions
        const pdfPage = pdfDoc.addPage([image.width, image.height]);
        pdfPage.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }
      
      // Save PDF
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Upload to Cloudinary
      const uploadData = await getUploadSignature('raw', 'pdfs');
      const formData = new FormData();
      formData.append('file', pdfBlob, `${pages[0].label || 'lesson'}.pdf`);
      formData.append('api_key', uploadData.api_key);
      formData.append('timestamp', uploadData.timestamp);
      formData.append('signature', uploadData.signature);
      formData.append('folder', uploadData.folder);
      formData.append('resource_type', 'raw');
      
      const uploadResponse = await fetch(uploadData.upload_url, {
        method: 'POST',
        body: formData,
      });
      const uploadResult = await uploadResponse.json();
      
      // Update lesson with PDF URL
      if (lessonId) {
        await mp(`lessons/${lessonId}/`, {
          method: 'PATCH',
          body: { pdf_url: uploadResult.secure_url },
        });
        toast('PDF built and saved successfully');
      }
    } catch (err) {
      console.error('Build PDF failed:', err);
      toast('Failed to build PDF: ' + err.message, 'error');
    } finally {
      setBuildingPdf(false);
    }
  };

  if (loading) {
    return <div className="a-lesson-pages"><Skeleton h={120} /></div>;
  }

  return (
    <div className="a-lesson-pages">
      <div className="a-lesson-pages-header">
        <button className="a-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <><Loader2 size={16} className="spin" /> Uploading…</> : <><Plus size={16} /> Add pages</>}
        </button>
        <button className="a-btn" onClick={handleBuildPdf} disabled={buildingPdf || pages.length === 0}>
          {buildingPdf ? <><Loader2 size={16} className="spin" /> Building…</> : <><FileText size={16} /> Build PDF from pages</>}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(Array.from(e.target.files))}
        />
      </div>

      {pages.length === 0 ? (
        <div className="a-lesson-pages-empty">
          <ImageIcon size={32} />
          <p>No pages yet. Add images to create lesson pages.</p>
        </div>
      ) : (
        <div className="a-lesson-pages-grid">
          {pages.map((page, index) => (
            <div key={page.id} className="a-lesson-page-card">
              <div className="a-lesson-page-img">
                <img src={page.url} alt={page.alt_text || page.label} loading="lazy" />
                <div className="a-lesson-page-actions">
                  <button
                    className="a-icon"
                    onClick={() => handleReorder(index, index - 1)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="a-icon"
                    onClick={() => handleReorder(index, index + 1)}
                    disabled={index === pages.length - 1}
                    title="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button className="a-icon" onClick={() => handleDelete(page.id)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <input
                className="a-input a-small"
                value={page.label}
                placeholder="Label (e.g. Friday, Oct 23)"
                onChange={(e) => handleUpdatePage(page.id, { label: e.target.value })}
              />
              <input
                className="a-input a-small"
                value={page.alt_text}
                placeholder="Alt text"
                onChange={(e) => handleUpdatePage(page.id, { alt_text: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper functions
async function resizeImage(file, maxWidth, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

async function getUploadSignature(type, folder) {
  const response = await mp('upload-sign/', {
    method: 'POST',
    body: { type, folder },
  });
  return response;
}
