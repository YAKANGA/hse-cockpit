import { requirePermission } from "@/lib/api-auth";
import { getImportedIndicatorMonthlyData } from "@/lib/import-store";

export async function GET(request: Request) {
  const auth = requirePermission(request, "module:view");
  if (auth.response) return auth.response;

  const data = getImportedIndicatorMonthlyData();
  return Response.json({ data, hasRealData: data.length > 0 });
}
