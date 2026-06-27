import type { Finding, PageSpeedData, SignalPts } from '@growthpath/shared';

export function scoreMobilePerformance(
  psi: PageSpeedData,
): [number, Finding[], string, SignalPts] {
  let points = 0;
  const findings: Finding[] = [];

  if (psi.performance === null || psi.performance === undefined) {
    return [
      0,
      [
        {
          text: 'PageSpeed performance data unavailable for this site.',
          severity: 'warning',
        },
      ],
      'Unavailable',
      {},
    ];
  }

  const desk = psi.performance ?? 0;
  const ttfb = psi.ttfb_ms;
  const cls = psi.cls ?? null;
  const tbt = psi.tbt_ms ?? null;
  const unusedJs = psi.unused_js_kib ?? 0;
  const unusedCss = psi.unused_css_kib ?? 0;

  if (desk >= 90) points += 30;
  else if (desk >= 75) points += 22;
  else if (desk >= 60) points += 14;
  else if (desk >= 40) points += 7;

  findings.push({
    text:
      `Desktop PSI: ${desk}/100 — ` +
      (desk >= 75
        ? 'strong site performance.'
        : desk >= 60
          ? 'moderate performance — opportunities to improve load speed.'
          : 'performance needs attention — visitors may experience slow loads.'),
    severity: desk >= 75 ? 'good' : desk >= 60 ? 'warning' : 'critical',
    ...(desk < 75 ? { kb_key: 'MOBILE_PERFORMANCE_LOW' } : {}),
  });

  if (ttfb !== null && ttfb !== undefined) {
    if (ttfb <= 200) points += 20;
    else if (ttfb <= 600) points += 14;
    else if (ttfb <= 1500) points += 6;

    if (ttfb <= 200) {
      findings.push({ text: `Server response time: ${ttfb}ms — excellent hosting speed.`, severity: 'good' });
    } else if (ttfb <= 600) {
      findings.push({
        text: `Server response time: ${ttfb}ms — acceptable, but upgrade hosting or enable CDN for improvement.`,
        severity: 'warning',
      });
    } else {
      findings.push({
        text: `Server response time: ${ttfb}ms — slow server. Upgrading hosting plan or enabling a CDN is the highest-leverage fix.`,
        severity: 'critical',
      });
    }
  } else {
    findings.push({ text: 'Server response time: not available for this site.', severity: 'warning' });
  }

  if (cls !== null && cls !== undefined) {
    if (cls <= 0.05) points += 25;
    else if (cls <= 0.1) points += 18;
    else if (cls <= 0.25) points += 8;

    if (cls > 0.1) {
      findings.push({
        text: `Layout shift (CLS): ${Math.round(cls * 1000) / 1000} — page elements move during load. Common causes: images without set dimensions, late-loading fonts, injected banners. Benchmark: ≤0.05.`,
        severity: 'critical',
        kb_key: 'CLS_HIGH',
      });
    } else if (cls > 0.05) {
      findings.push({
        text: `Layout shift (CLS): ${Math.round(cls * 1000) / 1000} — minor shift detected. Benchmark: ≤0.05.`,
        severity: 'warning',
        kb_key: 'CLS_HIGH',
      });
    }
  }

  if (tbt !== null && tbt !== undefined) {
    if (tbt <= 200) points += 15;
    else if (tbt <= 400) points += 10;
    else if (tbt <= 600) points += 5;

    if (tbt > 400) {
      findings.push({
        text: `Interactivity (TBT): ${tbt}ms — page slow to respond to taps and clicks. Usually caused by large JavaScript bundles. Benchmark: ≤200ms.`,
        severity: 'critical',
      });
    }
  }

  const totalBloat = unusedJs + unusedCss;
  if (totalBloat === 0) points += 5;
  else if (totalBloat <= 100) points += 3;
  else if (totalBloat <= 300) points += 1;

  if (unusedJs > 100) {
    findings.push({
      text: `Unused JavaScript: ${unusedJs} KiB — code loaded but never used. Each KiB adds page weight for every visitor. Defer or remove unused scripts.`,
      severity: 'warning',
      kb_key: 'UNUSED_JS_HIGH',
    });
  }
  if (unusedCss > 50) {
    findings.push({
      text: `Unused CSS: ${unusedCss} KiB — stylesheet bloat contributing to load overhead.`,
      severity: 'warning',
    });
  }

  const deskE = desk >= 90 ? 30 : desk >= 75 ? 22 : desk >= 60 ? 14 : desk >= 40 ? 7 : 0;
  const ttfbE =
    ttfb !== null && ttfb !== undefined
      ? ttfb <= 200
        ? 20
        : ttfb <= 600
          ? 14
          : ttfb <= 1500
            ? 6
            : 0
      : 0;
  const clsE = cls !== null && cls !== undefined ? (cls <= 0.05 ? 25 : cls <= 0.1 ? 18 : cls <= 0.25 ? 8 : 0) : 0;
  const tbtE = tbt !== null && tbt !== undefined ? (tbt <= 200 ? 15 : tbt <= 400 ? 10 : tbt <= 600 ? 5 : 0) : 0;
  const bloatE = totalBloat === 0 ? 5 : totalBloat <= 100 ? 3 : totalBloat <= 300 ? 1 : 0;

  const webpDetected =
    (psi.webp_by_extension ?? false) || (psi.webp_by_picture ?? false) || (psi.webp_by_css ?? false);
  if (webpDetected) {
    points += 5;
  } else {
    findings.push({
      text: 'No WebP images detected. Converting JPEG/PNG to WebP reduces image payload 25–35% at identical quality — direct load time improvement for all visitors.',
      severity: 'warning',
      kb_key: 'WEBP_MISSING',
    });
  }
  const webpE = webpDetected ? 5 : 0;

  const perfSignalPts: SignalPts = {
    desktop_psi: { earned: deskE, max: 30 },
    ttfb: { earned: ttfbE, max: 20 },
    cls: { earned: clsE, max: 25 },
    tbt: { earned: tbtE, max: 15 },
    unused_code: { earned: bloatE, max: 5 },
    webp_images: { earned: webpE, max: 5 },
  };

  return [Math.min(100, points), findings, 'Desktop PSI + TTFB', perfSignalPts];
}
