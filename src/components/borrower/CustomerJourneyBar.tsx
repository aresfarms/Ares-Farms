import Link from "next/link";

export type CustomerJourneyStage = "explore" | "understand" | "prepare" | "finance" | "operate";

const STAGES: Array<{ id: CustomerJourneyStage; label: string; note: string; href: string }> = [
  { id: "explore", label: "Explore", note: "Start with a place", href: "/discover" },
  { id: "understand", label: "Understand", note: "Facts, risks, economics", href: "/portal/borrower" },
  { id: "prepare", label: "Prepare", note: "Readiness + reusable file", href: "/portal/borrower" },
  { id: "finance", label: "Finance", note: "Verified provider fit", href: "/capital-network" },
  { id: "operate", label: "Operate", note: "Keep the record useful", href: "/portal/borrower" },
];

export function CustomerJourneyBar({ current, financeHref }: { current: CustomerJourneyStage; financeHref?: string }) {
  return (
    <nav aria-label="Your Furlong journey" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: 7 }}>
      {STAGES.map((stage, index) => {
        const active = stage.id === current;
        const href = stage.id === "finance" && financeHref ? financeHref : stage.href;
        const content = (
          <>
            <span style={{ fontSize: 10, fontWeight: 850, letterSpacing: "0.08em", color: active ? "#fff" : "#0f766e" }}>{index + 1}. {stage.label.toUpperCase()}</span>
            <span style={{ fontSize: 11.5, lineHeight: 1.4, color: active ? "#d8f4eb" : "#526074" }}>{stage.note}</span>
          </>
        );
        const style = { display: "grid", gap: 3, border: `1px solid ${active ? "#0f766e" : "#d7deea"}`, borderRadius: 10, background: active ? "#0f766e" : "#fff", padding: "10px 11px", textDecoration: "none" } as const;
        return active ? <div key={stage.id} aria-current="step" style={style}>{content}</div> : <Link key={stage.id} href={href} style={style}>{content}</Link>;
      })}
    </nav>
  );
}
