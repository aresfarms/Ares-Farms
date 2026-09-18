/**
 * Read-only calculation discovery. This is an audit queue, not certification.
 * Scans executable TS/TSX/JS under src, excluding tests/scripts/generated data.
 * Conservative static import reachability from App Router entries; type-only
 * imports excluded. Dynamic/reflective edges and external libraries need review.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createHash } from "node:crypto";
const root = process.cwd();
const files: string[] = [];
function walk(dir: string) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) { if (!["scripts","__tests__","fixtures"].includes(item.name)) walk(file); }
    else if (/\.(tsx?|jsx?)$/.test(file) && !/\.d\.ts$|\.test\.|\.spec\.|Generated\.|\.generated\./.test(file)) files.push(path.relative(root,file));
  }
}
walk(path.join(root,"src")); files.sort();
const known = new Set(files);
const entries = files.filter(file => /src\/app\/.*\/(?:page|route|layout|loading|error|not-found)\.[tj]sx?$/.test(file));
const data = new Map<string, { file: string; sourceHash: string; arithmeticExpressions: number; mathCalls: number; reductionCalls: number; sourceLines: number[]; imports: string[]; unresolvedDynamicImports: number }>();
const arithmetic = new Set([ts.SyntaxKind.PlusToken,ts.SyntaxKind.MinusToken,ts.SyntaxKind.AsteriskToken,ts.SyntaxKind.SlashToken,ts.SyntaxKind.PercentToken,ts.SyntaxKind.AsteriskAsteriskToken,ts.SyntaxKind.PlusEqualsToken,ts.SyntaxKind.MinusEqualsToken,ts.SyntaxKind.AsteriskEqualsToken,ts.SyntaxKind.SlashEqualsToken]);
function resolve(from:string, spec:string) {
 const base = spec.startsWith("@/") ? path.join("src",spec.slice(2)) : spec.startsWith(".") ? path.join(path.dirname(from),spec) : null;
 return base ? [base,...[".ts",".tsx",".js",".jsx","/index.ts","/index.tsx"].map(ext=>base+ext)].find(candidate=>known.has(candidate)) : undefined;
}
for (const file of files) {
 const source = fs.readFileSync(path.join(root,file),"utf8");
 const ast = ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
 const result = { file,sourceHash:createHash("sha256").update(source).digest("hex"),arithmeticExpressions:0,mathCalls:0,reductionCalls:0,sourceLines:[] as number[],imports:[] as string[],unresolvedDynamicImports:0 };
 const lines = new Set<number>();
 function visit(node:ts.Node) {
   if (ts.isBinaryExpression(node) && arithmetic.has(node.operatorToken.kind)) { result.arithmeticExpressions++; lines.add(ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1); }
   if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
     if(node.expression.expression.getText(ast)==="Math"){result.mathCalls++;lines.add(ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1);}
     if(node.expression.name.text==="reduce"){result.reductionCalls++;lines.add(ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1);}
   }
   if ((ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) || ts.isExportDeclaration(node)) {
     const spec=node.moduleSpecifier;
     if(spec && ts.isStringLiteral(spec)) {const target=resolve(file,spec.text);if(target)result.imports.push(target);}
   }
   if(ts.isCallExpression(node) && node.expression.kind===ts.SyntaxKind.ImportKeyword){
     if(node.arguments.length===1&&ts.isStringLiteral(node.arguments[0])) {const target=resolve(file,node.arguments[0].text);if(target)result.imports.push(target);}
     else result.unresolvedDynamicImports++;
   }
   ts.forEachChild(node,visit);
 }
 visit(ast);result.sourceLines=[...lines].sort((a,b)=>a-b); data.set(file,result);
}
const reachable = new Set<string>();
function trace(file:string) { if(reachable.has(file))return;reachable.add(file);for(const target of data.get(file)?.imports??[])trace(target); }
entries.forEach(trace);
const rows=[...data.values()].filter(row=>row.arithmeticExpressions+row.mathCalls+row.reductionCalls>0).map(({imports,...row})=>({...row,routeReachability:reachable.has(row.file)?"static-path-found":"no-static-path-found",reviewStatus:"audit-required-not-certified"}));
console.log(JSON.stringify({version:"calculation-inventory-v1.0.0",allPlatformCalculationsCertified:false,scannedFiles:files.length,entryFiles:entries.length,candidateFiles:rows.length,reachableCandidateFiles:rows.filter(r=>r.routeReachability==="static-path-found").length,limitations:["Arithmetic candidates include strings, layout, dates and counters; counts are not a denominator of financial calculations.","Static paths are conservative module reachability, not proof that a function executes.","Reflection, dependency packages, database calculations, runtime configuration and external evidence require separate review.","Source hashes bind this discovery snapshot only. Focused regression results are recorded separately; passing them does not certify every expression."],rows:rows.slice(Number(process.argv[2] ?? 0), Number(process.argv[2] ?? 0) + Number(process.argv[3] ?? rows.length))}));
