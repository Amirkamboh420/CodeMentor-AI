/**
 * Utilities for exporting and importing conversations as JSON.
 *
 * The JSON format is self-contained: it includes the conversation metadata
 * and all its messages, so it can be backed up, transferred between devices,
 * or re-imported into a fresh database.
 */

export interface ExportableMessage {
  role: "user" | "assistant";
  content: string;
  requestType?: string;
  prompt?: string;
  code?: string;
  filePath?: string;
  fileType?: string;
  feedback?: string;
  createdAt: string; // ISO string
}

export interface ExportableConversation {
  version: 1;
  title: string;
  requestType: string;
  techStack: string;
  developerLevel: string;
  pinned: boolean;
  tags: string;
  exportedAt: string; // ISO string
  messages: ExportableMessage[];
}

/**
 * Trigger a client-side download of a JSON file.
 */
export function downloadJson(filename: string, data: unknown) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Parse and validate a JSON string into an ExportableConversation.
 * Returns null if the input is invalid.
 */
export function parseConversationJson(
  text: string
): ExportableConversation | null {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.messages)) return null;
    if (typeof parsed.title !== "string") return null;
    return parsed as ExportableConversation;
  } catch {
    return null;
  }
}

/**
 * Read a File object and parse it as a conversation JSON.
 * Returns null if the file is invalid.
 */
export function readConversationFile(file: File): Promise<ExportableConversation | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      resolve(parseConversationJson(text));
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}
