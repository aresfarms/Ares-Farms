/**
 * Anonymous-token API — PUBLIC (no account), borrower-experience unit.
 *
 * Lives under /api/public (the public-surface gateway → anonymous-allowed) so a
 * visitor can mint/return/export/delete with NO sign-in. Owned by the
 * borrower-experience unit (src/app/api/public/anon-token/ is mapped there); it
 * touches only that unit's store. NO real-identity PII is required to mint —
 * contact is optional and only stored with explicit consent.
 *
 * Actions: mint · return · export · delete · hold · human-review.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  mintToken,
  getByToken,
  exportToken,
  deleteToken,
  requestRight,
  DATA_RIGHTS,
  type StoredSnapshot,
} from "@/lib/borrower-experience/anonymousToken";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ action: string }> },
) {
  const { action } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    token?: string;
    saved?: StoredSnapshot[];
    contact?: string;
    consentContact?: boolean;
  };
  const token = typeof body.token === "string" ? body.token : "";

  switch (action) {
    case "mint": {
      const saved = Array.isArray(body.saved) ? body.saved : [];
      // Contact is OPTIONAL and only kept with explicit consent — never required.
      const contact =
        body.consentContact === true && typeof body.contact === "string" ? body.contact : null;
      const { token: minted, tokenId } = mintToken({ saved, contact });
      return NextResponse.json({ token: minted, tokenId, rights: DATA_RIGHTS });
    }
    case "return": {
      const rec = getByToken(token);
      if (!rec) return NextResponse.json({ found: false }, { status: 404 });
      return NextResponse.json({
        found: true,
        tokenId: rec.tokenId,
        createdAt: rec.createdAt,
        saved: rec.saved,
        contact: rec.contact,
      });
    }
    case "export": {
      const rec = exportToken(token);
      if (!rec) return NextResponse.json({ found: false }, { status: 404 });
      return NextResponse.json(rec);
    }
    case "delete": {
      const purged = deleteToken(token);
      return NextResponse.json({ purged });
    }
    case "hold":
    case "human-review": {
      const ok = requestRight(token, action);
      return NextResponse.json({ ok });
    }
    default:
      return NextResponse.json({ error: `unknown action "${action}"` }, { status: 400 });
  }
}
