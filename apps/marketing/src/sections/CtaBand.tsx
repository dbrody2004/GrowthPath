import './CtaBand.css';

export function CtaBand() {
  return (
    <section id="cta" className="cta-band section-dark">
      <div className="cta-bg" aria-hidden="true" />
      <div className="container cta-inner">
        <h2 className="cta-title">Ready to see where you stand?</h2>
        <p className="cta-subtitle">
          Run your first local SEO scan and get a prioritized action plan — no
          credit card required.
        </p>
        <div className="cta-actions">
          <a href="mailto:hello@davebrody.tech" className="btn btn-primary btn-lg">
            Get Started Free
          </a>
          <a href="mailto:hello@davebrody.tech?subject=GrowthPath Demo" className="btn btn-secondary btn-lg">
            Schedule a Demo
          </a>
        </div>
      </div>
    </section>
  );
}
