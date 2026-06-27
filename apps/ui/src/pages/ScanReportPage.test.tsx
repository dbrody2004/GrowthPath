import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ScoreHeader } from '../components/report/ScoreHeader.js';
import { ScanReportPage } from '../pages/ScanReportPage.js';
import { sampleAuditFixture } from '../test/audit.fixture.js';
import { sampleScoresFixture } from '../test/scores.fixture.js';

vi.mock('../lib/scans.js', () => ({
  getScan: vi.fn(),
  getScanResult: vi.fn(),
  retryScan: vi.fn(),
  retryScanSources: vi.fn(),
}));

import { getScan, getScanResult } from '../lib/scans.js';

describe('ScoreHeader', () => {
  it('renders P1, P2, and profile', () => {
    render(<ScoreHeader scores={sampleScoresFixture} />);

    expect(screen.getByText('The Invisible Closer')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('46')).toBeInTheDocument();
    expect(screen.getAllByText('Needs Work')).toHaveLength(2);
  });
});

describe('ScanReportPage', () => {
  it('renders report content when scan is complete', async () => {
    vi.mocked(getScan).mockResolvedValue({
      id: 'scan-1',
      businessId: 'biz-1',
      scanTier: 'basic',
      status: 'complete',
      partialReasons: [],
      collectionStatus: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    vi.mocked(getScanResult).mockResolvedValue({
      scanId: 'scan-1',
      businessId: 'biz-1',
      p1: 42,
      p2: 46,
      profile: 'The Invisible Closer',
      auditData: sampleAuditFixture,
      scores: sampleScoresFixture,
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    render(
      <MemoryRouter initialEntries={['/scans/scan-1']}>
        <Routes>
          <Route path="/scans/:id" element={<ScanReportPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('The Invisible Closer')).toBeInTheDocument();
    expect(screen.getByText('Not visible in the local 3-pack.')).toBeInTheDocument();
    expect(screen.getByText('Improve map pack visibility for core keywords.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Competitors' }));
    expect(screen.getAllByText('Goldfield Trading Post').length).toBeGreaterThanOrEqual(1);
  });
});
