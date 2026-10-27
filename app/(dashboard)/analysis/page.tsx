import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AnalysisView } from "@/components/analysis/analysis-view";
import type { Movement } from "@/types";

export default async function AnalysisPage() {
  let movements: Movement[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("movements")
      .select("*")
      .order("date", { ascending: false });
    movements = (data as Movement[]) ?? [];
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Análisis</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gasto por categoría, comparativas y evolución
        </p>
      </header>

      <AnalysisView movements={movements} />
    </div>
  );
}
