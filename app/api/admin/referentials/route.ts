import { referentials } from "@/lib/operations-data";

export async function GET() {
  return Response.json({ referentials });
}
