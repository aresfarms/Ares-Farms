export type OpportunityKey = "row-crops"|"cash-rent"|"hay-pasture"|"livestock"|"poultry"|"specialty-crops"|"greenhouse"|"solar-lease"|"agrivoltaics"|"battery-storage"|"mixed-portfolio";
export type OpportunityAssumptions = { acres:number; purchasePrice:number; debtService:number; waterScore:number; laborCapacity:number; capitalCapacity:number; marketAccess:number; gridEvidence:boolean; solarZoningEvidence:boolean; };
type Candidate = { key:OpportunityKey; label:string; acresShare:number; grossPerAcre:number; costPct:number; startupPerAcre:number; labor:number; water:number; market:number; yearsToCash:number; gate?:"grid"|"solar"; note:string };
const CANDIDATES: Candidate[] = [
 {key:"row-crops",label:"Commodity row crops",acresShare:.8,grossPerAcre:700,costPct:.82,startupPerAcre:350,labor:35,water:45,market:40,yearsToCash:1,note:"Corn, soybeans, wheat, or contracted rotation."},
 {key:"cash-rent",label:"Lease tillable acreage",acresShare:.8,grossPerAcre:200,costPct:.08,startupPerAcre:5,labor:5,water:5,market:20,yearsToCash:1,note:"Lower operating risk; depends on local lease evidence."},
 {key:"hay-pasture",label:"Hay and managed pasture",acresShare:.7,grossPerAcre:520,costPct:.55,startupPerAcre:220,labor:30,water:30,market:35,yearsToCash:1,note:"Can support forage sales or livestock integration."},
 {key:"livestock",label:"Grazing livestock enterprise",acresShare:.55,grossPerAcre:1100,costPct:.66,startupPerAcre:950,labor:70,water:65,market:55,yearsToCash:2,note:"Requires fencing, handling, water, winter feed, and operator capacity."},
 {key:"poultry",label:"Contract or independent poultry",acresShare:.08,grossPerAcre:9000,costPct:.72,startupPerAcre:12000,labor:75,water:75,market:80,yearsToCash:2,note:"High gross density, but integrator contract, permits, buildings, utilities, and litter plan control."},
 {key:"specialty-crops",label:"Vegetables, berries, flowers, or orchard",acresShare:.18,grossPerAcre:10500,costPct:.68,startupPerAcre:5000,labor:90,water:85,market:85,yearsToCash:2,note:"Higher potential margin with much higher labor, irrigation, post-harvest, and market risk."},
 {key:"greenhouse",label:"Greenhouse / controlled environment",acresShare:.03,grossPerAcre:140000,costPct:.78,startupPerAcre:450000,labor:95,water:70,market:90,yearsToCash:3,note:"Very high capital and management intensity; power and offtake matter more than raw acreage."},
 {key:"solar-lease",label:"Utility or community solar lease",acresShare:.25,grossPerAcre:1400,costPct:.05,startupPerAcre:10,labor:3,water:0,market:10,yearsToCash:4,gate:"solar",note:"Credit only after zoning, utility territory, interconnection, setbacks, and lease terms are evidenced."},
 {key:"agrivoltaics",label:"Agrivoltaics with grazing or crops",acresShare:.18,grossPerAcre:1900,costPct:.25,startupPerAcre:300,labor:25,water:20,market:25,yearsToCash:4,gate:"solar",note:"Combines energy rent with compatible agricultural use; design and program eligibility control."},
 {key:"battery-storage",label:"Battery energy storage site",acresShare:.02,grossPerAcre:55000,costPct:.18,startupPerAcre:50,labor:2,water:0,market:5,yearsToCash:4,gate:"grid",note:"Highly site-specific; no value should be credited without substation/interconnection and zoning evidence."},
];
const clamp=(n:number,a=0,b=100)=>Math.max(a,Math.min(b,n));
export function optimizeAgriculturalOpportunities(a:OpportunityAssumptions){
 const ranked=CANDIDATES.map(c=>{
  const eligible= c.gate==="grid"?a.gridEvidence:c.gate==="solar"?(a.gridEvidence&&a.solarZoningEvidence):true;
  const usedAcres=a.acres*c.acresShare;
  const gross=eligible?usedAcres*c.grossPerAcre:0;
  const opex=gross*c.costPct;
  const noi=gross-opex;
  const startup=usedAcres*c.startupPerAcre;
  const fit=clamp(50+(a.waterScore-c.water)*.25+(a.laborCapacity-c.labor)*.22+(a.capitalCapacity-Math.min(100,c.startupPerAcre/5000))*0.2+(a.marketAccess-c.market)*.2-(c.yearsToCash-1)*4+(eligible?0:-45));
  const returnOnStartup=startup>0?noi/startup:null;
  return {...c,eligible,usedAcres,gross,opex,noi,startup,fit,returnOnStartup,dscr:a.debtService>0?noi/a.debtService:null};
 }).sort((x,y)=>(y.fit*0.45+y.noi/1000)-(x.fit*0.45+x.noi/1000));
 const feasible=ranked.filter(r=>r.eligible&&r.fit>=45);
 const diversified=feasible.slice(0,3).map((r,i)=>({...r,portfolioShare:[.5,.3,.2][i]||0}));
 const portfolioNoi=diversified.reduce((s,r)=>s+r.noi*r.portfolioShare,0);
 return {ranked,diversified,portfolioNoi,portfolioDscr:a.debtService>0?portfolioNoi/a.debtService:null,warning:"Screening model only. Rankings change when soils, water, labor, contracts, market access, zoning, interconnection, and operator financials are verified."};
}
