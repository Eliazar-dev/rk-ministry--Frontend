import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SectionHeader({ eyebrow, title, to, cta = 'View all' }) {
  return (
    <div className="sec-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
      </div>
      {to && (
        <Link to={to} className="link-more">
          {cta} <ArrowRight size={18} />
        </Link>
      )}
    </div>
  );
}
