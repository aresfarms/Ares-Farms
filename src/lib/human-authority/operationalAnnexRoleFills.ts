import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  type HumanAuthorityRoleFill,
  type HumanAuthorityRoleId,
} from "./humanAuthorityRegistryRuntime";

type AnnexAuthority = {
  status: string;
  clearsModule45Roles?: string[];
  holder?: string;
};

type AnnexShape = {
  activeFillAuthorities?: AnnexAuthority[];
  externalAuthorities?: AnnexAuthority[];
  module45RolesNotInAlpha?: {
    roleId: string;
    category: string;
    reason?: string;
  }[];
};

export function loadOperationalAnnexFilledRoles(
  root = process.cwd(),
): HumanAuthorityRoleFill[] {
  const annexPath = path.join(
    root,
    "docs",
    "governance",
    "VOL_VII_OPERATIONAL_ANNEX.json",
  );
  if (!existsSync(annexPath)) return [];

  let raw: AnnexShape;
  try {
    raw = JSON.parse(readFileSync(annexPath, "utf8")) as AnnexShape;
  } catch {
    return [];
  }

  const fills = new Map<HumanAuthorityRoleId, HumanAuthorityRoleFill>();
  const record = (roleId: string, holder: string, category: string) => {
    const key = roleId as HumanAuthorityRoleId;
    const existing = fills.get(key);
    if (existing) {
      existing.filledByCount += 1;
      existing.recordedBy = `${existing.recordedBy} + ${holder}`;
      return;
    }
    fills.set(key, {
      roleId: key,
      filledByCount: 1,
      recordedBy: `${holder} (${category})`,
      recordedAt: "2026-06-04",
    });
  };

  for (const [list, category] of [
    [raw.activeFillAuthorities ?? [], "ACTIVE_FILL"],
    [raw.externalAuthorities ?? [], "EXTERNAL"],
  ] as const) {
    for (const authority of list) {
      for (const roleId of authority.clearsModule45Roles ?? []) {
        record(roleId, authority.holder ?? "(unnamed)", category);
      }
    }
  }

  for (const role of raw.module45RolesNotInAlpha ?? []) {
    if (
      role.category === "UNFILLED_BY_DESIGN_FOR_ALPHA" ||
      role.category === "HELD_FOR_ALPHA"
    ) {
      record(
        role.roleId,
        `${role.category}: ${role.reason ?? ""}`,
        role.category,
      );
    }
  }

  return [...fills.values()];
}
