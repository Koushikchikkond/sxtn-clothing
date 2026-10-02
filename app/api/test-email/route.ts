import { NextRequest, NextResponse } from "next/server";
import { sendTestEmail, DEFAULT_FROM_EMAIL } from "@/lib/email/resend";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json(
      {
        message: "Please specify a 'to' email address in the query parameter, e.g.: /api/test-email?to=yourname@example.com",
        apiKeyConfigured: !!process.env.RESEND_API_KEY,
        fromEmail: DEFAULT_FROM_EMAIL,
      },
      { status: 400 }
    );
  }

  const result = await sendTestEmail(to);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        help: "Note: In test mode without a verified domain, Resend only allows sending to the email address registered on your Resend account, from 'onboarding@resend.dev'.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Test email sent successfully to ${to}! Please check your inbox or spam folder.`,
    emailId: result.id,
    from: result.from,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const to = body.to;

    if (!to || typeof to !== "string" || !to.includes("@")) {
      return NextResponse.json(
        { error: "A valid 'to' email address is required in request body." },
        { status: 400 }
      );
    }

    const result = await sendTestEmail(to);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          help: "In test mode without a verified domain, Resend only allows sending to the email registered on your Resend account.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${to}!`,
      emailId: result.id,
      from: result.from,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send test email" },
      { status: 500 }
    );
  }
}
