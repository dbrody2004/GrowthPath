import './Footer.css';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">
            Growth<span>Path</span>
          </span>
          <p className="footer-tagline">
            Local SEO intelligence for local businesses.
          </p>
        </div>
        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#cta">Get Started</a>
        </div>
        <p className="footer-copy">
          &copy; {year} GrowthPath. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
