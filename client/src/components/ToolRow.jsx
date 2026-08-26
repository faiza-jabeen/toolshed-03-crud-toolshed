const STATUS_LABEL = { in: 'On the shelf', out: 'Out on loan', repair: 'In repair' };
const NEXT_STATUS = { in: 'out', out: 'in', repair: 'in' };

/**
 * One catalogue row. Every action carries its own busy flag, so lending a
 * drill does not grey out the whole list.
 */
export function ToolRow({ tool, busyAction, onEdit, onCycleStatus, onDelete }) {
  const pending = (action) => busyAction === action;
  const anyPending = Boolean(busyAction);

  return (
    <article className={`tag row${anyPending ? ' is-busy' : ''}`}>
      <p className="tag__id">
        <span>{tool.assetTag}</span>
        <span>Shelf {tool.shelf}</span>
      </p>
      <h3 className="tag__name">{tool.name}</h3>
      <p className="row__notes">{tool.notes || <em>No notes yet.</em>}</p>

      <div className="row__meta">
        <span className={`pip pip--${tool.status === 'in' ? 'in' : 'out'}`}>{STATUS_LABEL[tool.status]}</span>
        <span className="row__deposit">£{tool.deposit} deposit</span>
        <span className="row__cat">{tool.category}</span>
      </div>

      <div className="row__actions">
        <button className="btn btn--ghost btn--sm" type="button"
                onClick={() => onCycleStatus(tool)} disabled={anyPending}>
          {pending('status') && <span className="spinner" />}
          {pending('status') ? 'Saving…' : `Mark ${STATUS_LABEL[NEXT_STATUS[tool.status]].toLowerCase()}`}
        </button>
        <button className="btn btn--ghost btn--sm" type="button" onClick={() => onEdit(tool)} disabled={anyPending}>
          Edit
        </button>
        <button className="btn btn--danger btn--sm" type="button"
                onClick={() => onDelete(tool)} disabled={anyPending}>
          {pending('delete') && <span className="spinner" />}
          {pending('delete') ? 'Removing…' : 'Retire'}
        </button>
      </div>
    </article>
  );
}

export { NEXT_STATUS, STATUS_LABEL };
