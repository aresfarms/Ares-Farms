import * as path from "node:path";

const DEFAULT_RUNTIME_STATE_DIR = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "data",
);

export function runtimeStateDir(): string {
  const configured = process.env.FURLONG_RUNTIME_STATE_DIR?.trim();
  return configured ? path.resolve(configured) : DEFAULT_RUNTIME_STATE_DIR;
}

export function runtimeStatePath(...parts: string[]): string {
  return path.join(runtimeStateDir(), ...parts);
}
