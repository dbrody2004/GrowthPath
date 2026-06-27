import { FormEvent, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { scanIntakeSchema, type ScanIntake } from '@growthpath/shared';
import { createScan } from '../lib/scans.js';

const DEFAULT_FORM: ScanIntake = {
  bizName: '',
  bizAddress: '',
  bizDomain: '',
  bizCity: '',
  bizVertical: '',
  bizType: '',
  verticalKey: '',
  gbpPrimaryCategory: '',
  bizTier: 'Basic',
  scanTier: 'basic',
  ownerServices: [''],
};

export function NewScanPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ScanIntake>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  function updateField<K extends keyof ScanIntake>(key: K, value: ScanIntake[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateService(index: number, value: string) {
    setForm((current) => {
      const ownerServices = [...current.ownerServices];
      ownerServices[index] = value;
      return { ...current, ownerServices };
    });
  }

  function addService() {
    if (form.ownerServices.length >= 10) return;
    setForm((current) => ({ ...current, ownerServices: [...current.ownerServices, ''] }));
  }

  function removeService(index: number) {
    if (form.ownerServices.length <= 1) return;
    setForm((current) => ({
      ...current,
      ownerServices: current.ownerServices.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(null);

    const intake = {
      ...form,
      gbpPrimaryCategory: form.gbpPrimaryCategory?.trim() || undefined,
      ownerServices: form.ownerServices.map((service) => service.trim()).filter(Boolean),
    };

    const parsed = scanIntakeSchema.safeParse(intake);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Validation failed');
      submittingRef.current = false;
      return;
    }

    setSubmitting(true);
    try {
      const response = await createScan(parsed.data);
      navigate(`/scans/${encodeURIComponent(response.scanId)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create scan');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section className="card form-card">
      <div className="page-header">
        <div>
          <Link to="/scans" className="back-link">
            ← All scans
          </Link>
          <h2>New scan details</h2>
          <p className="muted">Submit business details to enqueue a local SEO audit.</p>
        </div>
      </div>

      <form className="scan-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Business name
            <input
              value={form.bizName}
              onChange={(event) => updateField('bizName', event.target.value)}
              required
            />
          </label>
          <label>
            Domain
            <input
              value={form.bizDomain}
              onChange={(event) => updateField('bizDomain', event.target.value)}
              placeholder="example.com"
              required
            />
          </label>
          <label className="form-span-2">
            Address
            <input
              value={form.bizAddress}
              onChange={(event) => updateField('bizAddress', event.target.value)}
              required
            />
          </label>
          <label>
            City
            <input
              value={form.bizCity}
              onChange={(event) => updateField('bizCity', event.target.value)}
              required
            />
          </label>
          <label>
            Vertical
            <input
              value={form.bizVertical}
              onChange={(event) => updateField('bizVertical', event.target.value)}
              placeholder="Food & Beverage"
              required
            />
          </label>
          <label>
            Business type
            <input
              value={form.bizType}
              onChange={(event) => updateField('bizType', event.target.value)}
              placeholder="restaurant"
              required
            />
          </label>
          <label>
            Vertical key
            <input
              value={form.verticalKey}
              onChange={(event) => updateField('verticalKey', event.target.value)}
              placeholder="restaurant"
              required
            />
          </label>
          <label>
            GBP primary category
            <input
              value={form.gbpPrimaryCategory ?? ''}
              onChange={(event) => updateField('gbpPrimaryCategory', event.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            Business tier
            <select
              value={form.bizTier}
              onChange={(event) =>
                updateField('bizTier', event.target.value as ScanIntake['bizTier'])
              }
            >
              <option value="Basic">Basic</option>
              <option value="Advanced">Advanced</option>
              <option value="Premium">Premium</option>
            </select>
          </label>
          <label>
            Scan tier
            <select
              value={form.scanTier}
              onChange={(event) =>
                updateField('scanTier', event.target.value as ScanIntake['scanTier'])
              }
            >
              <option value="basic">Basic</option>
              <option value="advanced_premium">Advanced / Premium</option>
            </select>
          </label>
        </div>

        <fieldset className="services-fieldset">
          <legend>Owner services (1–10)</legend>
          {form.ownerServices.map((service, index) => (
            <div key={index} className="service-row">
              <input
                value={service}
                onChange={(event) => updateService(index, event.target.value)}
                placeholder={`Service ${index + 1}`}
                required={index === 0}
              />
              {form.ownerServices.length > 1 && (
                <button type="button" className="btn-secondary" onClick={() => removeService(index)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          {form.ownerServices.length < 10 && (
            <button type="button" className="btn-secondary" onClick={addService}>
              Add service
            </button>
          )}
        </fieldset>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Start scan'}
        </button>
      </form>
    </section>
  );
}
