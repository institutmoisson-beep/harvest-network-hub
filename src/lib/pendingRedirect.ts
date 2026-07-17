const KEY = "im_pending_redirect";

/** Remembers a page to send the user back to once they've registered/logged in. */
export function setPendingRedirect(path: string | null) {
  if (!path) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    /* ignore storage errors (private browsing, etc.) */
  }
}

export function getPendingRedirect(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPendingRedirect() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
