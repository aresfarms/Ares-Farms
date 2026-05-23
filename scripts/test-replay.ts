import { runPipeline } from '../src/lib/pipeline/orchestrator';
import { loadReplay } from '../src/lib/replay/loadReplay';

async function main() {
  console.log('🚀 Running replay test...\n');

  const result = await runPipeline({
    userId: 'replay-test-001',

    name: 'Replay Test Farm',

    location: {
      state: 'MD',
      county: 'Carroll',
      region: 'Mid-Atlantic',
      country: 'US'
    },

    financials: {
      revenue: 250000,
      expenses: 120000
    },

    metadata: {
      type: 'row-crop',
      acres: 60
    }
  });

  console.log('TRACE ID:\n');
  console.log(result.traceId);

  console.log('\n\nLOADING REPLAY...\n');

  const replay = await loadReplay(result.traceId);

  console.dir(replay, { depth: null });
}

main().catch(console.error);
