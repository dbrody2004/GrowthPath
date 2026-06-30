import { FormEvent, useState } from 'react';
import './Hero.css';

const trustedBy = [
  'Metro Dental Group',
  'Summit HVAC',
  'Coastal Legal',
  'Peak Fitness',
  'Harbor Auto',
];

export function Hero() {
  const [query, setQuery] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const el = document.getElementById('cta');
    el?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="hero section-dark">
      <div className="hero-bg" aria-hidden="true" />
      <div className="container hero-inner">
        <p className="eyebrow">Local SEO Intelligence</p>
        <h1 className="hero-title">
          Boost local visibility &amp; outrank competitors
        </h1>
        <p className="hero-subtitle">
          GrowthPath scans your business across Google, citations, reviews, and
          competitors — then delivers scored insights and prioritized action plans
          so you know exactly what to fix next.
        </p>

        <form className="hero-search" onSubmit={handleSubmit}>
          <div className="hero-search-inner">
            <input
              type="text"
              className="hero-search-input"
              placeholder="Enter a business name or website to scan…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Business name or website"
            />
            <button type="submit" className="btn btn-primary btn-lg hero-search-btn">
              Analyze
            </button>
          </div>
          <p className="hero-search-note">
            Try a free preview — no account required to explore sample reports.
          </p>
        </form>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">40+</span>
            <span className="hero-stat-label">SEO signals scored</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">12</span>
            <span className="hero-stat-label">Competitor benchmarks</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">100%</span>
            <span className="hero-stat-label">Actionable priorities</span>
          </div>
        </div>

        <div className="trusted-by">
          <p className="trusted-by-label">Built for local businesses like</p>
          <div className="trusted-by-logos">
            {trustedBy.map((name) => (
              <span key={name} className="trusted-by-logo">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
