'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="wrap">
      <div className="empty">
        <p>No se han podido cargar los datos.</p>
        <button className="btn" onClick={reset}>Reintentar</button>
      </div>
    </main>
  );
}
