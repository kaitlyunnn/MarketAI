import { type User } from "@supabase/supabase-js";

export const FREE_PLAN = "free";
export const PRO_PLAN = "pro";

export type UserPlan = typeof FREE_PLAN | typeof PRO_PLAN;

function getUserMetadata(user: User | null | undefined) {
  return user?.user_metadata as Record<string, unknown> | undefined;
}

export function getUserPlan(user: User | null | undefined): UserPlan {
  return getUserMetadata(user)?.plan === PRO_PLAN ? PRO_PLAN : FREE_PLAN;
}

export function isProUser(user: User | null | undefined) {
  return getUserPlan(user) === PRO_PLAN;
}

export function getAccessibleProductsTable(user: User | null | undefined) {
  return isProUser(user) ? "ProProducts" : "products";
}
