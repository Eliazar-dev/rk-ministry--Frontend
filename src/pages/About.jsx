import { Eye, Quote, Target } from 'lucide-react';
import { useOne } from '../api/client';
import { LogoImg } from '../components/Logo';
import usePageTitle from '../hooks/usePageTitle';

export default function About() {
  usePageTitle('About', 'About Richard Kwanya Snr Ministry: the pastor, our mission and our vision.');
  const { data: p, loading } = useOne('about');
  const paras = (p.biography || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const empty = !loading && !p.biography && !p.intro;

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <div className="eyebrow">About</div>
          <h1>Richard Kwanya Snr Ministry</h1>
          <p>Equipping people, transforming lives — #Babawa.</p>
        </div>
      </section>

      <section className="section" id="pastor">
        <div className="container">
          <div className="sec-head"><div><div className="eyebrow">The pastor</div><h2>Meet the Pastor</h2></div></div>
          {loading ? (
            <div className="pastor"><div className="skel" style={{ aspectRatio: '4/5' }} /><div style={{ display: 'grid', gap: 12 }}>
              <div className="skel" style={{ height: 28, width: '60%' }} /><div className="skel" style={{ height: 16 }} /><div className="skel" style={{ height: 16, width: '90%' }} />
            </div></div>
          ) : (
            <div className="pastor">
              <div className="pastor-photo">
                {p.photo ? <img src={p.photo} alt={p.name} /> : <div className="pastor-ph"><LogoImg alt="" /></div>}
              </div>
              <div className="pastor-text">
                <h3>{p.name || 'Richard Kwanya Snr'}</h3>
                {p.title && <div className="pastor-role">{p.title}</div>}
                {p.intro && <p className="pastor-intro">{p.intro}</p>}
                {p.quote && <blockquote className="pastor-quote"><Quote size={22} />{p.quote}</blockquote>}
                {paras.map((t, i) => <p key={i}>{t}</p>)}
                {empty && <p>Biography coming soon.</p>}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container vm-grid">
          <article className="vm" id="mission">
            <Target size={34} color="#b8912a" />
            <h3>Our Mission</h3>
            <p>To spread the gospel of Jesus Christ through preaching, teaching, literature, health ministry and community service — equipping every believer to share their faith.</p>
          </article>
          <article className="vm" id="vision">
            <Eye size={34} color="#b8912a" />
            <h3>Our Vision</h3>
            <p>A world where people are equipped, communities are transformed, and lives are anchored in the hope of Christ&apos;s soon return.</p>
          </article>
        </div>
      </section>
    </>
  );
}
