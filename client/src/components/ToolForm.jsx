import { useEffect, useState } from 'react';

const CATEGORIES = ['power', 'garden', 'decorate', 'access', 'measure', 'hand'];
const STATUSES = [
  { id: 'in', label: 'On the shelf' },
  { id: 'out', label: 'Out on loan' },
  { id: 'repair', label: 'In repair' },
];

const BLANK = { assetTag: '', name: '', category: 'power', shelf: '', deposit: '', status: 'in', notes: '' };

/**
 * Used for both create and edit. `tool` present means edit.
 * Client-side rules mirror the server's; the server is still the authority,
 * and any field errors it returns are merged into the same error object so
 * both layers render identically.
 */
export function ToolForm({ tool, busy, serverFields, onSubmit, onCancel }) {
  const [values, setValues] = useState(BLANK);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(tool ? { ...BLANK, ...tool, deposit: String(tool.deposit ?? '') } : BLANK);
    setTouched({});
    setErrors({});
  }, [tool]);

  useEffect(() => { if (serverFields) setErrors((e) => ({ ...e, ...serverFields })); }, [serverFields]);

  const set = (key) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: validateField(key, value) }));
  };
  const blur = (key) => () => setTouched((t) => ({ ...t, [key]: true }));

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    for (const key of ['assetTag', 'name', 'category', 'shelf', 'deposit']) {
      const msg = validateField(key, values[key]);
      if (msg) next[key] = msg;
    }
    setErrors(next);
    setTouched({ assetTag: true, name: true, category: true, shelf: true, deposit: true });
    if (Object.keys(next).length) return;

    onSubmit({
      assetTag: values.assetTag.trim().toUpperCase(),
      name: values.name.trim(),
      category: values.category,
      shelf: values.shelf.trim(),
      deposit: Number(values.deposit || 0),
      status: values.status,
      notes: values.notes.trim(),
    });
  };

  const err = (key) => (touched[key] || errors[key]) && errors[key];

  return (
    <form className="panel toolform" onSubmit={submit} noValidate>
      <h2 className="toolform__title">{tool ? `Edit ${tool.assetTag}` : 'Add a tool to the catalogue'}</h2>

      <div className="toolform__grid">
        <Field label="Asset tag" error={err('assetTag')} hint="Format TS-0142">
          <input className="input" value={values.assetTag} onChange={set('assetTag')} onBlur={blur('assetTag')}
                 aria-invalid={!!err('assetTag')} placeholder="TS-0142" disabled={busy} />
        </Field>

        <Field label="Shelf" error={err('shelf')}>
          <input className="input" value={values.shelf} onChange={set('shelf')} onBlur={blur('shelf')}
                 aria-invalid={!!err('shelf')} placeholder="B2 or Yard" disabled={busy} />
        </Field>

        <Field label="Tool name" error={err('name')} wide>
          <input className="input" value={values.name} onChange={set('name')} onBlur={blur('name')}
                 aria-invalid={!!err('name')} placeholder="Random orbital sander" disabled={busy} />
        </Field>

        <Field label="Category" error={err('category')}>
          <select className="select" value={values.category} onChange={set('category')} disabled={busy}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Deposit (£)" error={err('deposit')}>
          <input className="input" type="number" min="0" max="500" step="1" value={values.deposit}
                 onChange={set('deposit')} onBlur={blur('deposit')} aria-invalid={!!err('deposit')}
                 placeholder="0" disabled={busy} />
        </Field>

        <Field label="Status">
          <select className="select" value={values.status} onChange={set('status')} disabled={busy}>
            {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>

        <Field label="Notes for borrowers" error={err('notes')} wide>
          <textarea className="textarea" value={values.notes} onChange={set('notes')} disabled={busy}
                    placeholder="Anything the next borrower needs to know." maxLength={400} />
        </Field>
      </div>

      <div className="toolform__actions">
        <button className="btn btn--tape" type="submit" disabled={busy}>
          {busy && <span className="spinner" />}
          {busy ? 'Saving…' : tool ? 'Save changes' : 'Add tool'}
        </button>
        {tool && <button className="btn btn--ghost" type="button" onClick={onCancel} disabled={busy}>Cancel</button>}
      </div>
    </form>
  );
}

function Field({ label, error, hint, wide, children }) {
  return (
    <label className={`field${wide ? ' field--wide' : ''}`}>
      <span className="field__label">{label}</span>
      {children}
      {error ? <span className="field__error">{error}</span>
             : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export function validateField(key, raw) {
  const value = String(raw ?? '').trim();
  switch (key) {
    case 'assetTag':
      if (!value) return 'Asset tag is required.';
      if (!/^TS-\d{4}$/i.test(value)) return 'Asset tags look like TS-0142.';
      return '';
    case 'name':
      if (!value) return 'Tool name is required.';
      if (value.length < 2) return 'Tool name needs at least 2 characters.';
      if (value.length > 80) return 'Keep the tool name under 80 characters.';
      return '';
    case 'category':
      return CATEGORIES.includes(value) ? '' : 'Pick a category.';
    case 'shelf':
      if (!value) return 'Shelf is required.';
      if (value.length > 12) return 'Shelf labels are 12 characters at most.';
      return '';
    case 'deposit': {
      if (value === '') return '';
      const n = Number(value);
      if (!Number.isFinite(n)) return 'Deposit must be a number.';
      if (n < 0) return 'Deposit cannot be negative.';
      if (n > 500) return 'Deposits over £500 need a trustee to approve them.';
      return '';
    }
    case 'notes':
      return value.length > 400 ? 'Notes are capped at 400 characters.' : '';
    default:
      return '';
  }
}
