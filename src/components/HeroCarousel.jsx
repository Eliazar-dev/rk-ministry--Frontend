import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown, PlayCircle } from 'lucide-react';
import Navbar from './Navbar';
import { heroSlides } from '../data/mock';
import { useList } from '../api/client';

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Generate Cloudinary poster URL from video URL
const posterFromVideo = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes('cloudinary.com')) return '';
  const marker = '/video/upload/';
  if (!videoUrl.includes(marker)) return '';
  const [head, tail] = videoUrl.split(marker);
  const baseName = tail.split('.').slice(0, -1).join('.');
  return `${head}${marker}${baseName}.jpg`;
};

// Optimize Cloudinary video URL for bandwidth
const optimizeVideoUrl = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes('cloudinary.com')) return videoUrl;
  const marker = '/video/upload/';
  if (!videoUrl.includes(marker)) return videoUrl;
  const width = window.innerWidth < 768 ? 'w_720' : 'w_1280';
  const [head, tail] = videoUrl.split(marker);
  return `${head}${marker}${width},q_auto,f_auto/${tail}`;
};

/**
 * Video hero. Slides come from the admin (a Cloudinary video per slide).
 * Each video plays once and the next one fades in; a single video simply loops.
 * Improved reliability with poster fallback, optimized URLs, and error handling.
 */
export default function HeroCarousel() {
  const { data } = useList('hero');
  const slides = data.length ? data : heroSlides;
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const refs = useRef([]);
  const readyTimeouts = useRef({});
  const playRetries = useRef({});
  const many = slides.length > 1;

  const next = useCallback(() => {
    console.log('HeroCarousel: advancing to next slide');
    setIdx((i) => (i + 1) % slides.length);
    setReady(false);
    setPlaying(false);
  }, [slides.length]);

  // Play a video with retry logic
  const attemptPlay = useCallback((video, retries = 3) => {
    if (!video) return;
    console.log('HeroCarousel: attempting play() for video', video.src);
    
    const play = () => {
      video.play()
        .then(() => {
          console.log('HeroCarousel: play() succeeded');
          playRetries.current[video.src] = 0;
        })
        .catch((err) => {
          console.error('HeroCarousel: play() failed:', err.message, err.name);
          const currentRetries = playRetries.current[video.src] || 0;
          if (currentRetries < retries) {
            playRetries.current[video.src] = currentRetries + 1;
            console.log(`HeroCarousel: retrying play() in 500ms (attempt ${currentRetries + 1}/${retries})`);
            setTimeout(() => play(), 500);
          } else {
            console.error('HeroCarousel: play() failed after all retries, skipping slide');
            next();
          }
        });
    };
    
    play();
  }, [next]);

  // Handle video events
  useEffect(() => {
    refs.current.forEach((v, i) => {
      if (!v) return;

      // Clear previous handlers
      readyTimeouts.current[i] && clearTimeout(readyTimeouts.current[i]);

      if (i === idx) {
        // Active slide
        const handleCanPlay = () => {
          console.log('HeroCarousel: canplay event fired for slide', i);
          setReady(true);
          readyTimeouts.current[i] && clearTimeout(readyTimeouts.current[i]);
        };

        const handlePlaying = () => {
          console.log('HeroCarousel: playing event fired for slide', i);
          setPlaying(true);
        };

        const handleEnded = () => {
          console.log('HeroCarousel: video ended for slide', i);
          if (many) next();
        };

        const handleError = (e) => {
          console.error('HeroCarousel: video error for slide', i, e);
          if (many) {
            console.log('HeroCarousel: skipping to next slide due to error');
            next();
          }
        };

        const handleStalled = () => {
          console.warn('HeroCarousel: video stalled for slide', i);
          if (many) {
            console.log('HeroCarousel: skipping to next slide due to stall');
            next();
          }
        };

        v.addEventListener('canplay', handleCanPlay);
        v.addEventListener('playing', handlePlaying);
        v.addEventListener('ended', handleEnded);
        v.addEventListener('error', handleError);
        v.addEventListener('stalled', handleStalled);

        // 6-second timeout fallback
        readyTimeouts.current[i] = setTimeout(() => {
          if (!ready) {
            console.warn('HeroCarousel: canplay timeout for slide', i, 'advancing anyway');
            setReady(true);
          }
        }, 6000);

        // Try to play
        v.currentTime = 0;
        if (!reduceMotion()) {
          attemptPlay(v);
        }

        return () => {
          v.removeEventListener('canplay', handleCanPlay);
          v.removeEventListener('playing', handlePlaying);
          v.removeEventListener('ended', handleEnded);
          v.removeEventListener('error', handleError);
          v.removeEventListener('stalled', handleStalled);
          readyTimeouts.current[i] && clearTimeout(readyTimeouts.current[i]);
        };
      } else {
        // Inactive slide - pause it
        v.pause();
      }
    });
  }, [idx, many, next, ready, attemptPlay]);

  // Resume on visibility change
  useEffect(() => {
    const onVis = () => {
      const v = refs.current[idx];
      if (!v) return;
      if (document.hidden) {
        v.pause();
      } else if (!reduceMotion()) {
        attemptPlay(v);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [idx, attemptPlay]);

  // Retry on user interaction
  useEffect(() => {
    const onUserInteract = () => {
      const v = refs.current[idx];
      if (v && !playing && !reduceMotion()) {
        console.log('HeroCarousel: user interaction detected, retrying play()');
        attemptPlay(v);
      }
    };
    document.addEventListener('click', onUserInteract);
    document.addEventListener('scroll', onUserInteract);
    return () => {
      document.removeEventListener('click', onUserInteract);
      document.removeEventListener('scroll', onUserInteract);
    };
  }, [idx, playing, attemptPlay]);

  return (
    <section className="hero" aria-label="Welcome">
      {slides.map((s, i) => {
        const poster = s.poster || posterFromVideo(s.video);
        const optimizedVideo = optimizeVideoUrl(s.video);
        return (
          <div key={s.id} className={`hero-slide ${i === idx ? 'active' : ''}`} aria-hidden={i !== idx}>
            <video
              ref={(el) => (refs.current[i] = el)}
              src={optimizedVideo}
              poster={poster}
              muted
              loop={!many}
              playsInline
              autoPlay={i === 0 && !reduceMotion()}
              preload={i === idx ? 'auto' : 'metadata'}
            />
          </div>
        );
      })}

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
