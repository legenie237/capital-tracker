import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-2xl font-bold">
        Capital <span className="text-accent">Tracker</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
