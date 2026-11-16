import { useEffect, useState } from 'react';
import { CalendarClock, Lock, Radio } from 'lucide-react';
import PrayerForm from '../components/PrayerForm';
import { SkeletonCard } from '../components/Skeleton';
import { toEmbed } from '../api/client';
import { useLiveStream } from '../api/live';
import { useAuth } from '../context/AuthContext';
import { useGate } from '../context/GateContext';
import { useSEO } from '../hooks/useSEO';

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function Countdown({ target }) {
  const now = useNow();
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const parts = [
    d && `${d}d`,
    `${String(h).padStart(2, '0')}h`,
    `${String(m).padStart(2, '0')}m`,
    `${String(s).padStart(2, '0')}s`,
  ].filter(Boolean);
  return <span className="live-countdown">{parts.join(' ')}</span>;
}

export default function Live() {
  useSEO({
    title: 'Live | Richard Kwanya Snr Ministry',
    description: 'Watch live services from Richard Kwanya Snr Ministry.',
  });
  const { user } = useAuth();
  const { guard } = useGate();
  const { data: stream, loaded } = useLiveStream();
  const now = useNow(30000);

  if (!loaded) {
    return (
      <section className="section">
        <div className="container"><SkeletonCard /><div style={{ height: 16 }} /><SkeletonCard /></div>
      </section>
    );
  }

  const isLive = Boolean(stream?.isLive);
  const canWatch = Boolean(user && stream?.youtube);
  const startsIn = stream && !isLive && new Date(stream.scheduledAt).getTime() > now;

  return (
    <section className="section live-page">
      <div className="container">
        <div className="live-head">
          <span className={`live-badge ${isLive ? 'on' : ''}`}><Radio size={16} /> {isLive ? 'LIVE NOW' : 'Live service'}</span>
          <h1>{stream?.title || 'Live'}</h1>
        </div>

        {!stream ? (
          <div className="live-empty">
            <Radio size={40} />
            <h2>No service right now</h2>
            <p>When the next live service is scheduled it will appear here. Check back soon — or catch up on past sermons.</p>
          </div>
        ) : (
          <div className="live-grid">
            <div>
              <div className="live-player">
                {canWatch ? (
                  <iframe
                    src={toEmbed(stream.youtube)}
                    title={stream.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <button
                    className="live-watch"
                    onClick={() => guard({ type: 'live', id: stream.id }, () => {})}
                  >
                    <span className="live-watch-ic"><Lock size={30} /></span>
                    <strong>{isLive ? 'We are live — watch now' : 'Watch the service'}</strong>
                    <span>Create a free account to watch live services</span>
                  </button>
                )}
                {isLive && <span className="live-now-tag">● LIVE</span>}
              </div>

              <div className="live-meta">
                {isLive ? (
                  <p className="live-status on"><Radio size={15} /> Live now — join us!</p>
                ) : startsIn ? (
                  <p className="live-status"><CalendarClock size={15} /> Service starts in <Countdown target={stream.scheduledAt} /></p>
                ) : (
                  <p className="live-status"><CalendarClock size={15} /> Scheduled for {new Date(stream.scheduledAt).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                )}
                {stream.description && <p className="live-desc">{stream.description}</p>}
              </div>
            </div>

            <PrayerForm />
          </div>
        )}
      </div>
    </section>
  );
}
