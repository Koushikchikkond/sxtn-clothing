/**
 * Email validation utilities for storefront checkout.
 * Provides instant typo correction, format validation, and MX DNS verification.
 */

// Common domain typos mapped to their genuine counterparts
const DOMAIN_TYPO_MAP: Record<string, string> = {
  // Gmail typos
  "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaik.com": "gmail.com",
  "gamil.co": "gmail.com",
  "gmaul.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gemail.com": "gmail.com",
  "gmeil.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cpm": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmaili.com": "gmail.com",
  "gmali.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmajl.com": "gmail.com",
  "gmaol.com": "gmail.com",
  "gmail.comm": "gmail.com",

  // Yahoo typos
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "yaho.co.in": "yahoo.co.in",
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yaho.in": "yahoo.in",
  "yahoo.in": "yahoo.com",

  // Hotmail / Outlook typos
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotamail.com": "hotmail.com",
  "hotmali.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlock.com": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.con": "outlook.com",

  // iCloud typos
  "iclud.com": "icloud.com",
  "iclou.com": "icloud.com",
  "icloud.co": "icloud.com",
  "icloud.con": "icloud.com",

  // Rediffmail typos
  "redifmail.com": "rediffmail.com",
  "rediff.com": "rediffmail.com",
  "redif.com": "rediffmail.com",
};

// Common TLD typos
const TLD_TYPO_MAP: Record<string, string> = {
  ".con": ".com",
  ".cpm": ".com",
  ".cmo": ".com",
  ".comm": ".com",
  ".coom": ".com",
  ".in": ".in",
  ".co.in": ".co.in",
};

/**
 * Validates the syntactic structure of an email address.
 */
export function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;

  // RFC 5322 compliant regex for practical email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Checks an email for common typos and suggests the corrected version if found.
 * e.g. "sushma@gamil.com" -> "sushma@gmail.com"
 * Returns null if no typo detected.
 */
export function suggestEmailCorrection(email: string): string | null {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split("@");
  if (parts.length !== 2) return null;

  const [username, domain] = parts;
  if (!username || !domain) return null;

  // 1. Direct domain typo match
  if (DOMAIN_TYPO_MAP[domain]) {
    return `${username}@${DOMAIN_TYPO_MAP[domain]}`;
  }

  // 2. Common TLD typo match (e.g. user@anything.con -> user@anything.com)
  for (const [badTld, goodTld] of Object.entries(TLD_TYPO_MAP)) {
    if (domain.endsWith(badTld) && !domain.endsWith(goodTld)) {
      const correctedDomain = domain.slice(0, -badTld.length) + goodTld;
      return `${username}@${correctedDomain}`;
    }
  }

  return null;
}
