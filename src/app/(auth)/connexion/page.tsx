import { LoginForm } from "./form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string; erreur?: string }>;
}) {
  const { suite, erreur } = await searchParams;
  return <LoginForm suite={suite ?? "/dashboard"} linkError={erreur === "lien"} />;
}
