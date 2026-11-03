export function isEmbeddedBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|WhatsApp|Twitter|LinkedInApp|Snapchat|MicroMessenger|Pinterest|TikTok|musical_ly|GSA\/|; wv\)|WebView/i.test(
    ua,
  );
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    navigatorWithStandalone.standalone === true ||
    window.matchMedia?.("(display-mode: standalone)")?.matches === true
  );
}

export function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Google refuses OAuth inside many embedded webviews (WhatsApp, Instagram,
 * Facebook, LinkedIn, etc.). Safari/Chrome are the reliable path.
 */
export function googleSignInMayBeBlocked(): boolean {
  return isEmbeddedBrowser();
}
