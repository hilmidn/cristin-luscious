// Kontak pemesan terakhir (web publik) — disimpan di localStorage supaya
// repeat-order tinggal checkout tanpa mengetik ulang nama & nomor HP.
// Snapshot berbasis string (useSyncExternalStore-friendly, hydration aman).

const CONTACT_KEY = "cl-contact-v1";

export type SavedContact = { name: string; phone: string };

export function getContactSnapshot(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(CONTACT_KEY) ?? "";
}

export function parseContactSnapshot(raw: string): SavedContact | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SavedContact>;
    const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
    const phone = typeof parsed.phone === "string" ? parsed.phone.trim() : "";

    if (!name || !phone) return null;

    return { name, phone };
  } catch {
    return null;
  }
}

export function saveContact(name: string, phone: string) {
  window.localStorage.setItem(
    CONTACT_KEY,
    JSON.stringify({ name: name.trim(), phone: phone.trim() } satisfies SavedContact),
  );
}
