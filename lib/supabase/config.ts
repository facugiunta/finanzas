/**
 * Indica si las variables de entorno de Supabase están cargadas.
 * Permite que la app arranque y muestre un aviso de setup mientras
 * todavía no se configuró el proyecto de Supabase.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
