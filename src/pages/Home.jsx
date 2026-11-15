import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Quote } from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';
import SectionHeader from '../components/SectionHeader';
import { SkeletonGrid } from '../components/Skeleton';
import { AlbumCard, LessonCard, ProductCard, VideoCard } from '../components/Cards';
import VideoModal from '../components/VideoModal';
import PrayerForm from '../components/PrayerForm';
import { useList } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/GateContext';
import { useSEO } from '../hooks/useSEO';

export default function Home() {
  useSEO({
    title: 'Richard Kwanya Snr Ministry | #Babawa',
    description: 'Richard Kwanya Snr Ministry — sermons, Sabbath School lessons, devotionals, mission gallery and store. Equipping people, transforming lives.',
  });
  const { user } = useAuth();
  const sermons = useList('sermons');
  const lessons = useList('lessons');
  const gallery = useList('gallery');
  const products = useList('products');
  const [playing, setPlaying] = useState(null); // { item, kind }

  const openSermon = useCallback((item) => setPlaying({ item, kind: 'sermon' }), []);
  const openLesson = useCallback((item) => setPlaying({ item, kind: 'lesson' }), []);
  useResume('sermon', sermons.data, openSermon);
  useResume('lesson', lessons.data, openLesson);

  return (
    <>
      <HeroCarousel />

      <section className="section alt">
        <div className="container">
          <SectionHeader eyebrow="Watch" title="Latest Video Sermons" to="/resources/sermons" />
          {sermons.loading ? (
            <SkeletonGrid count={6} />
          ) : (
            <div className="grid">{sermons.data.slice(0, 6).map((s) => <VideoCard key={s.id} item={s} onOpen={openSermon} />)}</div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader eyebrow="Study" title="Sabbath School Lessons" to="/resources/sabbath-school" />
          {lessons.loading ? (
            <SkeletonGrid count={6} />
          ) : (
            <div className="grid">{lessons.data.slice(0, 6).map((l) => <LessonCard key={l.id} item={l} onWatch={openLesson} />)}</div>
          )}
        </div>
      </section>

      <section className="verse">
        <div className="container">
          <Quote size={34} />
          <blockquote>Nurturing Hearts, Developing Minds, Transforming Lives</blockquote>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <PrayerForm />
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <SectionHeader eyebrow="Moments" title="Latest Mission Gallery" to="/resources/mission-gallery" cta="View all albums" />
          {gallery.loading ? (
            <SkeletonGrid count={6} />
          ) : gallery.data.length === 0 ? (
            <div className="empty">Mission albums will appear here soon.</div>
          ) : (
            <div className="grid">{gallery.data.slice(0, 6).map((g) => <AlbumCard key={g.id} item={g} />)}</div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader eyebrow="Store" title="Available Products" to="/store" />
          {products.loading ? (
            <SkeletonGrid count={6} />
          ) : (
            <div className="grid">{products.data.slice(0, 6).map((p) => <ProductCard key={p.id} item={p} />)}</div>
          )}
        </div>
      </section>

      {!user && (
        <section className="cta-band">
          <div className="container">
            <h2>Join the family</h2>
            <p>Create a free account to watch every sermon, download lessons and read devotionals.</p>
            <Link to="/auth" state={{ from: '/', mode: 'signup' }} className="btn btn-gold btn-glow">Create free account</Link>
          </div>
        </section>
      )}

      {playing && <VideoModal item={playing.item} kind={playing.kind} onClose={() => setPlaying(null)} />}
    </>
  );
}
