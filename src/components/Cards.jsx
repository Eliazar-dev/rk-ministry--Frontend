import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Check, Download, ExternalLink, Heart, Lock, MapPin, Play, PlayCircle, ShoppingCart } from 'lucide-react';
import { fmtDate, money } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useGate } from '../context/GateContext';
import { useToast } from '../context/ToastContext';

const LockBadge = ({ label }) => (
  <span className="lock-badge"><Lock size={11} /> {label}</span>
);

export function VideoCard({ item, onOpen }) {
  const { user } = useAuth();
  const { guard } = useGate();
  return (
    <button className="card" onClick={() => guard({ type: 'sermon', id: item.id }, () => onOpen(item))}>
      <div className="card-media">
        {item.category && <span className="tag">{item.category}</span>}
        {!user && <LockBadge label="Sign up to watch" />}
        <img src={item.cover} alt={item.title} loading="lazy" />
        <span className="play"><Play size={22} fill="currentColor" /></span>
      </div>
      <div className="card-body">
        <h3>{item.title}</h3>
        <div className="meta">
          <span>{item.speaker}</span>
          <span>{fmtDate(item.date)}</span>
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Heart size={12} /> {item.likes}</span>
        </div>
      </div>
    </button>
  );
}

export function LessonCard({ item, onWatch }) {
  const { user } = useAuth();
  const { guard } = useGate();
  const download = () =>
    guard({ type: 'pdf', id: item.id }, () => window.open(item.pdf, '_blank', 'noopener,noreferrer'));
  return (
    <div className="card">
      <div className="card-media">
        <span className="tag">{item.quarter}</span>
        {!user && <LockBadge label="Sign up" />}
        <img src={item.cover} alt={item.title} loading="lazy" />
      </div>
      <div className="card-body">
        <h3>{item.title}</h3>
        <div className="meta"><span>{item.dateRange}</span><span>{item.teacher}</span></div>
        <div className="card-actions">
          <button className="btn btn-navy" onClick={() => guard({ type: 'lesson', id: item.id }, () => onWatch(item))}>
            <PlayCircle size={15} /> Watch the lesson
          </button>
          {item.hasPdf !== false && (
            <button className="btn btn-gold" onClick={download}><Download size={15} /> Download Pdf</button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Opens the reader page. Visitors are asked to sign up first. */
export function ArticleCard({ item, to }) {
  const { user } = useAuth();
  const { guard } = useGate();
  const navigate = useNavigate();
  const open = () => guard({ type: 'read', id: item.id }, () => navigate(to), to);
  return (
    <button className="card" onClick={open}>
      <div className="card-media">
        {item.category && <span className="tag">{item.category}</span>}
        {!user && <LockBadge label="Sign up to read" />}
        <img src={item.cover} alt={item.title} loading="lazy" />
      </div>
      <div className="card-body">
        <h3>{item.title}</h3>
        <p>{item.excerpt}</p>
        <div className="meta">
          <span>{item.author}</span><span>{fmtDate(item.date)}</span>
          {item.scripture && <span>{item.scripture}</span>}
        </div>
      </div>
    </button>
  );
}

export function AlbumCard({ item }) {
  const { user } = useAuth();
  const { guard } = useGate();
  const view = () => guard({ type: 'album', id: item.id }, () => window.open(item.link, '_blank', 'noopener,noreferrer'));
  return (
    <article className="card album">
      <div className="card-media">
        <span className="ribbon"><Calendar size={12} /> {fmtDate(item.date)}</span>
        <img src={item.cover} alt={item.title} loading="lazy" />
      </div>
      <div className="card-body">
        <h3>{item.title}</h3>
        <div className="meta">
          {item.location && <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><MapPin size={12} /> {item.location}</span>}
          {item.description && <span>{item.description}</span>}
        </div>
        <div className="card-actions" style={{ flexDirection: 'column', gap: 4 }}>
          <button className="btn btn-navy" onClick={view} style={{ width: '100%' }}>
            <ExternalLink size={15} /> View photos
          </button>
          <small className="ext-note">Opens on an external site</small>
        </div>
      </div>
    </article>
  );
}

export function ProductCard({ item }) {
  const { add } = useCart();
  const toast = useToast();
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    const { qty, existed } = add(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    toast({
      image: item.image,
      title: existed ? `Quantity updated (${qty})` : 'Added to your cart',
      message: item.name,
      to: '/cart',
      toLabel: 'View cart',
    });
  };

  return (
    <div className="card">
      <div className="card-media"><img src={item.image} alt={item.name} loading="lazy" /></div>
      <div className="card-body">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <div className="price">{money(item.price)}</div>
        <div className="card-actions">
          <button className={`btn btn-navy ${added ? 'added' : ''}`} onClick={onAdd}>
            {added ? <><Check size={15} /> Added</> : <><ShoppingCart size={15} /> Add to cart</>}
          </button>
        </div>
      </div>
    </div>
  );
}
