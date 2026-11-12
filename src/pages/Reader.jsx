import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Lock } from 'lucide-react';
import { fmtDate, useList } from '../api/client';
import { SECTIONS } from '../data/sections';
import { useAuth } from '../context/AuthContext';
import { useGate } from '../context/GateContext';
import Engage from '../components/Engage';
import usePageTitle from '../hooks/usePageTitle';

/** Full text of a devotional, blog, story or e-book: /resources/:slug/:id */
export default function Reader() {
  const { slug, id } = useParams();
  const cfg = SECTIONS[slug];
  if (!cfg || cfg.kind !== 'article') return <Navigate to="/" replace />;
  return <Article slug={slug} id={Number(id)} cfg={cfg} />;
}

function Article({ slug, id, cfg }) {
  const { user } = useAuth();
  const { guard } = useGate();
  const navigate = useNavigate();
  const { data, loading } = useList(cfg.resource);
  const item = data.find((d) => d.id === id);
  usePageTitle(item?.title || cfg.title, item?.excerpt);

  if (loading) return <section className="section"><div className="container reader"><div className="skel" style={{ height: 320 }} /></div></section>;
  if (!item) {
    return (
      <section className="section"><div className="container empty">
        <p style={{ marginBottom: 16 }}>We could not find that page.</p>
        <Link className="btn btn-gold" to={`/resources/${slug}`}>Back to {cfg.title}</Link>
      </div></section>
    );
  }

  const locked = !user || item.locked;
  const paragraphs = (item.body || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <Link to={`/resources/${slug}`} className="back"><ArrowLeft size={16} /> {cfg.title}</Link>
          <h1 style={{ marginTop: 10 }}>{item.title}</h1>
          <p>{[item.author, fmtDate(item.date), item.scripture].filter(Boolean).join(' · ')}</p>
        </div>
      </section>
      <section className="section">
        <div className="container reader">
          {item.cover && <img className="reader-cover" src={item.cover} alt={item.title} />}
          {item.excerpt && <p className="reader-lead">{item.excerpt}</p>}

          {locked ? (
            <div className="reader-lock">
              <Lock size={26} />
              <h3>Create a free account to read the full {slug === 'ebooks' ? 'book' : 'message'}</h3>
              <button className="btn btn-gold" onClick={() => guard({ type: 'read', id }, () => navigate(0), `/resources/${slug}/${id}`)}>
                Sign up to continue
              </button>
            </div>
          ) : (
            <>
              {paragraphs.map((p, i) => <p key={i} className="reader-p">{p}</p>)}
              {!paragraphs.length && !item.pdf && <p className="reader-p">The full text will be added soon.</p>}
              {item.pdf && (
                <a className="btn btn-gold" href={item.pdf} target="_blank" rel="noopener noreferrer"><Download size={16} /> Download PDF</a>
              )}
              {cfg.engage && <div style={{ marginTop: 32 }}><Engage kind={cfg.engage} item={item} /></div>}
            </>
          )}
        </div>
      </section>
    </>
  );
}
