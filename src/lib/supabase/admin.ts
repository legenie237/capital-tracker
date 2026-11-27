import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Client Supabase avec la clé service_role : uniquement côté serveur (paiements crypto). */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
