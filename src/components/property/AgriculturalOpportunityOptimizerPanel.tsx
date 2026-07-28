"use client";
import {useMemo,useState} from "react";
import type {ChartTheme} from "@/lib/property/chartThemes";
import {optimizeAgriculturalOpportunities} from "@/lib/property/agriculturalOpportunityOptimizer";
const money=(n:number)=>`$${Math.round(n).toLocaleString("en-US")}`;
export function AgriculturalOpportunityOptimizerPanel(p:{acreage:number;price:number;rate:number;theme:ChartTheme}){
 const debt=p.price*.8*(p.rate/100)/(1-Math.pow(1+p.rate/100,-40));
 const [x,setX]=useState({waterScore:70,laborCapacity:55,capitalCapacity:55,marketAccess:60,gridEvidence:false,solarZoningEvidence:false});
 const m=useMemo(()=>optimizeAgriculturalOpportunities({acres:p.acreage,purchasePrice:p.price,debtService:debt,...x}),[p.acreage,p.price,debt,x]);
 const slider=(k:keyof typeof x,label:string)=>typeof x[k]==="number"?<label style={{fontSize:11.5,display:"grid",gap:3}}>{label}: {String(x[k])}<input type="range" min="0" max="100" value={x[k] as number} onChange={e=>setX(v=>({...v,[k]:Number(e.target.value)}))}/></label>:null;
 return <section style={{display:"grid",gap:14,padding:16,border:`2px solid ${p.theme.accent}`,borderRadius:12,background:p.theme.plate}}>
  <div><strong style={{fontSize:17,color:p.theme.ink}}>Best-use agricultural opportunity optimizer</strong><p style={{margin:"4px 0 0",fontSize:12,color:p.theme.inkSoft}}>Compares singular and diversified enterprises. It does not assume commodity crops are the answer.</p></div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>{slider("waterScore","Water/irrigation capacity")}{slider("laborCapacity","Labor/management capacity")}{slider("capitalCapacity","Capital capacity")}{slider("marketAccess","Market/offtake access")}</div>
  <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:12}}><label><input type="checkbox" checked={x.gridEvidence} onChange={e=>setX(v=>({...v,gridEvidence:e.target.checked}))}/> Grid/interconnection evidence exists</label><label><input type="checkbox" checked={x.solarZoningEvidence} onChange={e=>setX(v=>({...v,solarZoningEvidence:e.target.checked}))}/> Solar zoning/site feasibility evidenced</label></div>
  <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{["Rank","Enterprise","Fit","Acres modeled","Annual NOI","DSCR","Status"].map(h=><th key={h} style={{textAlign:"left",padding:7,borderBottom:`1px solid ${p.theme.cellBorder}`}}>{h}</th>)}</tr></thead><tbody>{m.ranked.map((r,i)=><tr key={r.key}><td style={{padding:7}}>{i+1}</td><td style={{padding:7}}><strong>{r.label}</strong><br/><span style={{color:p.theme.inkSoft}}>{r.note}</span></td><td style={{padding:7}}>{r.fit.toFixed(0)}/100</td><td style={{padding:7}}>{r.usedAcres.toFixed(1)}</td><td style={{padding:7}}>{r.eligible?money(r.noi):"$0"}</td><td style={{padding:7}}>{r.dscr?.toFixed(2) ?? "—"}x</td><td style={{padding:7}}>{r.eligible?"Screenable":"Blocked pending evidence"}</td></tr>)}</tbody></table></div>
  <div style={{padding:12,border:`1px solid ${p.theme.cellBorder}`,borderRadius:9}}><strong>Highest-ranked diversified screen</strong><p style={{margin:"5px 0",fontSize:12}}>{m.diversified.map(r=>`${Math.round(r.portfolioShare*100)}% ${r.label}`).join(" + ") || "No feasible portfolio yet"}</p><span style={{fontSize:12}}>Modeled NOI {money(m.portfolioNoi)} · DSCR {m.portfolioDscr?.toFixed(2) ?? "—"}x</span></div>
  <p style={{margin:0,fontSize:11.5,color:p.theme.inkSoft}}>{m.warning}</p>
 </section>;
}
