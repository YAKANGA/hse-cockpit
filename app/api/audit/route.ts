import { getAuthorizedAuditScope } from "@/lib/audit-api";

export async function GET(request: Request) {
  const { events, response } = getAuthorizedAuditScope(request);
  if (response) {
    return response;
  }

  return Response.json({
    data: events,
    count: events.length,
    summary: {
      critical: events.filter((event) => event.severity === "Critique").length,
      control: events.filter((event) => event.severity === "Controle").length,
      info: events.filter((event) => event.severity === "Info").length,
    },
  });
}
