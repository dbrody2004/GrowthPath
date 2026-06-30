import './Nav.css';

const links = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
];

export function Nav() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a href="#" className="nav-logo">
          Growth<span>Path</span>
        </a>
        <nav className="nav-links" aria-label="Main">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <a href="#cta" className="btn btn-secondary btn-nav">
            Schedule Demo
          </a>
          <a href="#cta" className="btn btn-primary btn-nav">
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}
