const MEMBER_VIEW_KEY = "savannafx-member-view";

/** True in a tab opened as the member app. Does not affect the admin tab. */
export function isMemberView(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "member") {
    sessionStorage.setItem(MEMBER_VIEW_KEY, "1");
    return true;
  }
  return sessionStorage.getItem(MEMBER_VIEW_KEY) === "1";
}

export const MEMBER_APP_HREF = "/dashboard?view=member";
