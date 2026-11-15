import { Eye, Quote, Target } from 'lucide-react';
import { useOne } from '../api/client';
import { LogoImg } from '../components/Logo';
import { useSEO } from '../hooks/useSEO';

export default function About() {
  useSEO({
    title: 'About | Richard Kwanya Snr Ministry',
    description: 'About Richard Kwanya Snr Ministry: the pastor, our mission and our vision.',
  });
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
            <p>To advance holistic human development by integrating biblical truth, counselling, mentorship, health education, leadership development, and digital ministry, empowering individuals physically, spiritually, mentally, and socially for meaningful living and faithful service.</p>
          </article>
          <article className="vm" id="vision">
            <Eye size={34} color="#b8912a" />
            <h3>Our Vision</h3>
            <p>To cultivate a Christ-centered, inclusive, and transformative community where individuals of all ages and abilities experience holistic growth, discover their God-given purpose, and positively impact the world around them.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sec-head"><h2>Motto / Tagline</h2></div>
          <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#d4af37', textAlign: 'center', marginTop: 20 }}>
            Nurturing Hearts, Developing Minds, Transforming Lives
          </p>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="sec-head"><h2>Core Values</h2></div>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
            Helping people discover purpose, experience holistic transformation, and live lives of meaningful impact through Christ.
          </p>
        </div>
      </section>
    </>
  );
}
