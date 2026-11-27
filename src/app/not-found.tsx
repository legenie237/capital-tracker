import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-gradient text-6xl font-extrabold">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page introuvable</h1>
      <p className="mt-2 text-muted">Cette page n&apos;existe pas, a été supprimée, ou tu n&apos;y as pas accès.</p>
      <Link href="/dashboard" className="mt-6 rounded-xl bg-accent px-5 py-2.5 font-semibold text-black hover:opacity-90">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
