import { moduleManifests } from "@/lib/modules/moduleRegistry";

import {
  InternalModuleViewModel,
  toInternalModuleViewModel,
} from "@/lib/dto/shared";

/**
 * Internal DTO Layer
 *
 * Internal views may include operational dependencies and handoff metadata, but
 * still avoid exposing raw backend records directly to page components.
 */

export function buildInternalModuleViews(): InternalModuleViewModel[] {
  return moduleManifests
    .filter((manifest) => manifest.audience.includes("internal"))
    .map(toInternalModuleViewModel);
}
