"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 text-xl text-rose-400">
        !
      </div>
      <h2 className="text-lg font-semibold">Algo salió mal</h2>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">
        Ocurrió un error al cargar esta sección. Probá de nuevo.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
      >
        Reintentar
      </button>
    </div>
  );
}
