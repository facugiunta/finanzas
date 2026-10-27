import { LoginForm } from "./login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-xl font-bold text-neutral-950">
            $
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Finanzas</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Ingresá para ver tus movimientos
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
          {configured ? (
            <LoginForm />
          ) : (
            <div className="flex flex-col gap-3 text-sm text-neutral-400">
              <p className="font-medium text-amber-400">
                ⚠ Supabase no está configurado
              </p>
              <p>
                Completá las variables en{" "}
                <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-200">
                  .env.local
                </code>{" "}
                con los datos de tu proyecto de Supabase y reiniciá el servidor.
              </p>
              <ol className="list-inside list-decimal space-y-1 text-neutral-500">
                <li>Creá un proyecto en supabase.com</li>
                <li>Settings → API: copiá URL y anon key</li>
                <li>Pegalas en .env.local</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
