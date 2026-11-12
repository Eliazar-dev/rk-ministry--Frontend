import { useRef, useState } from 'react';
import { FileText, Link2, Trash2, UploadCloud, X } from 'lucide-react';
import { ACCEPT, checkFile, uploadToCloudinary } from './upload';

const LABEL = { image: 'an image', raw: 'a PDF', video: 'a video' };

/** Upload to Cloudinary straight from the browser (with progress), or paste a link. */
export default function ImageField({ value, onChange, type = 'image', folder = 'covers', id }) {
  const [pct, setPct] = useState(null);
  const [err, setErr] = useState('');
  const [paste, setPaste] = useState(false);
  const [over, setOver] = useState(false);
  const abort = useRef(null);
  const input = useRef(null);
  const busy = pct !== null;

  const pick = async (file) => {
    if (!file) return;
    const bad = checkFile(file, type);
    if (bad) return setErr(bad);
    setErr('');
    setPct(0);
    abort.current = new AbortController();
    try {
      onChange(await uploadToCloudinary(file, { type, folder, onProgress: setPct, signal: abort.current.signal }));
    } catch (ex) {
      if (ex.name !== 'AbortError') setErr(ex.message);
    } finally {
      setPct(null);
      if (input.current) input.current.value = '';
    }
  };

  const preview =
    !value ? null : type === 'image' ? <img src={value} alt="" /> :
    type === 'video' ? <video src={value} muted controls preload="metadata" /> :
    <a href={value} target="_blank" rel="noopener noreferrer" className="a-file"><FileText size={22} /> <span>{decodeURIComponent(value.split('/').pop() || 'document')}</span></a>;

  return (
    <div className="a-upload">
      {preview && <div className={`a-preview ${type}`}>{preview}</div>}

      {busy ? (
        <div className="a-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div><i style={{ width: `${pct}%` }} /></div>
          <span>Uploading… {pct}%</span>
          <button type="button" className="a-btn sm" onClick={() => abort.current?.abort()}><X size={14} /> Cancel</button>
        </div>
      ) : (
        <div
          className={`a-drop ${over ? 'over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}
        >
          <UploadCloud size={20} />
          <span>Drop {LABEL[type]} here or</span>
          <button type="button" className="a-btn sm" onClick={() => input.current?.click()}>{value ? 'Replace' : 'Choose file'}</button>
          <button type="button" className="a-btn sm ghost" onClick={() => setPaste((p) => !p)}><Link2 size={14} /> Paste link</button>
          {value && <button type="button" className="a-btn sm ghost danger" onClick={() => onChange('')}><Trash2 size={14} /> Remove</button>}
          <input ref={input} id={id} type="file" hidden accept={ACCEPT[type]} onChange={(e) => pick(e.target.files?.[0])} />
        </div>
      )}

      {paste && !busy && (
        <input className="a-input" placeholder="https://…" value={value || ''} onChange={(e) => onChange(e.target.value.trim())} aria-label="Link" />
      )}
      {err && <div className="a-err" role="alert">{err}</div>}
    </div>
  );
}
