import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

/**
 * Apply Canonical Governance Migrations
 *
 * Master Volume Governance:
 * - Vol I: applies constitutional backend state authority deliberately.
 * - Vol II: creates regulated-data, entitlement, application, document,
 *   connector, rule, overlay, review, adverse