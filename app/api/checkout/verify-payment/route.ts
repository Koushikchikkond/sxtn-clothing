import { NextRequest } from "next/server";
import { POST as standardVerifyPayment } from "@/app/api/verify-payment/route";

export async function POST(req: NextRequest) {
  return standardVerifyPayment(req);
}
