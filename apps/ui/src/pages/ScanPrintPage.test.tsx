import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ScanPrintPage } from './ScanPrintPage.js';
import { sampleAuditFixture } from '../test/audit.fixture.js';
import { sampleScoresFixture } from '../test/scores.fixture.js';

vi.mock('../lib/scans.js', () => ({
  getScanResult: vi.fn(),
}));

vi.mock('../lib/export.js', () => ({
  getScanExportData: vi.fn(),
  requestPdfExport: vi.fn(),
}));

import { getScanResult } from '../lib/scans.js';

describe('ScanPrintPage', () => {
  it('renders printable report with toolbar for authenticated print route', async () => {
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
      <MemoryRouter initialEntries={['/scans/scan-1/print']}>
        <Routes>
          <Route path="/scans/:id/print" element={<ScanPrintPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Print / Save as PDF')).toBeInTheDocument();
    expect(screen.getByText('GrowthPath Local Visibility Report')).toBeInTheDocument();
  });
});
