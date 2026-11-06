'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="wrap">
      <div className="empty">
        <p role="alert">No se han podido cargar los datos. Comprueba la conexión y vuelve a intentarlo.</p>
        <button className="btn" onClick={reset}>Volver a intentarlo</button>
      </div>
    </main>
  );
}
