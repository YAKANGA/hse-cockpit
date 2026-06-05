import { modules } from "@/lib/hse-data";

export async function GET() {
  return Response.json({
    data: modules.map(({ icon: _icon, ...module }) => module),
    count: modules.length,
  });
}
