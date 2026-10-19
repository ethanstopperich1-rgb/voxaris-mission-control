export type SeoAction =
  | { readonly kind: "record_observation" }
  | { readonly kind: "create_internal_draft" }
  | { readonly kind: "edit_live_page" }
  | { readonly kind: "publish" }
  | { readonly kind: "send_outreach" }
  | { readonly kind: "purchase_link" }
  | { readonly kind: "change_tracking_or_billing" }
  | { readonly kind: "delete_or_redirect_page" };

export interface ActionAuthorization {
  readonly canAutoExecute: boolean;
  readonly requiresHumanApproval: boolean;
  readonly reason: string;
}

/** Initial policy is deliberately conservative; model output cannot loosen it. */
export function authorizeSeoAction(kind: SeoAction["kind"]): ActionAuthorization {
  if (kind === "record_observation") return { canAutoExecute: true, requiresHumanApproval: false, reason: "Internal, append-only observation" };
  if (kind === "create_internal_draft") return { canAutoExecute: true, requiresHumanApproval: false, reason: "Internal draft only; publication remains separately gated" };
  return { canAutoExecute: false, requiresHumanApproval: true, reason: `Human approval is required for ${kind}` };
}
