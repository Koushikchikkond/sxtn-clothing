import { NextRequest, NextResponse } from "next/server";
import { sendTestEmail, DEFAULT_FROM_EMAIL } from "@/lib/email/resend";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const to = searchParams.get("to");
  const senderType = (searchParams.get("senderType") || "default") as any;
  const templateType = (searchParams.get("templateType") || "ping") as any;

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

  const result = await sendTestEmail({ to, senderType, templateType });

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        from: (result as any).from,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Test email (${templateType}) sent successfully to ${to} from ${(result as any).from}!`,
    emailId: (result as any).id,
    from: (result as any).from,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { to, senderType, templateType, cancellationReason, courierName, trackingNumber } = body;

    if (!to || typeof to !== "string" || !to.includes("@")) {
      return NextResponse.json(
        { error: "A valid 'to' email address is required in request body." },
        { status: 400 }
      );
    }

    const result = await sendTestEmail({
      to,
      senderType,
      templateType,
      cancellationReason,
      courierName,
      trackingNumber,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          from: (result as any).from,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email (${templateType || "ping"}) sent successfully to ${to} from ${(result as any).from}!`,
      emailId: (result as any).id,
      from: (result as any).from,
      subject: (result as any).subject,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send test email" },
      { status: 500 }
    );
  }
}
