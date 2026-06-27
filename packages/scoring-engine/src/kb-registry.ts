export type KbSectionId = 'gbp' | 'onpage' | 'trust' | 'performance' | 'conversion';

export type KbEffort = 'Low' | 'Medium' | 'High';
export type KbImpact = 'Critical' | 'High' | 'Medium';

export type KbKey =
  | 'ANALYTICS_MISSING'
  | 'BOOKING_PATH_MISSING'
  | 'CITY_KW_ABSENT'
  | 'CLICK_TO_CALL_MISSING'
  | 'CLS_HIGH'
  | 'CONTACT_FORM_ONLY_SERVICE'
  | 'DA_LOW'
  | 'DOMAIN_AGE_YOUNG'
  | 'GBP_CATEGORY_PRIMARY'
  | 'GBP_PHOTOS_LOW'
  | 'GBP_POSTS_MISSING'
  | 'GBP_SECONDARY_CATEGORIES'
  | 'H1_MISSING'
  | 'LBS_MISSING'
  | 'META_DESCRIPTION_MISSING'
  | 'MOBILE_PERFORMANCE_LOW'
  | 'QUOTE_FORM_DETECTED'
  | 'REFERRING_DOMAINS_LOW'
  | 'RESPONSIVE_DESIGN_WEAK'
  | 'RESPONSIVE_NO_IMAGES'
  | 'RESPONSIVE_NO_MARKERS'
  | 'RESPONSIVE_NO_MEDIA_QUERIES'
  | 'RESPONSIVE_NO_NAV'
  | 'REVIEW_COUNT_LOW'
  | 'REVIEW_RATING_LOW'
  | 'REVIEW_RESPONSE_RATE_LOW'
  | 'REVIEW_VELOCITY_LOW'
  | 'SERVICE_PAGE_MISSING'
  | 'TITLE_TAG_NO_CITY'
  | 'UNUSED_JS_HIGH'
  | 'VIEWPORT_MISCONFIGURED'
  | 'WEBP_MISSING';

export interface KbEntry {
  title: string;
  why: string;
  how_google: string;
  fix: string[];
  priority: number;
  effort: KbEffort;
  impact: KbImpact;
  section: KbSectionId;
}

export interface KbSectionDefinition {
  id: KbSectionId;
  number: string;
  title: string;
  narrative: string;
  stat: string;
  statLabel: string;
}

export const KB_SECTIONS: KbSectionDefinition[] = [
  {
    id: 'gbp',
    number: 'Section 01 of 05',
    title: 'Google Business Profile Signals',
    narrative:
      'Your GBP is Google\'s primary source of truth for your business. Fixes here have the highest direct impact on Map Pack ranking.',
    stat: '~32%',
    statLabel: 'Pack Ranking Influence',
  },
  {
    id: 'onpage',
    number: 'Section 02 of 05',
    title: 'Website On-Page Signals',
    narrative:
      'These signals tell Google what your pages are about and where you operate. Most are low effort and can be resolved in an afternoon.',
    stat: '~16%',
    statLabel: 'Pack Ranking Influence',
  },
  {
    id: 'trust',
    number: 'Section 03 of 05',
    title: 'Domain Authority & Trust',
    narrative:
      'How much credibility Google has assigned to your website based on who links to you. Lower DA limits how far your rankings can reach — takes time to build.',
    stat: '~13%',
    statLabel: 'Pack Ranking Influence',
  },
  {
    id: 'performance',
    number: 'Section 04 of 05',
    title: 'Website Performance & Technical Signals',
    narrative:
      'Core Web Vitals are a direct Google ranking factor. Slower mobile load also increases bounce rate before visitors reach your booking path.',
    stat: '~9%',
    statLabel: 'Ranking Influence',
  },
  {
    id: 'conversion',
    number: 'Section 05 of 05',
    title: 'Conversion Infrastructure',
    narrative:
      'These signals don\'t affect ranking directly — they affect whether visitors who find you actually convert. Low effort relative to downstream revenue impact.',
    stat: '—',
    statLabel: 'Conversion Impact',
  },
];

