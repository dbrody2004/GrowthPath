import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScanCollectionStatusPanel } from './ScanCollectionStatusPanel.js';

describe('ScanCollectionStatusPanel', () => {
  it('renders source rows and partial reasons', () => {
    render(
      <ScanCollectionStatusPanel
        partialReasons={['PageSpeed data unavailable']}
        sources={[
          {
            sourceId: 'pagespeed',
            label: 'PageSpeed Insights',
            status: 'missing',
            detail: 'PageSpeed data unavailable',
            durationMs: 1200,
          },
          {
            sourceId: 'gbp',
            label: 'Google Business Profile',
            status: 'ok',
            detail: 'Profile loaded',
            durationMs: 400,
          },
        ]}
      />,
    );

    expect(screen.getByText('Data collection')).toBeInTheDocument();
    expect(screen.getAllByText('PageSpeed data unavailable').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('PageSpeed Insights')).toBeInTheDocument();
    expect(screen.getByText('1200ms')).toBeInTheDocument();
  });
});
