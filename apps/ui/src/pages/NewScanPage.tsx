import { FormEvent, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { scanIntakeSchema } from '@growthpath/shared';
import { createScan } from '../lib/scans.js';
import {
  BIZ_TIERS,
  buildScanIntake,
  getBusinessType,
  getVerticalLabel,
  listBusinessTypes,
  type BizTier,
  type IntakeFormState,
  type VerticalKey,
  VERTICAL_KEYS,
} from '../lib/intakeLibrary.js';

const SCAN_KEYWORD_LIMIT = 3;

const TIER_RADIUS: Record<BizTier, string> = {
  Basic: '10mi',
  Advanced: '20mi',
  Premium: '20mi',
};

const DEFAULT_STATE: IntakeFormState = {
  bizName: '',
  streetAddress: '',
  cityStateZip: '',
  bizDomain: '',
  gbpPrimaryCategory: '',
  vertical: 'food_beverage',
  bizTypeKey: null,
  bizSubtype: null,
  bizTier: 'Advanced',
  scanKeywords: [],
};

function RequiredMark() {
  return (
    <span className="intake-required" aria-hidden="true">
      *
    </span>
  );
}

function StepProgress({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: 'Business Info' },
    { num: 2, label: 'Scan Keywords' },
    { num: 3, label: 'Summary' },
  ] as const;

  return (
    <div className="intake-progress" aria-label="Scan setup progress">
      {steps.map((item, index) => (
        <div key={item.num} className="intake-progress__segment">
          <div
            className={[
              'intake-progress__step',
              step === item.num ? 'intake-progress__step--active' : '',
              step > item.num ? 'intake-progress__step--done' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={step === item.num ? 'step' : undefined}
          >
            <span className="intake-progress__num">{item.num}</span>
            <span className="intake-progress__label">{item.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={[
                'intake-progress__connector',
                step > item.num ? 'intake-progress__connector--done' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function NewScanPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<IntakeFormState>(DEFAULT_STATE);
  const [customKeyword, setCustomKeyword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const typeEntry = form.bizTypeKey ? getBusinessType(form.vertical, form.bizTypeKey) : null;
  const businessTypes = listBusinessTypes(form.vertical);
  const keywordGroups = typeEntry?.groups ?? [];
  const atKeywordLimit = form.scanKeywords.length >= SCAN_KEYWORD_LIMIT;

  function updateForm(patch: Partial<IntakeFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function selectVertical(vertical: VerticalKey) {
    updateForm({
      vertical,
      bizTypeKey: null,
      bizSubtype: null,
      scanKeywords: [],
    });
  }

  function selectBusinessType(bizTypeKey: string) {
    updateForm({
      bizTypeKey,
      bizSubtype: null,
      scanKeywords: [],
    });
  }

  function toggleKeyword(term: string) {
    setForm((current) => {
      if (current.scanKeywords.includes(term)) {
        return { ...current, scanKeywords: current.scanKeywords.filter((k) => k !== term) };
      }
      if (current.scanKeywords.length >= SCAN_KEYWORD_LIMIT) return current;
      return { ...current, scanKeywords: [...current.scanKeywords, term] };
    });
  }

  function removeKeyword(term: string) {
    setForm((current) => ({
      ...current,
      scanKeywords: current.scanKeywords.filter((k) => k !== term),
    }));
  }

  function addCustomKeyword() {
    const value = customKeyword.trim();
    if (!value || atKeywordLimit || form.scanKeywords.includes(value)) {
      setCustomKeyword('');
      return;
    }
    setForm((current) => ({ ...current, scanKeywords: [...current.scanKeywords, value] }));
    setCustomKeyword('');
  }

  function validateStep1(): boolean {
    if (
      !form.bizName.trim() ||
      !form.streetAddress.trim() ||
      !form.cityStateZip.trim() ||
      !form.bizDomain.trim() ||
      !form.bizTypeKey
    ) {
      setValidationError('Please fill in business name, address, domain, and select a business type to continue.');
      return false;
    }
    setValidationError(null);
    return true;
  }

  function validateStep2(): boolean {
    if (form.scanKeywords.length !== SCAN_KEYWORD_LIMIT) {
      setValidationError(`Please select exactly ${SCAN_KEYWORD_LIMIT} scan keywords to continue.`);
      return false;
    }
    setValidationError(null);
    return true;
  }

  function goToStep(next: 1 | 2 | 3) {
    if (next === 2 && !validateStep1()) return;
    if (next === 3 && !validateStep2()) return;
    setValidationError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function restart() {
    setForm(DEFAULT_STATE);
    setCustomKeyword('');
    setValidationError(null);
    setSubmitError(null);
    setStep(1);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    if (!validateStep2()) return;

    submittingRef.current = true;
    setSubmitError(null);

    let intake;
    try {
      intake = buildScanIntake(form);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Invalid form data');
      submittingRef.current = false;
      return;
    }

    const parsed = scanIntakeSchema.safeParse(intake);
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? 'Validation failed');
      submittingRef.current = false;
      return;
    }

    setSubmitting(true);
    try {
      const response = await createScan(parsed.data);
      navigate(`/scans/${encodeURIComponent(response.scanId)}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create scan');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const previewIntake = (() => {
    try {
      return buildScanIntake(form);
    } catch {
      return null;
    }
  })();

  return (
    <section className="card form-card intake-wizard">
      <div className="page-header">
        <div>
          <Link to="/scans" className="back-link">
            ← All scans
          </Link>
          <h2>Launch scan</h2>
          <p className="muted">Tell us about the business and pick scan keywords to start a local SEO audit.</p>
        </div>
      </div>

      <StepProgress step={step} />

      {step === 1 && (
        <div className="intake-screen">
          <p className="intake-eyebrow">Step {step} of 3</p>
          <h3 className="intake-title">Your Business</h3>
          <p className="intake-sub muted">
            Tell us about your business and what type it is — this determines which keyword categories we show you.
          </p>

          <div className="intake-field">
            <label htmlFor="biz-name">
              Business name
              <RequiredMark />
            </label>
            <input
              id="biz-name"
              type="text"
              value={form.bizName}
              onChange={(e) => updateForm({ bizName: e.target.value })}
              placeholder="e.g. The Well and Table"
              required
            />
          </div>

          <div className="intake-field-row">
            <div className="intake-field">
              <label htmlFor="biz-address">
                Street address
                <RequiredMark />
              </label>
              <input
                id="biz-address"
                type="text"
                value={form.streetAddress}
                onChange={(e) => updateForm({ streetAddress: e.target.value })}
                placeholder="e.g. 317 NW Gilman Blvd #43"
                required
              />
            </div>
            <div className="intake-field">
              <label htmlFor="biz-city">
                City, state, ZIP
                <RequiredMark />
              </label>
              <input
                id="biz-city"
                type="text"
                value={form.cityStateZip}
                onChange={(e) => updateForm({ cityStateZip: e.target.value })}
                placeholder="e.g. Issaquah, WA 98027"
                required
              />
            </div>
          </div>

          <div className="intake-field">
            <label htmlFor="biz-domain">
              Website domain
              <RequiredMark />
            </label>
            <input
              id="biz-domain"
              type="url"
              value={form.bizDomain}
              onChange={(e) => updateForm({ bizDomain: e.target.value })}
              placeholder="e.g. https://www.thewellandtable.com"
              required
            />
          </div>

          <div className="intake-field">
            <label htmlFor="biz-gbp">
              GBP primary category{' '}
              <span className="intake-label-hint">— what Google shows under your business name</span>
            </label>
            <input
              id="biz-gbp"
              type="text"
              value={form.gbpPrimaryCategory}
              onChange={(e) => updateForm({ gbpPrimaryCategory: e.target.value })}
              placeholder="e.g. American Restaurant, Farm to Table Restaurant"
            />
          </div>

          <div className="intake-field">
            <label>
              Scan tier <span className="intake-label-hint">— determines trade area size</span>
            </label>
            <div className="intake-chips">
              {BIZ_TIERS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  className={`intake-chip ${form.bizTier === tier ? 'intake-chip--selected' : ''}`}
                  onClick={() => updateForm({ bizTier: tier })}
                >
                  {tier} <span className="intake-chip-hint">· {TIER_RADIUS[tier]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="intake-field">
            <label>Industry</label>
            <div className="intake-chips intake-chips--wrap">
              {VERTICAL_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`intake-chip ${form.vertical === key ? 'intake-chip--selected' : ''}`}
                  onClick={() => selectVertical(key)}
                >
                  {getVerticalLabel(key)}
                </button>
              ))}
            </div>
          </div>

          <div className="intake-field">
            <label id="biz-type-label">
              Business type
              <RequiredMark />
            </label>
            <div className="intake-type-grid" role="group" aria-labelledby="biz-type-label" aria-required="true">
              {businessTypes.map(({ key, entry }) => (
                <button
                  key={key}
                  type="button"
                  className={`intake-type-card ${form.bizTypeKey === key ? 'intake-type-card--selected' : ''}`}
                  onClick={() => selectBusinessType(key)}
                >
                  <span className="intake-type-card__name">{entry.label}</span>
                  <span className="intake-type-card__sub">{entry.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {typeEntry && typeEntry.subtypes.length > 0 && (
            <div className="intake-field">
              <label>
                Sub-type <span className="intake-label-hint">— optional, helps narrow keyword suggestions</span>
              </label>
              <div className="intake-chips intake-chips--wrap">
                {typeEntry.subtypes.map((subtype) => (
                  <button
                    key={subtype}
                    type="button"
                    className={`intake-chip ${form.bizSubtype === subtype ? 'intake-chip--selected' : ''}`}
                    onClick={() => updateForm({ bizSubtype: subtype })}
                  >
                    {subtype}
                  </button>
                ))}
              </div>
            </div>
          )}

          {validationError && <p className="form-error intake-validation">{validationError}</p>}

          <div className="intake-btn-row">
            <div />
            <button type="button" className="btn-primary" onClick={() => goToStep(2)}>
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="intake-screen">
          <p className="intake-eyebrow">Step {step} of 3</p>
          <h3 className="intake-title">Scan Keywords</h3>
          <p className="intake-sub muted">
            Pick exactly {SCAN_KEYWORD_LIMIT} keywords. These are what we scan across Google Maps and Local Finder —
            your core search terms that customers use to find you.
          </p>

          <div className="intake-field">
            <label id="scan-keywords-label">
              Scan keywords
              <RequiredMark />
            </label>
          </div>

          <div className="intake-sel-counter" role="group" aria-labelledby="scan-keywords-label">
            <span className="intake-sel-counter__label">
              Selected {form.scanKeywords.length} / {SCAN_KEYWORD_LIMIT}
            </span>
            <div className="intake-sel-counter__pills">
              {form.scanKeywords.length === 0 ? (
                <span className="intake-sel-empty">No keywords selected yet</span>
              ) : (
                form.scanKeywords.map((kw) => (
                  <span key={kw} className="intake-sel-pill">
                    {kw}
                    <button type="button" className="intake-sel-pill__remove" onClick={() => removeKeyword(kw)}>
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {keywordGroups.map((group) => (
            <div key={group.label} className="intake-chip-section">
              <div className="intake-chip-section__label">{group.label}</div>
              <div className="intake-chips intake-chips--wrap">
                {group.terms.map((term) => {
                  const selected = form.scanKeywords.includes(term);
                  const disabled = !selected && atKeywordLimit;
                  return (
                    <button
                      key={term}
                      type="button"
                      className={[
                        'intake-chip',
                        selected ? 'intake-chip--selected' : '',
                        disabled ? 'intake-chip--disabled' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => toggleKeyword(term)}
                      disabled={disabled}
                    >
                      {term}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="intake-chip-section">
            <div className="intake-chip-section__label">Not seeing your keyword?</div>
            <div className="intake-custom-row">
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder="Type a custom keyword..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomKeyword();
                  }
                }}
              />
              <button type="button" className="btn-secondary" onClick={addCustomKeyword} disabled={atKeywordLimit}>
                + Add
              </button>
            </div>
          </div>

          {validationError && <p className="form-error intake-validation">{validationError}</p>}

          <div className="intake-btn-row">
            <button type="button" className="btn-secondary" onClick={() => goToStep(1)}>
              ← Back
            </button>
            <button type="button" className="btn-primary" onClick={() => goToStep(3)}>
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="intake-screen">
          <p className="intake-eyebrow">Ready to Scan</p>
          <h3 className="intake-title">Review &amp; Launch</h3>
          <p className="intake-sub muted">Review your selections below, then start the scan.</p>

          {previewIntake && (
            <div className="intake-summary-grid">
              <div className="intake-summary-card">
                <div className="intake-summary-card__label">Business</div>
                <div className="intake-summary-card__val">{previewIntake.bizName}</div>
              </div>
              <div className="intake-summary-card">
                <div className="intake-summary-card__label">Domain</div>
                <div className="intake-summary-card__val">{previewIntake.bizDomain}</div>
              </div>
              <div className="intake-summary-card">
                <div className="intake-summary-card__label">Address</div>
                <div className="intake-summary-card__val">{previewIntake.bizAddress}</div>
              </div>
              <div className="intake-summary-card">
                <div className="intake-summary-card__label">GBP category</div>
                <div className="intake-summary-card__val">{previewIntake.gbpPrimaryCategory || '—'}</div>
              </div>
              <div className="intake-summary-card">
                <div className="intake-summary-card__label">Industry &amp; type</div>
                <div className="intake-summary-card__val">
                  {previewIntake.bizVertical} · {previewIntake.bizType}
                </div>
              </div>
              <div className="intake-summary-card">
                <div className="intake-summary-card__label">Scan tier</div>
                <div className="intake-summary-card__val">
                  {previewIntake.bizTier} ({previewIntake.scanTier})
                </div>
              </div>
              <div className="intake-summary-card intake-summary-card--span-2">
                <div className="intake-summary-card__label">Scan keywords (Maps + LF)</div>
                <ul className="intake-kw-list">
                  {previewIntake.ownerServices.map((kw) => (
                    <li key={kw}>
                      <span className="intake-kw-dot" />
                      {kw}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {submitError && <p className="form-error intake-validation">{submitError}</p>}

            <div className="intake-btn-row">
              <button type="button" className="btn-secondary" onClick={() => goToStep(2)}>
                ← Back
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Starting scan…' : 'Start scan'}
              </button>
            </div>
          </form>

          <button type="button" className="btn-secondary intake-restart" onClick={restart}>
            ← Start over
          </button>
        </div>
      )}
    </section>
  );
}
