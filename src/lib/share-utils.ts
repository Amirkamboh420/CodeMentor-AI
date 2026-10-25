/**
 * Utilities for sharing conversations via URL.
 *
 * A conversation is encoded as base64 JSON in the URL hash fragment
 * (e.g. /share#<base64>), so no backend storage is needed for sharing.
 * The hash is never sent to the server, keeping it fully client-side.
 */

export interface ShareableMessage {
  role: "user" | "assistant";
  content: string;
  requestType?: string;
  createdAt?: number;
}

export interface ShareableConversation {
  title: string;
  requestType?: string;
  messages: ShareableMessage[];
  createdAt: number;
}

/**
 * Encode a shareable conversation into a URL-safe base64 string.
 */
export function encodeConversation(conv: ShareableConversation): string {
  const json = JSON.stringify(conv);
  // Use btoa for browser; handle Unicode via encodeURIComponent
  const unicodeSafe = encodeURIComponent(json);
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, "utf-8").toString("base64");
  void unicodeSafe; // kept for reference
  // Make URL-safe: replace + with -, / with _, strip padding =
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode a URL-safe base64 string back into a shareable conversation.
 * Returns null if the input is invalid.
 */
export function decodeConversation(encoded: string): ShareableConversation | null {
  try {
    // Restore standard base64
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    // Re-add padding
    while (b64.length % 4) b64 += "=";
    const json =
      typeof atob !== "undefined"
        ? decodeURIComponent(escape(atob(b64)))
        : Buffer.from(b64, "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.messages)) return null;
    return parsed as ShareableConversation;
  } catch {
    return null;
  }
}

/**
 * Build a full shareable URL for a conversation.
 */
export function buildShareUrl(conv: ShareableConversation): string {
  const encoded = encodeConversation(conv);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/share#${encoded}`;
}

/**
 * Read the encoded conversation from the current URL hash.
 */
export function readShareFromHash(): ShareableConversation | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  return decodeConversation(hash);
}
