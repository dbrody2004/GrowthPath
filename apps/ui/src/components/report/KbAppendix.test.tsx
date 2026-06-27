import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KbAppendix } from './KbAppendix.js';
import { sampleReportFixture } from '../../test/report.fixture.js';

describe('KbAppendix', () => {
  it('renders section bands and remediation cards', () => {
    render(<KbAppendix sections={sampleReportFixture.appendix.remediation} />);

    expect(screen.getByText('SEO Knowledge Appendix')).toBeInTheDocument();
    expect(screen.getByText('Google Business Profile Signals')).toBeInTheDocument();
    expect(screen.getByText('Review Response Rate')).toBeInTheDocument();
    expect(screen.getByText('REVIEW_RESPONSE_RATE_LOW')).toBeInTheDocument();
    expect(screen.getAllByText('Why It Matters').length).toBeGreaterThan(0);
    expect(screen.getByText(/Respond to every review/)).toBeInTheDocument();
  });

  it('returns null when no sections', () => {
    const { container } = render(<KbAppendix sections={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
