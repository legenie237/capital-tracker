import Link from "next/link";
import { Icons } from "@/components/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden px-4 py-12">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <Link href="/" className="relative mb-8 flex items-center gap-2 text-2xl font-bold tracking-tight">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-black">
          <Icons.chart width={20} height={20} strokeWidth={2.4} />
        </span>
        <span>
          Capital <span className="text-gradient">Tracker</span>
        </span>
      </Link>
      <div className="animate-fade-up relative w-full max-w-sm">{children}</div>
    </main>
  );
}
