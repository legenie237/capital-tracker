// Affiché instantanément pendant le chargement d'un onglet.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Chargement">
      <div className="h-8 w-48 rounded-lg bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-white/5 bg-white/[0.03]" />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-white/5 bg-white/[0.03]" />
    </div>
  );
}
