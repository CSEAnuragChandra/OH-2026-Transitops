// src/lib/rbac.ts
// Central Role-Based Access Control configuration.
// DRIVER role intentionally has NO frontend routes — it is blocked at middleware level.

import type { Role } from "@prisma/client";

/**
 * Maps each route prefix to the roles allowed to access it.
 * A role not listed for a route will be redirected to /unauthorized.
 */
export const ROUTE_ROLES: Record<string, Role[]> = {
  "/dashboard": ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"],
  "/fleet":      ["FLEET_MANAGER", "DISPATCHER"],
  "/drivers":    ["FLEET_MANAGER", "SAFETY_OFFICER"],
  "/trips":      ["FLEET_MANAGER", "DISPATCHER"],
  "/maintenance":["FLEET_MANAGER", "SAFETY_OFFICER"],
  "/fuel":       ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
  "/expenses":   ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
  "/safety":     ["FLEET_MANAGER", "SAFETY_OFFICER"],
};

/**
 * Staff roles — the only roles with frontend access.
 * DRIVER is intentionally excluded.
 */
export const STAFF_ROLES: Role[] = [
  "FLEET_MANAGER",
  "DISPATCHER",
  "SAFETY_OFFICER",
  "FINANCIAL_ANALYST",
];

/**
 * Returns true if the given role is allowed to access the given pathname.
 * Matches by route prefix (e.g. "/fleet/new" matches the "/fleet" key).
 */
export function hasAccess(role: Role, pathname: string): boolean {
  // DRIVER has no frontend access at all
  if (role === "DRIVER") return false;

  // Find the longest matching route prefix
  const matchedRoute = Object.keys(ROUTE_ROLES)
    .filter((route) => pathname === route || pathname.startsWith(route + "/"))
    .sort((a, b) => b.length - a.length)[0];

  if (!matchedRoute) return false;

  return ROUTE_ROLES[matchedRoute].includes(role);
}

/**
 * Returns the default redirect URL for a given role after login.
 */
export function getDefaultRedirect(role: Role): string {
  if (role === "DRIVER") return "/driver";
  return "/dashboard";
}
