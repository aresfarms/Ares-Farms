import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import { applyEngine } from "@/lib/engine/applyEngine";
import { buildReport } from "@/lib/reports/buildReport";
import { generateReportPdf } from "@/lib/pdf/generateReportPdf";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    /**
     * RUN FULL PIPELINE
     */
    const engine = applyEngine(body);

    const reports = buildReport({
      tenantId: (session.user as any).tenantId,
      scores: engine.scores,
      decision: engine.decision,
    });

    /**
     * DEFAULT: FREE REPORT PDF
     */
    const pdfDoc = generateReportPdf(reports.freeReport);

    return new Response(pdfDoc as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=farm-report.pdf",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
