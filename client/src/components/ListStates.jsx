export function ListSkeleton({ count = 6 }) {
  return (
    <div className="rows" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="tag row" key={i}>
          <div className="skeleton" style={{ height: '.7rem', width: '55%' }} />
          <div className="skeleton" style={{ height: '1.5rem', width: '75%', marginTop: '.7rem' }} />
          <div className="skeleton" style={{ height: '.7rem', width: '90%', marginTop: '.9rem' }} />
          <div className="skeleton" style={{ height: '2rem', width: '100%', marginTop: '1.4rem' }} />
        </div>
      ))}
    </div>
  );
}

export function ListError({ error, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <p className="state__title">The catalogue did not load</p>
      <p className="state__body">
        {error.message}
        {error.status === 0 && ' Start the API with npm run dev in the server folder, then retry.'}
      </p>
      <button className="btn btn--primary" onClick={onRetry}>Try again</button>
    </div>
  );
}

export function ListEmpty({ filtered, onClear }) {
  return (
    <div className="state">
      <p className="state__title">{filtered ? 'Nothing matches those filters' : 'The catalogue is empty'}</p>
      <p className="state__body">
        {filtered
          ? 'Widen the search or clear the category filter to see the rest of the shed.'
          : 'Add the first tool using the form above. Asset tags run from TS-0001 upward.'}
      </p>
      {filtered && <button className="btn btn--ghost" onClick={onClear}>Clear filters</button>}
    </div>
  );
}
