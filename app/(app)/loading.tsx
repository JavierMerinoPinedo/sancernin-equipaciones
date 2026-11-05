export default function Loading() {
  return (
    <main className="wrap skeleton" aria-busy="true" aria-label="Cargando">
      <div className="sk sk-line" />
      <div className="sk sk-card" />
      <div className="sk sk-card" />
      <div className="sk sk-card" />
    </main>
  );
}
