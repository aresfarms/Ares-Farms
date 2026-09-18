import { NextRequest } from "next/server";
import { GET } from "@/app/api/governance/release-evidence-integrity/route";

async function main() {
  const denied = await GET(new NextRequest("http://localhost/api/governance/release-evidence-integrity?role=user&userId=test-user"));
  const allowed = await GET(new NextRequest("http://localhost/api/governance/release-evidence-integrity?role=governance&userId=module-01-governance-dashboard"));
  if (denied.status !== 403) throw new Error(`expected 403, got ${denied.status}`);
  if (allowed.status !== 200) throw new Error(`expected 200, got ${allowed.status}`);
  const body = await allowed.json();
  if (!body.governance?.access?.allowed) throw new Error("governance access missing");
  console.log(JSON.stringify({ ok: true, deniedStatus: denied.status, allowedStatus: allowed.status, role: body.governance.access.role }, null, 2));
}
void main();
