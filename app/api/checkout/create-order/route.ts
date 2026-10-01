import { NextRequest } from "next/server";
import { POST as standardCreateOrder } from "@/app/api/create-order/route";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return standardCreateOrder(req);
}
