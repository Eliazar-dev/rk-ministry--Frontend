import { useCallback, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useList } from '../api/client';
import { SECTIONS } from '../data/sections';
import { SkeletonGrid } from '../components/Skeleton';
import { AlbumCard, ArticleCard, LessonCard, VideoCard } from '../components/Cards';
import VideoModal from '../components/VideoModal';
import { useResume } from '../context/GateContext';
import usePageTitle from '../hooks/usePageTitle';

export default function ResourcePage() {
  const { slug } = useParams();
  const cfg = SECTIONS[slug];
  if (!cfg) return <Navigate to="/" replace />;
  return <Inner key={slug} slug={slug} cfg={cfg} />;
}

function Inner({ slug, cfg }) {
  usePageTitle(cfg.title, cfg.sub);
  const { data, loading } = useList(cfg.resource);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [playing, setPlaying] = useState(null);

  const kind = cfg.kind === 'video' ? 'sermon' : 'lesson';
  const open = useCallback((item) => setPlaying(item), []);
  useResume(kind, cfg.kind === 'video' || cfg.kind === 'lesson' ? data : [], open);

  // albums are grouped by year, everything else by category
  const field = cfg.kind === 'gallery' ? 'year' : 'category';
  const cats = useMemo(() => ['All', ...new Set(data.map((d) => d[field]).filter(Boolean).map(String))], [data, field]);
  const filtered = useMemo(
    () =>
      data.filter(
        (d) =>
          (cat === 'All' || String(d[field]) === cat) &&
          `${d.title} ${d.author || ''} ${d.speaker || ''} ${d.excerpt || ''} ${d.location || ''}`.toLowerCase().includes(q.toLowerCase())
      ),
    [data, q, cat, field]
  );

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <div className="eyebrow">{cfg.kind === 'gallery' ? 'Gallery' : 'Resources'}</div>
          <h1>{cfg.title}</h1>
          <p>{cfg.sub}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="toolbar">
            <label className="search">
              <Search size={18} color="#5c6a8a" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${cfg.title.toLowerCase()}…`} aria-label="Search" />
            </label>
            {cats.length > 2 && (
              <div className="chips">
                {cats.map((c) => (
                  <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <SkeletonGrid count={6} />
          ) : filtered.length === 0 ? (
            <div className="empty">{data.length ? 'Nothing found. Try a different search.' : 'New content is coming soon.'}</div>
          ) : (
            <div className="grid">
              {filtered.map((d) =>
                cfg.kind === 'video' ? (
                  <VideoCard key={d.id} item={d} onOpen={open} />
                ) : cfg.kind === 'lesson' ? (
                  <LessonCard key={d.id} item={d} onWatch={open} />
                ) : cfg.kind === 'gallery' ? (
                  <AlbumCard key={d.id} item={d} />
                ) : (
                  <ArticleCard key={d.id} item={d} to={`/resources/${slug}/${d.id}`} />
                )
              )}
            </div>
          )}
        </div>
      </section>

      {playing && <VideoModal item={playing} kind={kind} onClose={() => setPlaying(null)} />}
    </>
  );
}
