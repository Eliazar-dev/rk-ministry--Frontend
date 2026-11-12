import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown, PlayCircle } from 'lucide-react';
import Navbar from './Navbar';
import { heroSlides } from '../data/mock';
import { useList } from '../api/client';

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Video hero. Slides come from the admin (a Cloudinary video per slide).
 * Each video plays once and the next one fades in; a single video simply loops.
 * The first video loads straight away, the others only fetch their first bytes until their turn.
 */
export default function HeroCarousel() {
  const { data } = useList('hero');
  const slides = data.length ? data : heroSlides;
  const [idx, setIdx] = useState(0);
  const refs = useRef([]);
  const many = slides.length > 1;

  const next = useCallback(() => setIdx((i) => (i + 1) % slides.length), [slides.length]);

  useEffect(() => {
    refs.current.forEach((v, i) => {
      if (!v) return;
      if (i === idx) {
        v.currentTime = 0;
        if (!reduceMotion()) v.play().catch(() => {});
      } else v.pause();
    });
  }, [idx, slides.length]);

  // if a video stalls or never ends, move on after 40 s
  useEffect(() => {
    if (!many) return;
    const t = setTimeout(next, 40000);
    return () => clearTimeout(t);
  }, [idx, many, next]);

  // save battery and data in background tabs
  useEffect(() => {
    const onVis = () => {
      const v = refs.current[idx];
      if (!v) return;
      if (document.hidden) v.pause();
      else if (!reduceMotion()) v.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [idx]);

  return (
    <section className="hero" aria-label="Welcome">
      {slides.map((s, i) => (
        <div key={s.id} className={`hero-slide ${i === idx ? 'active' : ''}`} aria-hidden={i !== idx}>
          <video
            ref={(el) => (refs.current[i] = el)}
            src={s.video}
            poster={s.poster || undefined}
            muted
            loop={!many}
            playsInline
            autoPlay={i === 0 && !reduceMotion()}
            preload={i === 0 ? 'auto' : 'metadata'}
            onEnded={many ? next : undefined}
            onError={many ? next : undefined}
          />
        </div>
      ))}

      <Navbar overlay />

      <div className="container">
        <div className="hero-content">
          <div className="hero-kicker">Richard Kwanya Snr · #Babawa</div>
          <h1>
            Equipping people,<br />
            <em>transforming lives</em>
          </h1>
          <p>Join a growing family spreading the gospel through the Word, worship, mission and service.</p>
          <div className="hero-cta">
            <Link to="/resources/sabbath-school" className="btn btn-gold btn-glow">
              <BookOpen size={18} /> Explore Latest Sabbath School Lesson
            </Link>
            <Link to="/resources/sermons" className="btn btn-glass-glow">
              <PlayCircle size={18} /> Latest Sermon Video
            </Link>
          </div>
        </div>
      </div>

      {many && (
        <div className="hero-dots">
          {slides.map((s, i) => (
            <button key={s.id} className={i === idx ? 'on' : ''} onClick={() => setIdx(i)} aria-label={`Show video ${i + 1}`} />
          ))}
        </div>
      )}
      <a className="hero-scroll" href="#latest" aria-label="Scroll to content"><ChevronDown size={22} /></a>
    </section>
  );
}
