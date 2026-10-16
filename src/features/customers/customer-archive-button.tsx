"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CustomerArchiveButton({
  tenantId,
  customerId,
}: {
  tenantId: string;
  customerId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function archive() {
    if (!window.confirm("Archive this customer? Their appointment history will remain available.")) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/workspaces/${tenantId}/customers/${customerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archive: true }),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Customer could not be archived.");
      router.replace("/workspace/customers");
      router.refresh();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Customer could not be archived.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        className="min-h-10 rounded-full border border-line px-4 text-xs font-medium text-muted transition hover:border-red-200 hover:text-red-700 disabled:opacity-60"
        disabled={busy}
        onClick={() => void archive()}
        type="button"
      >
        {busy ? "Archiving…" : "Archive customer"}
      </button>
      {error && <p aria-live="assertive" className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
