import { type UserPlan } from "./account";

export const FREE_CASE_STUDY_LIMIT = 2;

export function canAccessCaseStudy(index: number, plan: UserPlan) {
  return plan === "pro" || index < FREE_CASE_STUDY_LIMIT;
}
