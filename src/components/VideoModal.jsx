import { useEffect } from 'react';
import { X } from 'lucide-react';
import { toEmbed } from '../api/client';
import Engage from './Engage';

/** Embedded YouTube player with likes + comments. kind: 'sermon' | 'lesson' */
export default function VideoModal({ item, kind = 'sermon', onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <h3>{item.title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="video-frame">
          <iframe
            src={toEmbed(item.youtube)}
            title={item.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="modal-body">
          <Engage kind={kind} item={item} />
        </div>
      </div>
    </div>
  );
}
