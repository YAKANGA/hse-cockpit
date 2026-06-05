import { reportCatalog } from "@/lib/operations-data";

export async function GET() {
  return Response.json({ reports: reportCatalog });
}
