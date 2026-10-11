import type { Role } from "@/lib/api/types";

export function canCreateProject(role: Role | string | null | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
