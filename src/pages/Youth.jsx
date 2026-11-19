import { useCallback, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { useList } from '../api/client';
import { ArticleCard, VideoCard } from '../components/Cards';
import { SkeletonGrid } from '../components/Skeleton';
import VideoModal from '../components/VideoModal';
import { useResume } from '../context/GateContext';
import { useSEO } from '../hooks/useSEO';

/** Sermons tagged with a youth category ("Youth", "Youth Ministry", …) shown as videos. */
const isYouth = (s) => /youth/i.test(s?.category || '');

export default function Youth() {
  useSEO({
    title: 'Youth Ministries | Richard Kwanya Snr Ministry',
    description: 'Videos and articles for the next generation — Richard Kwanya Snr Youth Ministries.',
  });

  const sermons = useList('sermons');
  const articles = useList('youth');
  const [playing, setPlaying] = useState(null);

  const videos = useMemo(() => sermons.data.filter(isYouth), [sermons.data]);
  const open = useCallback((item) => setPlaying(item), []);
  useResume('sermon', videos, open);

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <div className="eyebrow"><Users size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Resources</div>
          <h1>Youth Ministries</h1>
          <p>Videos and articles for the next generation — equipping young people to know Christ and live on mission.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sec-head">
            <div><div className="eyebrow">Watch</div><h2>Youth Videos</h2></div>
          </div>
          {sermons.loading ? (
            <SkeletonGrid count={3} />
          ) : videos.length === 0 ? (
            <div className="empty">Youth videos are coming soon.</div>
          ) : (
            <div className="grid">{videos.map((v) => <VideoCard key={v.id} item={v} onOpen={open} />)}</div>
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="sec-head">
            <div><div className="eyebrow">Read</div><h2>Youth Articles</h2></div>
          </div>
          {articles.loading ? (
            <SkeletonGrid count={3} />
          ) : articles.data.length === 0 ? (
            <div className="empty">New youth content is coming soon.</div>
          ) : (
            <div className="grid">
              {articles.data.map((a) => <ArticleCard key={a.id} item={a} to={`/resources/youth-ministries/${a.id}`} />)}
            </div>
          )}
        </div>
      </section>

      {playing && <VideoModal item={playing} kind="sermon" onClose={() => setPlaying(null)} />}
    </>
  );
}
