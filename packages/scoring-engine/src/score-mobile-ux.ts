import type { Finding, HtmlData, PsiAccessibility, SignalPts } from '@growthpath/shared';

export function scoreMobileUx(
  html: HtmlData,
  psiAccessibility: PsiAccessibility | null = null,
): [number, Finding[], SignalPts] {
  let points = 0;
  const findings: Finding[] = [];
  const a11y = psiAccessibility ?? {};

  const vpExists = html.viewport_exists ?? html.viewport ?? false;
  const vpWidthDev = html.viewport_has_width_device ?? false;
  const vpBlocksZoom = html.viewport_blocks_zoom ?? false;
  const respScore = html.responsive_score ?? 0;

  let vpPts = 0;
  if (!vpExists) {
    findings.push({
      text: "Viewport not configured — your site is not set up to render correctly on mobile screens. This is the foundational mobile fix. Add <meta name='viewport' content='width=device-width, initial-scale=1'> to your site's <head> section.",
      severity: 'critical',
      kb_key: 'VIEWPORT_MISCONFIGURED',
    });
  } else if (vpWidthDev && !vpBlocksZoom) {
    vpPts = 40;
  } else if (vpWidthDev && vpBlocksZoom) {
    vpPts = 35;
    findings.push({
      text: "Your site's viewport disables pinch-to-zoom on mobile. Google flags this in mobile accessibility audits. Ask your web developer to remove user-scalable=no from the viewport meta tag — a five-minute fix.",
      severity: 'warning',
      kb_key: 'VIEWPORT_MISCONFIGURED',
    });
  } else if (respScore >= 2) {
    vpPts = 20;
    findings.push({
      text: "Your viewport configuration is non-standard — it doesn't declare a device-width setting. Your site shows responsive signals but this misconfiguration may affect how Google evaluates your mobile setup. A developer can correct the viewport meta tag in under five minutes.",
      severity: 'warning',
      kb_key: 'VIEWPORT_MISCONFIGURED',
    });
  } else {
    findings.push({
      text: "Viewport not properly configured — your site is missing the device-width declaration that tells mobile browsers how to render the page. Add <meta name='viewport' content='width=device-width, initial-scale=1'> to your site's <head> section.",
      severity: 'critical',
      kb_key: 'VIEWPORT_MISCONFIGURED',
    });
  }
  points += vpPts;

  const respPtsMap: Record<number, number> = { 4: 35, 3: 26, 2: 18, 1: 9, 0: 0 };
  const respPts = respPtsMap[respScore] ?? 0;
  points += respPts;

  const hasMediaQueries = html.has_media_queries ?? false;
  const hasResponsiveMarkers = html.has_responsive_markers ?? false;
  const hasResponsiveImages = html.has_responsive_images ?? false;
  const hasMobileNav = html.has_mobile_nav ?? false;

  if (respScore !== 4) {
    if (!hasMediaQueries) {
      findings.push({
        text: 'No CSS media queries detected — the code that adapts your layout for different screen sizes may be missing or loaded externally. Verify your site stacks and resizes correctly on mobile by checking it in Chrome DevTools (F12 → device icon → select a phone).',
        severity: respScore === 3 ? 'warning' : 'critical',
        kb_key: 'RESPONSIVE_NO_MEDIA_QUERIES',
      });
    }
    if (!hasResponsiveMarkers) {
      findings.push({
        text: "No responsive framework detected. If your site wasn't built with a mobile-first framework, verify the layout adapts correctly on common phone screen sizes (375px, 390px, 414px wide).",
        severity: respScore === 3 ? 'warning' : 'critical',
        kb_key: 'RESPONSIVE_NO_MARKERS',
      });
    }
    if (!hasResponsiveImages) {
      findings.push({
        text: "Images aren't configured to scale for different screen sizes (no srcset detected). This can cause oversized images on mobile — slower loads and layout issues for smartphone visitors.",
        severity: respScore === 3 ? 'warning' : 'critical',
        kb_key: 'RESPONSIVE_NO_IMAGES',
      });
    }
    if (!hasMobileNav) {
      findings.push({
        text: 'No mobile navigation detected. Confirm your menu is accessible and usable on small screens — a hamburger or collapsible nav is standard for mobile visitors.',
        severity: respScore === 3 ? 'warning' : 'critical',
        kb_key: 'RESPONSIVE_NO_NAV',
      });
    }
    if (respScore <= 2) {
      findings.push({
        text: 'A responsive mobile experience is the single highest-leverage conversion factor for smartphone visitors — over 70% of local searches happen on mobile. Visitors who encounter a broken or difficult layout leave immediately. Fixing responsive design gaps should be prioritized ahead of any other website improvement.',
        severity: 'critical',
        kb_key: 'RESPONSIVE_DESIGN_WEAK',
      });
    }
  }

  const targetScore = a11y.psi_a11y_target_size;
  let targetPts = 0;
  if (targetScore == null) {
    targetPts = 0;
    findings.push({
      text: 'PSI tap target audit unavailable — tap target score not measured.',
      severity: 'warning',
    });
  } else if (targetScore === 1.0) {
    points += 15;
    targetPts = 15;
  } else if (targetScore === 0.0) {
    findings.push({
      text: 'Tap targets too small — buttons and links are below the recommended 48×48px minimum. On mobile, small tap targets cause mis-taps and frustrated visitors. Increase button padding and spacing between clickable elements.',
      severity: 'critical',
    });
  }

  const contrastScore = a11y.psi_a11y_color_contrast;
  let contrastPts = 0;
  if (contrastScore === 1.0) {
    points += 10;
    contrastPts = 10;
  } else if (contrastScore === 0.0) {
    findings.push({
      text: "Color contrast fails accessibility standards — text is not legible enough against its background. Low contrast is harder to read on mobile screens in sunlight. Use WebAIM's contrast checker (webaim.org/resources/contrastchecker) to identify and fix failing text/background combinations.",
      severity: 'warning',
    });
  }

  const uxSignalPts: SignalPts = {
    viewport: { earned: vpPts, max: 40 },
    responsive: { earned: respPts, max: 35 },
    tap_targets: { earned: targetPts, max: 15 },
    color_contrast: { earned: contrastPts, max: 10 },
  };

  return [Math.min(100, points), findings, uxSignalPts];
}
