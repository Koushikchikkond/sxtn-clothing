import { NextRequest } from "next/server";
import { POST as standardCreateOrder } from "@/app/api/create-order/route";

export async function POST(req: NextRequest) {
  return standardCreateOrder(req);
}
