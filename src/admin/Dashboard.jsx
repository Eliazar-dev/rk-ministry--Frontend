import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, HandHeart, Mail, ShoppingBag, Users } from 'lucide-react';
import { fmtDate, fmtDateTime, money, mp } from './api';
import { Badge, STATUS_TONE, Skeleton, usePageTitle } from './ui';

function Kpi({ icon: Icon, label, value, note, to }) {
  const inner = (
    <>
      <span className="a-kpi-ic"><Icon size={20} /></span>
      <div><small>{label}</small><strong>{value}</strong>{note && <em>{note}</em>}</div>
    </>
  );
  return to ? <Link to={to} className="a-kpi">{inner}</Link> : <div className="a-kpi">{inner}</div>;
}

function Chart({ series }) {
  const max = Math.max(1, ...series.map((d) => d.orders + d.donations));
  const W = 700, H = 200, pad = 26, bw = (W - pad * 2) / series.length;
  const total = series.reduce((n, d) => n + d.orders + d.donations, 0);
  return (
    <svg viewBox={`0 0 ${W} ${H + 26}`} role="img" aria-labelledby="ch-t ch-d" className="a-chart">
      <title id="ch-t">Money received in the last 14 days</title>
      <desc id="ch-d">{`Total ${money(total)} from orders and donations.`}</desc>
      {total === 0 && <text x={W / 2} y={H / 2} textAnchor="middle" className="empty">No sales or donations in the last 14 days yet.</text>}
      {[0, 0.5, 1].map((f) => <line key={f} x1={pad} x2={W - pad} y1={H - f * (H - 10)} y2={H - f * (H - 10)} className="grid" />)}
      {series.map((d, i) => {
        const x = pad + i * bw + bw * 0.18;
        const w = bw * 0.64;
        const ho = (d.orders / max) * (H - 10);
        const hd = (d.donations / max) * (H - 10);
        return (
          <g key={d.date}>
            <title>{`${fmtDate(d.date)}: orders ${money(d.orders)}, donations ${money(d.donations)}`}</title>
            <rect x={x} y={H - ho} width={w} height={ho} rx="3" className="orders" />
            <rect x={x} y={H - ho - hd} width={w} height={hd} rx="3" className="gifts" />
            {i % 2 === 0 && <text x={x + w / 2} y={H + 18} textAnchor="middle">{new Date(d.date).getDate()}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export default function Dashboard() {
  usePageTitle('Dashboard');
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const ctl = new AbortController();
    mp('stats/', { signal: ctl.signal }).then(setD).catch((ex) => ex.name !== 'AbortError' && setErr(ex.message));
    return () => ctl.abort();
  }, []);

  if (err) return <div className="a-card a-empty"><p>{err}</p></div>;
  if (!d) {
    return (
      <div>
        <div className="a-head"><h1>Dashboard</h1></div>
        <div className="a-kpis">{[1, 2, 3, 4].map((n) => <div key={n} className="a-kpi"><Skeleton h={44} /></div>)}</div>
        <div className="a-card" style={{ padding: 20, marginTop: 18 }}><Skeleton h={200} r={14} /></div>
      </div>
    );
  }
  const c = d.content;
  return (
    <div>
      <div className="a-head"><div><h1>Dashboard</h1><p className="a-sub">How the ministry website is doing.</p></div></div>

      <div className="a-kpis">
        <Kpi icon={Coins} label="Store revenue" value={money(d.orders.revenue)} note={`${d.orders.paid} paid orders`} to="/manage/orders" />
        <Kpi icon={HandHeart} label="Donations" value={money(d.donations.total)} note={`${d.donations.count} gifts`} to="/manage/donations" />
        <Kpi icon={Users} label="Members" value={d.members} to="/manage/members" />
        <Kpi icon={ShoppingBag} label="Pending orders" value={d.orders.pending} to="/manage/orders?status=pending" />
      </div>

      <div className="a-grid2">
        <div className="a-card a-pad">
          <div className="a-card-head"><h2>Last 14 days</h2><span className="a-legend"><i className="orders" /> Orders <i className="gifts" /> Donations</span></div>
          <Chart series={d.series} />
        </div>
        <div className="a-card a-pad">
          <h2>Needs attention</h2>
          <Link className="a-todo" to="/manage/prayers"><HandHeart size={18} /> Prayer requests to pray for <b>{d.inbox.prayers}</b></Link>
          <Link className="a-todo" to="/manage/messages"><Mail size={18} /> Messages to answer <b>{d.inbox.messages}</b></Link>
          <Link className="a-todo" to="/manage/orders?status=pending"><ShoppingBag size={18} /> Orders waiting for payment <b>{d.orders.pending}</b></Link>
          <h2 style={{ marginTop: 18 }}>On the website</h2>
          <div className="a-counts">
            {[['Sermons', c.sermons, 'sermons'], ['Lessons', c.lessons, 'lessons'], ['Devotionals', c.devotionals, 'devotionals'], ['Articles', c.articles, 'articles'], ['Albums', c.albums, 'albums'], ['Products', c.products, 'products'], ['Carousel videos', c.hero, 'hero']].map(([l, n, to]) => (
              <Link key={l} to={`/manage/${to}`}><b>{n}</b>{l}</Link>
            ))}
          </div>
        </div>
      </div>

      <div className="a-grid2">
        <div className="a-card a-pad">
          <div className="a-card-head"><h2>Recent orders</h2><Link to="/manage/orders">View all</Link></div>
          {d.recent.orders.length === 0 && <p className="a-sub">No orders yet.</p>}
          {d.recent.orders.map((o) => (
            <div className="a-li" key={o.id}><div><strong>{o.name}</strong><small>{o.ref} · {fmtDateTime(o.created)}</small></div><div style={{ textAlign: 'right' }}><strong>{money(o.amount)}</strong><br /><Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge></div></div>
          ))}
        </div>
        <div className="a-card a-pad">
          <div className="a-card-head"><h2>Latest prayer requests</h2><Link to="/manage/prayers">View all</Link></div>
          {d.recent.prayers.length === 0 && <p className="a-sub">None yet.</p>}
          {d.recent.prayers.map((p) => (
            <div className="a-li" key={p.id}><div><strong>{p.name}</strong><small className="a-clip">{p.request}</small></div>{p.prayed_for && <Badge tone="green">Prayed</Badge>}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
