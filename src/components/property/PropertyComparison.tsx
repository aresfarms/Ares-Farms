"use client";
import { useEffect, useState } from "react";
import { FURLONG_ANSWER_VERSION, type FurlongAnswer } from "@/lib/property/furlongAnswer";

const KEY = "furlong-explicit-property-comparison-v1";
/** Explicit tab-local comparison, not a durable case or verified comp sale.
 * Browser data is never accepted by a server as financial/verification evidence. */
function read(): FurlongAnswer[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value.filter(item => item?.version === FURLONG_ANSWER_VERSION
      && typeof item.subjectId === "string" && typeof item.title === "string" && typeof item.intendedUse === "string"
      && (item.sourceDate === null || typeof item.sourceDate === "string")
      && Array.isArray(item.sections) && item.sections.length === 5 && item.sections.every((section: { key?: unknown; text?: unknown }) => typeof section.key === "string" && typeof section.text === "string")
      && typeof item.price?.label === "string").slice(0,3) : [];
  } catch { return []; }
}
export function PropertyComparison({ answer }: { answer: FurlongAnswer }) {
  const [items, setItems] = useState<FurlongAnswer[]>([]);
  const [note, setNote] = useState("");
  useEffect(() => { setItems(read()); }, []);
  function persist(next: FurlongAnswer[]) {
    try { sessionStorage.setItem(KEY, JSON.stringify(next)); setItems(next); setNote(""); }
    catch { setNote("This browser could not keep the comparison. It has not been saved."); }
  }
  function add() {
    const current = read();
    if (current.length >= 3 && !current.some(item => item.subjectId === answer.subjectId)) {
      setNote("Remove one property before adding another. Compare up to three."); return;
    }
    persist([...current.filter(item => item.subjectId !== answer.subjectId), answer]);
  }
  return <section data-testid="property-comparison" style={{ background: "#fff", color: "#162b40", border: "1px solid #ccd6df", borderRadius: 12, padding: 18 }}>
    <span style={{ color: "#8F6E1F", fontSize: 10.5, fontWeight: 850, letterSpacing: ".12em", textTransform: "uppercase" }}>Compare before you commit</span><h2 style={{ fontSize: 21, marginTop: 4 }}>Build your shortlist from evidence, not tabs</h2>
    <p>Keep up to three property snapshots beside one another while you investigate. Add this property, check another address in the same tab, and compare the same evidence questions side by side. No ranking is assigned, missing evidence is not treated as zero, and a property can remain useful even when you decide to pass on it.</p>
    <button type="button" onClick={add} style={{ padding: 12, minHeight: 44 }}>Add or update this property</button>
    {items.length > 0 && <button type="button" onClick={() => { try { sessionStorage.removeItem(KEY); setItems([]); setNote("Comparison cleared from this tab."); } catch { setNote("The browser could not clear the comparison. Close this tab to discard it."); } }} style={{ marginLeft: 10, padding: 12, minHeight: 44 }}>Clear comparison</button>}
    <p role="status">{note || (items.length ? items.length + " of 3 properties selected. Tab-local only—not saved to your account." : "No properties selected.")}</p>
    {items.length > 0 && <div role="region" aria-label="Property comparison table" tabIndex={0} style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: items.length > 1 ? 640 : 0, fontSize: 14 }}>
        <caption style={{ textAlign: "left", padding: "12px 0" }}>Comparison snapshots—not market comparable sales. Recheck source dates before relying on them.</caption>
        <thead><tr><th scope="col" style={{ textAlign: "left" }}>Question</th>{items.map(item => <th scope="col" key={item.subjectId} style={{ textAlign: "left", padding: 12 }}>{item.title}<br />
          <button type="button" onClick={() => persist(items.filter(other => other.subjectId !== item.subjectId))} aria-label={"Remove " + item.title} style={{ padding: 8 }}>Remove</button></th>)}</tr></thead>
        <tbody>{[
          ["Source date", (item: FurlongAnswer) => item.sourceDate || "Not supplied"],
          ["Price evidence", (item: FurlongAnswer) => item.price.amount != null && Number.isFinite(item.price.amount) ? "$" + item.price.amount.toLocaleString("en-US") + " · " + item.price.label : item.price.label],
          ["Recorded use", (item: FurlongAnswer) => item.intendedUse],
          ["Economics and costs", (item: FurlongAnswer) => item.sections.find(section => section.key === "numbers")?.text || "Evidence pending"],
          ["Constraints", (item: FurlongAnswer) => item.sections.find(section => section.key === "constraints")?.text || "Evidence pending"],
          ["Missing evidence", (item: FurlongAnswer) => item.sections.find(section => section.key === "unknowns")?.text || "Evidence pending"],
          ["Next action / financing questions", (item: FurlongAnswer) => item.sections.find(section => section.key === "next")?.text || "Evidence pending"],
        ].map(([label, value]) => <tr key={label as string}><th scope="row" style={{ textAlign: "left", verticalAlign: "top", padding: 12, borderTop: "1px solid #ccd6df" }}>{label as string}</th>{items.map(item => <td key={item.subjectId} style={{ verticalAlign: "top", padding: 12, borderTop: "1px solid #ccd6df" }}>{(value as (item: FurlongAnswer) => string)(item)}</td>)}</tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
