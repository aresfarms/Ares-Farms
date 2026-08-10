import { refreshAllSources } from "../lib/property/sourceRefresh";

async function main(): Promise<void> {
  const result = await refreshAllSources();
  console.log(JSON.stringify(result, null, 1));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
