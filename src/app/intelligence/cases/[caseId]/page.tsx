import { LivingFurlongCasePanel } from "@/components/intelligence/LivingFurlongCasePanel";
/** Customer-owned records are loaded through the session-authorized case API.
 * URL claims about reviews, approval or completion are never displayed as fact. */
export default async function IntelligenceCasePage({ params, searchParams }: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const { caseId } = await params;
  const query = await searchParams;
  const read = (key: string) => typeof query[key] === "string" ? query[key] as string : "";
  const split = (key: string) => read(key).split(",").map(value => value.trim()).filter(Boolean);
  return <main style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px", color: "#162b40" }}>
    <h1>Your Furlong case</h1>
    <LivingFurlongCasePanel caseId={caseId} displayName={read("name") || "Your project"} goal={read("goal")} state={read("state") || null} customerTypes={split("customerTypes")} intendedUses={split("intendedUses")} />
  </main>;
}
