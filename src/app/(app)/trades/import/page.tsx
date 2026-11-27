import { ImportWizard } from "./wizard";

export default function ImportPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Importer des trades</h1>
        <p className="mt-1 text-sm text-muted">
          Ajoutez d&apos;un coup tout votre historique. Les trades déjà importés sont reconnus et ne sont jamais ajoutés deux fois.
        </p>
      </div>
      <ImportWizard />
    </div>
  );
}
