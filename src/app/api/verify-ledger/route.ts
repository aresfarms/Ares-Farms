import { verifyCanonicalLedger } from "@/lib/audit/canonicalLedger";

export async function GET() {
  try {
    const result = await verifyCanonicalLedger();

    return Response.json({
      ok: true,
      result,
    });
  } catch (err: any) {
    console.error("LEDGER_VERIFY_ERROR:", err);

    return Response.json(
      {
        ok: false,
        error: "LEDGER_VERIFY_FAILED",
        message: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
