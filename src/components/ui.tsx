import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-surface p-6 ${className}`}>{children}</div>;
}

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
      />
    </label>
  );
}

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full rounded-lg bg-accent px-4 py-2 font-semibold text-black transition hover:opacity-90 disabled:opacity-50 ${className}`}
    />
  );
}

export function FormMessage({ state }: { state?: { error?: string; message?: string } }) {
  if (state?.error) return <p className="text-sm text-danger">{state.error}</p>;
  if (state?.message) return <p className="text-sm text-accent">{state.message}</p>;
  return null;
}
