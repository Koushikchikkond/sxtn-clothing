// shortcut: secondary phone stored in line2 bracket metadata alongside tag to avoid unapplied DB schema migration; move to addresses.secondary_phone column when running SQL migrations.

export interface AddressMeta {
  tag: string;
  secondaryPhone: string;
  cleanLine2: string;
}

export function parseAddressMeta(line2: string | null | undefined): AddressMeta {
  if (!line2) return { tag: "Home", secondaryPhone: "", cleanLine2: "" };
  const match = line2.match(/^\[(.*?)\]\s*(.*)$/);
  if (!match) return { tag: "Home", secondaryPhone: "", cleanLine2: line2.trim() };

  const parts = match[1].split("|").map((p) => p.trim());
  const altPart = parts.find((p) => /^Alt:\s*/i.test(p));
  const tag = parts.find((p) => !/^Alt:\s*/i.test(p)) || "Home";
  const secondaryPhone = altPart ? altPart.replace(/^Alt:\s*/i, "").trim() : "";

  return { tag, secondaryPhone, cleanLine2: match[2].trim() };
}

export function encodeAddressMeta(
  tag: string,
  cleanLine2: string,
  secondaryPhone?: string | null
): string {
  const normalizedTag = tag.trim() || "Home";
  const alt = secondaryPhone?.replace(/\D/g, "").trim();
  const bracket = alt ? `[${normalizedTag} | Alt: ${alt}]` : `[${normalizedTag}]`;
  const clean = cleanLine2.trim();
  return clean ? `${bracket} ${clean}` : bracket;
}

export function normalizePhoneDigits(phone: string | null | undefined): string {
  return (phone || "").replace(/\D/g, "");
}

export function validatePhonePair(
  primary: string,
  secondary?: string | null
): string | null {
  const pri = normalizePhoneDigits(primary);
  const sec = normalizePhoneDigits(secondary);

  if (!/^[0-9]{10}$/.test(pri)) {
    return "Please enter a valid 10-digit primary phone number.";
  }
  if (!/^[0-9]{10}$/.test(sec)) {
    return "Please enter a valid 10-digit secondary phone number.";
  }
  if (sec === pri) {
    return "Primary and secondary phone numbers cannot be the same.";
  }
  return null;
}
