export type OpportunityKey = "row-crops"|"cash-rent"|"hay-pasture"|"alfalfa-small-square"|"livestock"|"poultry"|"specialty-crops"|"greenhouse"|"solar-lease"|"agrivoltaics"|"battery-storage"|"mixed-portfolio";
export type OpportunityAssumptions = { acres:number; purchasePrice:number; debtService:number; waterScore:number; laborCapacity:number; capitalCapacity:number; marketAccess:number; gridEvidence:boolean; solarZoningEvidence:boolean; hayYieldTonsPerAcre?:number; hayBaleWeightLb?:number; haySummerPrice?:number; hayWinterPrice?:number; hayWinterShare?:number; hayVariableCostPerAcre?:number; hayHandlingCostPerBale?:number; hayShrinkPct?:number; irrigationInstallCost?:number; irrigationAnnualPowerCost?:number; irrigationAnnualMaintenanceCost?:number; soilSuitability?:number; weatherSuitability?:number; localMarketDepth?:number; competitionPressure?:number; };
type Candidate = { key:OpportunityKey; label:string; acresShare:number; grossPerAcre:number; costPct:number; startupPerAcre:number; labor:number; water:number; market:number; soil:number; weather:number; yearsToCash:number; gate?:"grid"|"solar"; note:string };
const CANDIDATES: Candidate[] = [
 {key:"row-crops",label:"Commodity row crops",acresShare:.8,grossPerAcre:700,costPct:.82,startupPerAcre:350,labor:35,water:45,market:40,soil:55,weather:55,yearsToCash:1,note:"Corn, soybeans, wheat, or contracted rotation."},
 {key:"cash-rent",label:"Lease tillable acreage",acresShare:.8,grossPerAcre:200,costPct:.08,startupPerAcre:5,labor:5,water:5,market:20,soil:25,weather:25,yearsToCash:1,note:"Lower operating risk; depends on local lease evidence."},
 {key:"hay-pasture",label:"Bulk hay and managed pasture",acresShare:.7,grossPerAcre:520,costPct:.55,startupPerAcre:220,labor:30,water:30,market:35,soil:40,weather:45,yearsToCash:1,note:"Generic bulk-forage or pasture benchmark; not a premium small-square-bale model."},
 {key:"alfalfa-small-square",label:"Irrigated alfalfa — premium small squares",acresShare:.7,grossPerAcre:0,costPct:0,startupPerAcre:650,labor:82,water:78,market:72,soil:70,weather:65,yearsToCash:1,note:"Bale-level model using irrigated yield, bale weight, seasonal prices, handling, storage, and shrink."},
 {key:"livestock",label:"Grazing livestock enterprise",acresShare:.55,grossPerAcre:1100,costPct:.66,startupPerAcre:950,labor:70,water:65,market:55,soil:45,weather:45,yearsToCash:2,note:"Requires fencing, handling, water, winter feed, and operator capacity."},
 {key:"poultry",label:"Contract or independent poultry",acresShare:.08,grossPerAcre:9000,costPct:.72,startupPerAcre:12000,labor:75,water:75,market:80,soil:20,weather:35,yearsToCash:2,note:"High gross density, but integrator contract, permits, buildings, utilities, and litter plan control."},
 {key:"specialty-crops",label:"Vegetables, berries, flowers, or orchard",acresShare:.18,grossPerAcre:10500,costPct:.68,startupPerAcre:5000,labor:90,water:85,market:85,soil:75,weather:70,yearsToCash:2,note:"Higher potential margin with much higher labor, irrigation, post-harvest, and market risk."},
 {key:"greenhouse",label:"Greenhouse / controlled environment",acresShare:.03,grossPerAcre:140000,costPct:.78,startupPerAcre:450000,labor:95,water:70,market:90,soil:15,weather:25,yearsToCash:3,note:"Very high capital and management intensity; power and offtake matter more than raw acreage."},
 {key:"solar-lease",label:"Utility or community solar lease",acresShare:.25,grossPerAcre:1400,costPct:.05,startupPerAcre:10,labor:3,water:0,market:10,soil:10,weather:20,yearsToCash:4,gate:"solar",note:"Credit only after zoning, utility territory, interconnection, setbacks, and lease terms are evidenced."},
 {key:"agrivoltaics",label:"Agrivoltaics with grazing or crops",acresShare:.18,grossPerAcre:1900,costPct:.25,startupPerAcre:300,labor:25,water:20,market:25,soil:35,weather:35,yearsToCash:4,gate:"solar",note:"Combines energy rent with compatible agricultural use; design and program eligibility control."},
 {key:"battery-storage",label:"Battery energy storage site",acresShare:.02,grossPerAcre:55000,costPct:.18,startupPerAcre:50,labor:2,water:0,market:5,soil:5,weather:10,yearsToCash:4,gate:"grid",note:"Highly site-specific; no value should be credited without substation/interconnection and zoning evidence."},
];
const clamp=(n:number,a=0,b=100)=>Math.max(a,Math.min(b,n));
export function optimizeAgriculturalOpportunities(a:OpportunityAssumptions){
 const ranked=CANDIDATES.map(c=>{
  const eligible= c.gate==="grid"?a.gridEvidence:c.gate==="solar"?(a.gridEvidence&&a.solarZoningEvidence):true;
  const usedAcres=a.acres*c.acresShare;
  const hayYield=a.hayYieldTonsPerAcre ?? 5;
  const baleWeight=Math.max(35,a.hayBaleWeightLb ?? 55);
  const balesPerTon=2000/baleWeight;
  const winterShare=clamp(a.hayWinterShare ?? 35,0,100)/100;
  const averageBalePrice=(a.haySummerPrice ?? 20)*(1-winterShare)+(a.hayWinterPrice ?? 35)*winterShare;
  const shrink=clamp(a.hayShrinkPct ?? 8,0,50)/100;
  const sellableBales=usedAcres*hayYield*balesPerTon*(1-shrink);
  const gross=eligible?(c.key==="alfalfa-small-square"?sellableBales*averageBalePrice:usedAcres*c.grossPerAcre):0;
  const irrigationDependent=c.water>=60;
  const irrigationAnnual=irrigationDependent?((a.irrigationAnnualPowerCost ?? 30000)+(a.irrigationAnnualMaintenanceCost ?? 10000)):0;
  const baseOpex=c.key==="alfalfa-small-square"
    ? usedAcres*(a.hayVariableCostPerAcre ?? 1400)+sellableBales*(a.hayHandlingCostPerBale ?? 2)
    : gross*c.costPct;
  const opex=baseOpex+irrigationAnnual;
  const noi=gross-opex;
  const irrigationCapex=irrigationDependent?(a.irrigationInstallCost ?? 450000):0;
  const startup=usedAcres*c.startupPerAcre+irrigationCapex;
  const soilFit=clamp((a.soilSuitability ?? 50)-c.soil+50);
  const weatherFit=clamp((a.weatherSuitability ?? 50)-c.weather+50);
  const marketFit=clamp((a.localMarketDepth ?? a.marketAccess)-c.market+50-(a.competitionPressure ?? 40)*.25);
  const operationalFit=clamp(50+(a.waterScore-c.water)*.22+(a.laborCapacity-c.labor)*.25+(a.capitalCapacity-Math.min(100,startup/5000))*.18+marketFit*.12+soilFit*.12+weatherFit*.11-(c.yearsToCash-1)*4+(eligible?0:-45));
  const fit=Math.min(operationalFit, soilFit<25||weatherFit<25?35:100);
  const riskAdjustedNoi=noi*(fit/100);
  const returnOnStartup=startup>0?noi/startup:null;
  return {...c,eligible,usedAcres,gross,opex,noi,startup,fit,soilFit,weatherFit,marketFit,riskAdjustedNoi,irrigationCapex,irrigationAnnual,returnOnStartup,dscr:a.debtService>0?noi/a.debtService:null,modelDetails:c.key==="alfalfa-small-square"?{hayYield,baleWeight,balesPerTon,sellableBales,averageBalePrice,winterShare,shrink}:null};
 }).sort((x,y)=>(y.riskAdjustedNoi+y.fit*1000)-(x.riskAdjustedNoi+x.fit*1000));
 const feasible=ranked.filter(r=>r.eligible&&r.fit>=45&&r.soilFit>=35&&r.weatherFit>=35&&r.marketFit>=35);
 const diversified=feasible.slice(0,3).map((r,i)=>({...r,portfolioShare:[.5,.3,.2][i]||0}));
 const portfolioNoi=diversified.reduce((s,r)=>s+r.noi*r.portfolioShare,0);
 const mostProfitable=[...ranked].filter(r=>r.eligible).sort((x,y)=>y.noi-x.noi)[0]??null; const mostFeasible=[...ranked].filter(r=>r.eligible).sort((x,y)=>y.fit-x.fit)[0]??null; const bestRiskAdjusted=[...ranked].filter(r=>r.eligible).sort((x,y)=>y.riskAdjustedNoi-x.riskAdjustedNoi)[0]??null; return {ranked,diversified,portfolioNoi,portfolioDscr:a.debtService>0?portfolioNoi/a.debtService:null,mostProfitable,mostFeasible,bestRiskAdjusted,warning:"Screening model only. Rankings change when soils, water, labor, contracts, market access, zoning, interconnection, and operator financials are verified."};
}
