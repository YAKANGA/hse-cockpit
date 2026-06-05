export async function GET() {
  return Response.json({
    formats: [
      { label: "Word", extension: "docx", url: "/api/reports/global/docx" },
      { label: "PDF", extension: "pdf", url: "/api/reports/global/pdf" },
    ],
  });
}
