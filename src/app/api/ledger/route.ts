import { buildCanonicalLedger } from "@/lib/audit/canonicalLedger";

export async function GET() {
  try {
    const ledger = await buildCanonicalLedger();

    return Response.json({
      ok: true,
      ledger,
    });
  } catch (err: any) {
    console.error("LEDGER_API_ERROR:", err);

    return Response.json(
      {
        ok: false,
        error: "LEDGER_API_FAILED",
        message: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
