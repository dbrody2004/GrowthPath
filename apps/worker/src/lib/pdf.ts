import type { WorkerEnv } from '@growthpath/config';

export async function renderScanPdf(
  env: WorkerEnv,
  scanId: string,
  exportToken: string,
): Promise<Buffer> {
  const { chromium } = await import('playwright');
  const printUrl = `${env.UI_ORIGIN}/export/scans/${scanId}/print?token=${encodeURIComponent(exportToken)}&autoprint=0`;

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const response = await page.goto(printUrl, { waitUntil: 'networkidle', timeout: 120_000 });
    if (!response?.ok()) {
      throw new Error(`PDF print page failed to load: HTTP ${response?.status() ?? 'unknown'}`);
    }
    await page.waitForSelector('.shareable-report', { timeout: 60_000 });
    const errorBanner = await page.$('.banner-error');
    if (errorBanner) {
      const errorText = (await errorBanner.textContent())?.trim();
      throw new Error(`PDF print page error: ${errorText || 'Unknown error'}`);
    }
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    });
    const buffer = Buffer.from(pdf);
    if (buffer.length <= 1000 || buffer.subarray(0, 4).toString() !== '%PDF') {
      throw new Error(`Invalid PDF output (${buffer.length} bytes)`);
    }
    return buffer;
  } finally {
    await browser.close();
  }
}
