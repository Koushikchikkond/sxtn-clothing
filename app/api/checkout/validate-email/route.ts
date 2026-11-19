import { NextRequest, NextResponse } from "next/server";
import dns from "dns";
import { isValidEmailFormat, suggestEmailCorrection } from "@/lib/email-validator";

export const runtime = "nodejs";

const resolveMxWithTimeout = (domain: string, timeoutMs = 1500): Promise<dns.MxRecord[]> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("DNS_TIMEOUT"));
    }, timeoutMs);

    dns.promises
      .resolveMx(domain)
      .then((records) => {
        clearTimeout(timer);
        resolve(records);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ valid: false, reason: "Email is required" }, { status: 400 });
    }

    const trimmed = email.trim().toLowerCase();

    // 1. Syntax check
    if (!isValidEmailFormat(trimmed)) {
      return NextResponse.json({
        valid: false,
        reason: "Please enter a valid email address (e.g. name@domain.com)",
      });
    }

    const suggestion = suggestEmailCorrection(trimmed);

    // 2. Domain check
    const domain = trimmed.split("@")[1];
    if (!domain) {
      return NextResponse.json({ valid: false, reason: "Invalid email domain" });
    }

    // Known valid major domains: skip DNS lookup to be instant (0ms)
    const instantValidDomains = new Set([
      "gmail.com",
      "yahoo.com",
      "yahoo.co.in",
      "outlook.com",
      "hotmail.com",
      "icloud.com",
      "rediffmail.com",
      "proton.me",
      "protonmail.com",
    ]);

    if (instantValidDomains.has(domain)) {
      return NextResponse.json({
        valid: true,
        suggestion,
      });
    }

    // 3. MX DNS check for custom or lesser-known domains
    try {
      const mxRecords = await resolveMxWithTimeout(domain, 1500);
      if (!mxRecords || mxRecords.length === 0) {
        return NextResponse.json({
          valid: false,
          reason: `The domain "${domain}" cannot receive emails. Please check for typos.`,
          suggestion,
        });
      }
    } catch (dnsErr: any) {
      // ENOTFOUND means the domain doesn't exist
      if (dnsErr.code === "ENOTFOUND" || dnsErr.code === "ENODATA" || dnsErr.code === "SERVFAIL") {
        return NextResponse.json({
          valid: false,
          reason: `The domain "${domain}" does not exist. Please check your spelling.`,
          suggestion,
        });
      }
      // If DNS times out or has a network issue, fail open so legitimate customers are never blocked
      console.warn("[validate-email] DNS check warning:", dnsErr.message || dnsErr);
    }

    return NextResponse.json({
      valid: true,
      suggestion,
    });
  } catch (err: unknown) {
    console.error("[POST /api/checkout/validate-email] Error:", err);
    // Fail open on unexpected errors to protect checkout conversion
    return NextResponse.json({ valid: true });
  }
}
