import { useCallback, useEffect, useMemo, useState } from 'react';
import { listTools, createTool, updateTool, deleteTool } from './api/tools.js';
import { ApiError } from './api/client.js';
import { useToasts } from './hooks/useToasts.js';
import { Toasts } from './components/Toasts.jsx';
import { ToolForm } from './components/ToolForm.jsx';
import { ToolRow, NEXT_STATUS, STATUS_LABEL } from './components/ToolRow.jsx';
import { ConfirmDialog } from './components/ConfirmDialog.jsx';
import { ListSkeleton, ListError, ListEmpty } from './components/ListStates.jsx';

const CATEGORY_FILTERS = ['', 'power', 'garden', 'decorate', 'access', 'measure', 'hand'];

export default function App() {
  const [status, setStatus] = useState('loading');   // loading | ready | error
  const [tools, setTools] = useState([]);
  const [error, setError] = useState(null);

  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('');

  const [editing, setEditing] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [serverFields, setServerFields] = useState(null);

  // id -> which action is in flight, so each row spins independently
  const [rowBusy, setRowBusy] = useState({});
  const [confirming, setConfirming] = useState(null);

  const toast = useToasts();

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      setTools(await listTools());
      setStatus('ready');
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError('Unexpected error.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtering is client-side here because the whole catalogue is small; the API
  // also supports ?q= and ?category= for when it is not.
  const shown = useMemo(() => {
    const q = term.trim().toLowerCase();
    return tools.filter((t) => {
      const inCat = !category || t.category === category;
      const matches = !q ||
        t.name.toLowerCase().includes(q) ||
        t.assetTag.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q);
      return inCat && matches;
    });
  }, [tools, term, category]);

  /* ---- create / update ---------------------------------------------------- */
  async function handleSubmit(payload) {
    setFormBusy(true);
    setServerFields(null);
    try {
      if (editing) {
        const updated = await updateTool(editing.id, payload);
        setTools((list) => list.map((t) => (t.id === updated.id ? updated : t)));
        toast.ok(`${updated.assetTag} updated.`);
        setEditing(null);
      } else {
        const created = await createTool(payload);
        setTools((list) => [...list, created].sort((a, b) => a.assetTag.localeCompare(b.assetTag)));
        toast.ok(`${created.assetTag} added to the catalogue.`);
      }
    } catch (err) {
      if (err.fields) setServerFields(err.fields);
      toast.fail(err.message);
    } finally {
      setFormBusy(false);
    }
  }

  /* ---- quick status change ------------------------------------------------ */
  async function handleCycleStatus(tool) {
    const next = NEXT_STATUS[tool.status];
    setRowBusy((b) => ({ ...b, [tool.id]: 'status' }));
    // No optimistic update here on purpose: the whole point of the task is that
    // the UI shows the request happening rather than pretending it is instant.
    try {
      const updated = await updateTool(tool.id, { status: next });
      setTools((list) => list.map((t) => (t.id === updated.id ? updated : t)));
      toast.ok(`${updated.assetTag} is now ${STATUS_LABEL[next].toLowerCase()}.`);
    } catch (err) {
      toast.fail(`Could not update ${tool.assetTag}. ${err.message}`);
    } finally {
      setRowBusy((b) => ({ ...b, [tool.id]: undefined }));
    }
  }

  /* ---- delete ------------------------------------------------------------- */
  async function handleDelete() {
    const tool = confirming;
    setRowBusy((b) => ({ ...b, [tool.id]: 'delete' }));
    try {
      await deleteTool(tool.id);
      setTools((list) => list.filter((t) => t.id !== tool.id));
      if (editing?.id === tool.id) setEditing(null);
      toast.ok(`${tool.assetTag} retired from the catalogue.`);
      setConfirming(null);
    } catch (err) {
      toast.fail(`Could not retire ${tool.assetTag}. ${err.message}`);
    } finally {
      setRowBusy((b) => ({ ...b, [tool.id]: undefined }));
    }
  }

  const filtering = Boolean(term || category);

  return (
    <>
      <header className="masthead">
        <div className="u-shell masthead__inner">
          <p className="wordmark">
            <span className="wordmark__mark">TS</span>
            <span className="wordmark__text">Kirkgate<br /><em>Toolshed</em></span>
          </p>
          <p className="masthead__note">Catalogue · keeper view</p>
        </div>
      </header>

      <main className="u-shell page">
        <div className="page__head">
          <p className="eyebrow">Full CRUD against the Toolshed API</p>
          <h1 className="page__title">Everything the shed owns.</h1>
          <p className="page__body u-measure">
            Add a tool, change where it lives, lend it out, bring it back, retire
            it when it finally dies. Every action goes to the Express API and
            waits for a real answer.
          </p>
        </div>

        <ToolForm
          tool={editing}
          busy={formBusy}
          serverFields={serverFields}
          onSubmit={handleSubmit}
          onCancel={() => { setEditing(null); setServerFields(null); }}
        />

        <section className="catalogue">
          <div className="catalogue__controls">
            <label className="field catalogue__search">
              <span className="field__label">Search the catalogue</span>
              <input className="input" type="search" value={term} placeholder="sander, TS-0117, goggles…"
                     onChange={(e) => setTerm(e.target.value)} disabled={status !== 'ready'} />
            </label>
            <label className="field">
              <span className="field__label">Category</span>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}
                      disabled={status !== 'ready'}>
                {CATEGORY_FILTERS.map((c) => (
                  <option key={c || 'all'} value={c}>{c || 'All categories'}</option>
                ))}
              </select>
            </label>
          </div>

          <p className="page__count" role="status" aria-live="polite">
            {status === 'loading' && 'Loading the catalogue…'}
            {status === 'ready' && `${shown.length} of ${tools.length} tools`}
            {status === 'error' && 'Catalogue unavailable'}
          </p>

          {status === 'loading' && <ListSkeleton />}
          {status === 'error' && <ListError error={error} onRetry={load} />}
          {status === 'ready' && shown.length === 0 && (
            <ListEmpty filtered={filtering} onClear={() => { setTerm(''); setCategory(''); }} />
          )}
          {status === 'ready' && shown.length > 0 && (
            <div className="rows">
              {shown.map((tool) => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  busyAction={rowBusy[tool.id]}
                  onEdit={(t) => { setEditing(t); setServerFields(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  onCycleStatus={handleCycleStatus}
                  onDelete={setConfirming}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <ConfirmDialog
        open={Boolean(confirming)}
        title={`Retire ${confirming?.assetTag}?`}
        body={`${confirming?.name} will be removed from the catalogue for good. Loan history is not kept in this task, so this cannot be undone.`}
        confirmLabel="Retire it"
        busy={rowBusy[confirming?.id] === 'delete'}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(null)}
      />

      <Toasts toasts={toast.toasts} dismiss={toast.dismiss} />
    </>
  );
}
