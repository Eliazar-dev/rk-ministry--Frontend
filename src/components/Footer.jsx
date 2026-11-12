import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import Logo from './Logo';
import { EMAIL, MAP_QUERY, PHONE } from '../config';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p style={{ marginTop: 16, maxWidth: 340, fontSize: '.9rem' }}>
            Equipping people, transforming lives. Spreading the gospel through the Word, worship, mission and service.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/resources/sermons">Sermons</Link></li>
            <li><Link to="/resources/sabbath-school">Sabbath School</Link></li>
            <li><Link to="/store">Store</Link></li>
          </ul>
        </div>
        <div>
          <h4>Ministry</h4>
          <ul>
            <li><Link to="/about#pastor">Pastor&apos;s Biography</Link></li>
            <li><Link to="/about#mission">Mission</Link></li>
            <li><Link to="/about#vision">Vision</Link></li>
            <li><Link to="/resources/mission-gallery">Mission Gallery</Link></li>
            <li><Link to="/donate">Donate</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li style={{ display: 'flex', gap: 8 }}><MapPin size={16} /> {MAP_QUERY}</li>
            <li style={{ display: 'flex', gap: 8 }}><Phone size={16} /> {PHONE}</li>
            <li style={{ display: 'flex', gap: 8 }}><Mail size={16} /> {EMAIL}</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <strong>Richard Kwanya Snr #Babawa</strong>
        <div style={{ opacity: .7, marginTop: 4 }}>© {new Date().getFullYear()} All rights reserved.</div>
      </div>
    </footer>
  );
}