export const KB_REGISTRY: Record<KbKey, KbEntry> = {
  GBP_CATEGORY_PRIMARY: {
    title: 'GBP Primary Category',
    why: 'Your GBP primary category is the #1 ranking factor for your Maps listing. It tells Google which searches you\'re eligible to appear in. The wrong category — even a close one — suppresses Map Pack eligibility for your core keywords.',
    how_google:
      'Google matches your primary category against searcher query intent. A more specific and accurate category produces a stronger relevance signal for the keywords you actually want to rank for.',
    fix: [
      'Log into Google Business Profile Manager (business.google.com)',
      'Go to Edit Profile → Business Category',
      'Search for the most specific category that describes your core service',
      'Set it as Primary — avoid overly broad categories',
      'Add 2–3 secondary categories for supporting services',
      'Allow 24–48 hours for Google to process',
    ],
    priority: 1,
    effort: 'Low',
    impact: 'Critical',
    section: 'gbp',
  },
  GBP_SECONDARY_CATEGORIES: {
    title: 'GBP Secondary Categories — Expand Your Ranking Surface',
    why: 'Secondary GBP categories tell Google what else your business offers beyond its primary service. Each additional category makes your listing eligible to rank for a wider set of search queries. The benchmark is 3+ — businesses with fewer secondary categories compete in a narrower eligibility pool.',
    how_google:
      'Google uses your full category set — primary and secondary — to determine which searches your listing qualifies for.',
    fix: [
      'Log into Google Business Profile Manager (business.google.com)',
      'Go to Edit Profile → Business Category',
      'Below your primary category, click Add another category',
      'Add categories for each major service you offer',
      'Target 3+ secondary categories — the benchmark for full credit',
      'Save changes and allow 24–48 hours for Google to process',
    ],
    priority: 2,
    effort: 'Low',
    impact: 'High',
    section: 'gbp',
  },
  GBP_POSTS_MISSING: {
    title: 'GBP Posts — Active Listing Signal',
    why: 'GBP posts signal to Google that your listing is actively managed — a factor that has grown in weight in recent ranking models. Zero posts looks abandoned compared to competitors posting weekly.',
    how_google:
      'Google tracks post recency and frequency as engagement signals. Posts containing your service keywords and city name also reinforce your category relevance signal. Benchmark: at least one post per week.',
    fix: [
      'Log into Google Business Profile Manager',
      'Select Add Update → What\'s New, Offer, or Event',
      'Write 100–300 words — seasonal update, weekend special, local event',
      'Include your primary service keyword and city name naturally',
      'Add a photo and a Call / Book / Learn More button',
      'Set a weekly calendar reminder — 10 minutes, costs nothing',
    ],
    priority: 3,
    effort: 'Low',
    impact: 'High',
    section: 'gbp',
  },
  REVIEW_RESPONSE_RATE_LOW: {
    title: 'Review Response Rate',
    why: 'A low response rate signals an unmanaged business to both Google and every potential customer reading your reviews. Owner responses are a direct engagement signal in GBP\'s prominence scoring.',
    how_google:
      'Google tracks response rate and recency as GBP engagement signals. High response rate indicates an active, customer-focused business — contributing to local prominence scoring.',
    fix: [
      'Set a weekly reminder to check and respond to all new reviews',
      'Respond to every review — positive and negative',
      'Positive: thank by name, reference something specific, invite them back',
      'Negative: acknowledge, offer to resolve offline — never argue publicly',
      'Keep responses under 150 words and genuine — avoid copy-paste templates',
    ],
    priority: 4,
    effort: 'Low',
    impact: 'High',
    section: 'gbp',
  },
  REVIEW_VELOCITY_LOW: {
    title: 'Review Velocity — Recent Review Momentum',
    why: 'Review velocity measures how consistently you earn new reviews over time. A profile with stale review activity signals declining engagement compared to competitors earning reviews every week.',
    how_google:
      'Google weights recency and consistency of review activity as part of the Prominence signal. Steady monthly review flow outperforms sporadic bursts.',
    fix: [
      'Build a post-service review ask into your daily workflow',
      'Text-based requests outperform email — send a direct Google review link',
      'Target at least one new review per week across rolling 30-day windows',
      'Use your booking or POS system to automate review requests where available',
      'Never incentivize reviews — violates Google policy',
    ],
    priority: 5,
    effort: 'Medium',
    impact: 'High',
    section: 'gbp',
  },
  REVIEW_COUNT_LOW: {
    title: 'Review Count — Total Review Volume',
    why: 'Total review volume is one of Google\'s top three local ranking signals. A business with more reviews signals to Google that it has served more customers and is more established in the market.',
    how_google:
      'Google reads total review count directly from your GBP listing as part of the Prominence signal. Unlike velocity, total count compounds — every review you earn stays on your record permanently.',
    fix: [
      'Build a repeatable review ask into your post-service workflow',
      'Text-based requests outperform email by 3–5×',
      'Add your Google review link to receipts, invoices, and follow-up emails',
      'Check if your booking platform has built-in review request automation',
      'Consistent monthly asks compound faster than occasional pushes',
      'Never incentivize reviews — violates Google policy and risks GBP suspension',
    ],
    priority: 6,
    effort: 'Medium',
    impact: 'High',
    section: 'gbp',
  },
  REVIEW_RATING_LOW: {
    title: 'Google Rating Below Market Benchmark',
    why: 'Your star rating is a first-impression trust signal in the Map Pack and Local Finder. Ratings below 4.5★ reduce click-through even when you rank — and can suppress prominence when competitors rate higher.',
    how_google:
      'Google displays rating prominently in local results. Higher-rated businesses earn more clicks at the same rank position, creating a compounding advantage.',
    fix: [
      'Audit recent negative reviews for recurring themes — address root causes first',
      'Respond professionally to every negative review within 48 hours',
      'Fix operational issues before pushing for new reviews',
      'Ask satisfied customers for reviews immediately after positive experiences',
      'Target 4.8★+ over time through consistent service quality',
    ],
    priority: 7,
    effort: 'Medium',
    impact: 'High',
    section: 'gbp',
  },
  GBP_PHOTOS_LOW: {
    title: 'GBP Photos — Visual Trust Signal',
    why: 'Photos are one of the first things searchers evaluate before clicking your listing. Businesses with 15+ quality photos outperform sparse profiles in engagement and conversion.',
    how_google:
      'Google tracks photo count and freshness as GBP completeness signals. Listings with interior, exterior, and service photos rank higher in engagement metrics.',
    fix: [
      'Upload at least 15 photos: exterior, interior, team, and service shots',
      'Add new photos monthly to keep the profile visually current',
      'Use well-lit, high-resolution images — avoid stock photos',
      'Include photos of your most popular services or menu items',
      'Geotag photos when possible to reinforce location relevance',
    ],
    priority: 8,
    effort: 'Low',
    impact: 'Medium',
    section: 'gbp',
  },
  TITLE_TAG_NO_CITY: {
    title: 'Title Tag — Missing City Keyword',
    why: 'The title tag is a confirmed on-page ranking signal and the clickable headline in search results. Without a city keyword, Google has no on-page geographic anchor — your page is topically relevant but locationally ambiguous.',
    how_google:
      'Title tags are each page\'s declared topic. City + service = direct relevance for city-modifier queries.',
    fix: [
      'Homepage: Primary Service | Business Name | City',
      'Service pages: Service in City | Business Name',
      'Keep all title tags 50–60 characters',
      'Lead with the keyword, not your brand name',
      'Preview display length before publishing',
    ],
    priority: 9,
    effort: 'Low',
    impact: 'High',
    section: 'onpage',
  },
  META_DESCRIPTION_MISSING: {
    title: 'Meta Description Missing',
    why: 'Missing meta description means Google writes the preview text for you — pulling random content from the page. A compelling description drives higher click-through rate, which is a confirmed behavioral ranking signal.',
    how_google:
      'Not a direct ranking factor. Impact is via CTR — the preview text below your title in search results.',
    fix: [
      'Write a unique meta description for every page — 140–160 characters',
      'Include: primary service keyword + city + a compelling reason to click',
      'Do not duplicate descriptions across pages',
      'Preview length with a meta description checker before publishing',
    ],
    priority: 10,
    effort: 'Low',
    impact: 'Medium',
    section: 'onpage',
  },
  H1_MISSING: {
    title: 'H1 Tag Missing or Multiple',
    why: 'The H1 is the primary on-page heading that tells Google what the page is about. Missing or duplicate H1 tags dilute topical clarity and weaken relevance for your target keywords.',
    how_google:
      'Google expects exactly one H1 per page as the main topic declaration. Multiple H1s create ambiguity about page focus.',
    fix: [
      'Ensure every page has exactly one H1 tag',
      'Include primary service + city in the H1 where natural',
      'Remove duplicate H1 tags from page builders or templates',
      'Use H2/H3 for subheadings — never promote subheadings to H1',
      'Verify with a browser inspector or SEO audit tool after publishing',
    ],
    priority: 11,
    effort: 'Low',
    impact: 'High',
    section: 'onpage',
  },
  LBS_MISSING: {
    title: 'LocalBusiness Schema Markup',
    why: 'LocalBusiness schema is hidden code that tells Google exactly what your business is, where it is, and when it\'s open — in machine-readable format. Without it, Google infers your business identity from unstructured content.',
    how_google:
      'Google reads JSON-LD schema in the page head. Correct LocalBusiness type with complete NAP data directly feeds local Map Pack eligibility.',
    fix: [
      'Use Google\'s Structured Data Markup Helper and select your business type',
      'Tag: name, address, phone, hours, service type → generate JSON-LD',
      'Paste the generated code into your site\'s head section',
      'Verify at search.google.com/test/rich-results after publishing',
    ],
    priority: 12,
    effort: 'Low',
    impact: 'High',
    section: 'onpage',
  },
  CITY_KW_ABSENT: {
    title: 'City + Keyword Co-occurrence',
    why: 'Service pages that never mention the city provide a weaker geographic relevance signal than those with natural co-occurrence of service + city in body content.',
    how_google:
      'Term frequency of city name and service keyword appearing together in body content. One natural sentence containing both is the target — not keyword stuffing.',
    fix: [
      'Add a 2–4 sentence intro paragraph above the main content on each service page',
      'Naturally include: city name + primary service keyword in the same sentence',
      'One natural mention of city + service is sufficient — do not repeat unnaturally',
      'Also add an H2 subheading containing city + service on each page',
    ],
    priority: 13,
    effort: 'Low',
    impact: 'High',
    section: 'onpage',
  },
  SERVICE_PAGE_MISSING: {
    title: 'Dedicated Service Pages',
    why: 'Google ranks pages, not websites. A dedicated page per service — with its own title tag, H1, and local content — gives Google an individually targetable relevance signal for each service keyword.',
    how_google:
      'Google evaluates each URL independently. A homepage trying to rank for multiple services is diluted across all of them.',
    fix: [
      'Create a dedicated page for each primary service keyword',
      'Each page needs: unique title tag (service + city), H1 (service + city), 200–400 words of original content',
      'Include your city name naturally in the body text',
      'Link between service pages to establish topical hierarchy',
      'Submit updated sitemap to Google Search Console after publishing',
    ],
    priority: 14,
    effort: 'Medium',
    impact: 'High',
    section: 'onpage',
  },
  DA_LOW: {
    title: 'Domain Authority — Backlink Profile',
    why: 'Domain Authority reflects how much trust Google has assigned to your website based on external links. Low DA limits how far your rankings can reach — high-DA competitors consistently outrank equal-GBP businesses in regional searches.',
    how_google:
      'Quantity and quality of unique domains linking to your site. Each new link from a high-authority local source has an outsized effect at low DA levels.',
    fix: [
      'Directory citations: Yelp, TripAdvisor, industry directories — each adds a referring domain',
      'Local press: pitch your story to local news outlets or industry publications',
      'Supplier/partner links: ask vendors and partners to link to your site',
      'Chamber of commerce membership — typically includes a directory link',
      'Avoid paid link schemes — Google penalties outweigh any short-term benefit',
    ],
    priority: 15,
    effort: 'High',
    impact: 'High',
    section: 'trust',
  },
  REFERRING_DOMAINS_LOW: {
    title: 'Referring Domains — Link Diversity',
    why: 'Referring domain count measures how many unique websites link to you. A low count limits domain trust even when individual links exist — diversity matters as much as volume.',
    how_google:
      'Google evaluates the breadth of your backlink profile. Many links from one domain count less than links from many unique domains.',
    fix: [
      'Claim and complete profiles on major directories (Yelp, BBB, industry-specific)',
      'Sponsor or participate in local events that generate press mentions',
      'Partner with complementary local businesses for cross-linking',
      'Publish locally relevant content that earns organic links over time',
      'Monitor new links monthly with Moz or Google Search Console',
    ],
    priority: 16,
    effort: 'High',
    impact: 'High',
    section: 'trust',
  },
  DOMAIN_AGE_YOUNG: {
    title: 'Domain Age — Establishment Signal',
    why: 'Younger domains carry less inherent trust than established ones. Google uses domain age as a longevity signal — newer sites need stronger content and link profiles to compete regionally.',
    how_google:
      'Domain registration date is a minor but persistent trust signal. It cannot be changed — compensate with stronger GBP, content, and link-building.',
    fix: [
      'Focus on GBP completeness and review velocity — these outweigh domain age locally',
      'Build consistent local citations to accelerate trust signals',
      'Publish regular, high-quality local content to demonstrate ongoing investment',
      'Avoid domain changes — migrating to a new domain resets age entirely',
      'Track DA monthly — growth trajectory matters more than absolute age',
    ],
    priority: 17,
    effort: 'Medium',
    impact: 'Medium',
    section: 'trust',
  },
  MOBILE_PERFORMANCE_LOW: {
    title: 'Website Performance — PageSpeed Score',
    why: 'Core Web Vitals are a direct Google ranking factor. A low PageSpeed score increases mobile bounce rate — visitors who experience slow loads leave before reaching your booking path.',
    how_google:
      'Google measures LCP, TBT, and CLS as Core Web Vitals. These are scored in PageSpeed Insights and feed directly into rankings.',
    fix: [
      'Run PageSpeed Insights (pagespeed.web.dev) for your homepage and key service pages',
      'Address the top 3 flagged issues — they typically account for 80% of the score gap',
      'Common fixes: compress images, remove unused JavaScript, enable browser caching',
      'Test on a real mobile device — not just desktop — after each change',
    ],
    priority: 18,
    effort: 'Medium',
    impact: 'High',
    section: 'performance',
  },
  WEBP_MISSING: {
    title: 'WebP Image Format',
    why: 'WebP images are 25–35% smaller than JPEG or PNG at identical visual quality. Smaller image payloads mean faster page loads — image weight is typically the largest performance drag for local business sites.',
    how_google:
      'Indirectly via PageSpeed Insights and Core Web Vitals. Smaller image payloads improve LCP — a direct ranking factor.',
    fix: [
      'Free bulk conversion: Squoosh (squoosh.app) — drag and drop, no software needed',
      'Convert all existing site images to WebP before re-uploading',
      'All new images: save as WebP before uploading',
      'Many website platforms have an asset optimization setting — enable it',
    ],
    priority: 19,
    effort: 'Low',
    impact: 'Medium',
    section: 'performance',
  },
  UNUSED_JS_HIGH: {
    title: 'Unused JavaScript',
    why: 'Unused JavaScript is downloaded and parsed on every page load with zero benefit — adding to load time and Total Blocking Time.',
    how_google:
      'PageSpeed Insights flags unused JS under Reduce unused JavaScript. TBT reflects how long the browser is blocked processing JS.',
    fix: [
      'Review PageSpeed Insights for the specific scripts flagged',
      'Remove any third-party scripts, plugins, or integrations no longer in use',
      'Defer non-critical JS using async/defer attributes where possible',
      'If using a website builder, disable any unused built-in features that inject scripts',
    ],
    priority: 20,
    effort: 'Medium',
    impact: 'Medium',
    section: 'performance',
  },
  CLS_HIGH: {
    title: 'Layout Shift (CLS)',
    why: 'Cumulative Layout Shift measures how much page elements move during load. High CLS means content jumps around as the page loads — a poor user experience that Google factors directly into rankings.',
    how_google:
      'CLS is a Core Web Vital with a direct ranking impact. Google benchmarks: ≤0.05 Good, 0.05–0.10 Needs Improvement, >0.10 Poor.',
    fix: [
      'Set explicit width and height attributes on all images and video embeds',
      'Avoid inserting content above existing content after page load',
      'Use font-display: swap for web fonts to prevent layout shifts during font loading',
      'Test with PageSpeed Insights or Chrome DevTools → Rendering → Layout Shift Regions',
    ],
    priority: 21,
    effort: 'Medium',
    impact: 'Medium',
    section: 'performance',
  },
  VIEWPORT_MISCONFIGURED: {
    title: 'Viewport Meta Tag Misconfigured',
    why: 'The viewport meta tag tells mobile browsers how to scale your page. A missing or misconfigured viewport breaks mobile layout and triggers Google\'s mobile-unfriendly classification.',
    how_google:
      'Google uses viewport configuration as a mobile usability signal. width=device-width is required for responsive rendering.',
    fix: [
      'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to your page head',
      'Remove user-scalable=no unless accessibility requires it',
      'Test on multiple mobile devices after fixing',
      'Verify with Google Mobile-Friendly Test',
    ],
    priority: 22,
    effort: 'Low',
    impact: 'High',
    section: 'performance',
  },
  RESPONSIVE_NO_MEDIA_QUERIES: {
    title: 'Responsive CSS — No Media Queries',
    why: 'Media queries adapt layout to different screen sizes. Without them, your site renders as a shrunken desktop page on mobile — unusable for most local searchers.',
    how_google:
      'Mobile usability is a ranking factor. Sites without responsive CSS fail mobile-friendly evaluation.',
    fix: [
      'Use a responsive theme or template from your website platform',
      'If custom CSS, add @media queries for common breakpoints (768px, 1024px)',
      'Test all key pages on a phone — not just the homepage',
      'Consider migrating to a mobile-first theme if fixes are extensive',
    ],
    priority: 23,
    effort: 'Medium',
    impact: 'High',
    section: 'performance',
  },
  RESPONSIVE_NO_MARKERS: {
    title: 'Responsive Design Markers Missing',
    why: 'Responsive design markers (flexbox, grid, relative units) indicate a layout built for multiple screen sizes. Their absence suggests a fixed-width desktop design.',
    how_google:
      'Google evaluates whether content reflows appropriately on mobile viewports as part of mobile usability scoring.',
    fix: [
      'Replace fixed pixel widths with percentage or rem units',
      'Use flexbox or CSS grid for main layout containers',
      'Ensure navigation collapses to a mobile menu on small screens',
      'Test with Chrome DevTools device emulation across common phone sizes',
    ],
    priority: 24,
    effort: 'Medium',
    impact: 'Medium',
    section: 'performance',
  },
  RESPONSIVE_NO_IMAGES: {
    title: 'Responsive Images Missing',
    why: 'Images without responsive attributes load at full desktop resolution on mobile, slowing page load and breaking layout on small screens.',
    how_google:
      'Oversized images hurt LCP on mobile — a Core Web Vital that directly affects rankings.',
    fix: [
      'Add srcset and sizes attributes to image tags for multiple resolutions',
      'Use max-width: 100% on images in CSS',
      'Consider lazy loading for below-the-fold images',
      'Convert large hero images to WebP at mobile-appropriate dimensions',
    ],
    priority: 25,
    effort: 'Low',
    impact: 'Medium',
    section: 'performance',
  },
  RESPONSIVE_NO_NAV: {
    title: 'Mobile Navigation Missing',
    why: 'Desktop navigation menus that don\'t adapt to mobile create unusable experiences — visitors cannot find booking paths or contact info on a phone.',
    how_google:
      'Mobile usability evaluation checks whether navigation is accessible and tappable on small screens.',
    fix: [
      'Implement a hamburger menu or collapsible nav for mobile viewports',
      'Ensure phone number and primary CTA are visible without scrolling on mobile',
      'Test tap targets — buttons should be at least 44×44 pixels',
      'Verify navigation works on iOS Safari and Android Chrome',
    ],
    priority: 26,
    effort: 'Medium',
    impact: 'Medium',
    section: 'performance',
  },
  RESPONSIVE_DESIGN_WEAK: {
    title: 'Overall Responsive Design Weak',
    why: 'Multiple responsive signals are missing or weak, indicating the site was not built mobile-first. Most local searches happen on mobile — a weak mobile experience loses conversions.',
    how_google:
      'Google\'s mobile-first indexing means the mobile version of your site is the primary version evaluated for ranking.',
    fix: [
      'Audit all pages on a real mobile device — not just the homepage',
      'Prioritize viewport fix, responsive CSS, and mobile navigation',
      'Consider switching to a modern responsive theme if on a website builder',
      'Re-test PageSpeed and Mobile-Friendly after each round of fixes',
    ],
    priority: 27,
    effort: 'Medium',
    impact: 'High',
    section: 'performance',
  },
  BOOKING_PATH_MISSING: {
    title: 'Online Booking Path Missing',
    why: 'Visitors who cannot book or schedule online leave for competitors with frictionless paths. A missing booking path is the highest-impact conversion gap for service businesses.',
    how_google:
      'Not a direct ranking signal, but booking engagement from GBP and website feeds behavioral signals that reinforce prominence.',
    fix: [
      'Add a named booking platform (Toast, OpenTable, Mindbody, etc.) or a clear Book Now button',
      'Place the booking CTA above the fold on your homepage',
      'Link the same booking path from your GBP profile',
      'Test the full booking flow on mobile — most local bookings happen on phones',
      'If no platform fits, add a prominent contact/quote form as a fallback',
    ],
    priority: 28,
    effort: 'Medium',
    impact: 'Critical',
    section: 'conversion',
  },
  QUOTE_FORM_DETECTED: {
    title: 'Quote Form Instead of Direct Booking',
    why: 'A quote form adds friction compared to instant booking. For businesses where real-time scheduling is standard, a quote-only path loses conversions to competitors with one-click booking.',
    how_google:
      'Not a ranking signal. Impact is on conversion rate — fewer completed bookings mean lower ROI on the traffic your SEO generates.',
    fix: [
      'Evaluate whether your industry expects instant booking (restaurants, salons, fitness)',
      'If yes, integrate a named booking platform and promote it above the quote form',
      'Keep the quote form as a secondary option for complex/custom requests',
      'A/B test booking vs quote conversion rates once analytics is installed',
    ],
    priority: 29,
    effort: 'Medium',
    impact: 'Medium',
    section: 'conversion',
  },
  CONTACT_FORM_ONLY_SERVICE: {
    title: 'Contact Form Only — No Booking Path',
    why: 'A generic contact form is the weakest conversion path for service businesses. It requires the visitor to wait for a response instead of self-serving immediately.',
    how_google:
      'Not a ranking signal. Contact-only paths convert at a fraction of named booking platforms.',
    fix: [
      'Identify the booking platform standard for your vertical',
      'Add a Book Now or Schedule button linking to that platform',
      'Keep the contact form as a secondary option',
      'Ensure the booking CTA is visible above the fold on mobile',
    ],
    priority: 30,
    effort: 'Medium',
    impact: 'High',
    section: 'conversion',
  },
  CLICK_TO_CALL_MISSING: {
    title: 'Click-to-Call — Phone Not Linked',
    why: 'On mobile, a phone number that isn\'t a clickable link requires the user to manually copy and dial it. Adding click-to-call increases mobile phone conversions by 30–50%.',
    how_google:
      'Google tracks phone call engagement from GBP and website as a behavioral signal.',
    fix: [
      'This scan checks your homepage only — verify click-to-call is prominent there',
      'Your phone number must be a tappable tel: link in the header or above the fold',
      'Change every phone number to a tel: link: tel:+1XXXXXXXXXX',
      'Test on mobile: the number should launch your dialer when tapped',
    ],
    priority: 31,
    effort: 'Low',
    impact: 'High',
    section: 'conversion',
  },
  ANALYTICS_MISSING: {
    title: 'Google Analytics 4 (GA4) + Tag Manager',
    why: 'Without analytics, every fix in this report produces results you cannot measure. GA4 is free. Not having it means running your online presence entirely blind.',
    how_google:
      'Not a direct ranking signal. Enables measurement of every other signal. Once installed with conversion event tracking, you can quantify the ROI of every change.',
    fix: [
      'Create a free GA4 property at analytics.google.com',
      'Install Google Tag Manager — one code snippet in the site head',
      'Connect GA4 through GTM using your GA4 Measurement ID',
      'Set up conversion events: booking click, phone click, contact form submit',
      'Verify data is flowing in GA4 Realtime view within 24 hours of installation',
    ],
    priority: 32,
    effort: 'Low',
    impact: 'High',
    section: 'conversion',
  },
};

export function isKbKey(value: string): value is KbKey {
  return value in KB_REGISTRY;
}

export function getKbEntry(key: string): KbEntry | undefined {
  return isKbKey(key) ? KB_REGISTRY[key] : undefined;
}
