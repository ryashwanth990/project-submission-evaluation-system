import React, { useState } from "react";
import { Link } from "wouter";
import { useListEvaluations, getListEvaluationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileCheck2, ArrowRight, Download, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function downloadCSV(token: string | null) {
  if (!token) return;
  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  fetch(`${basePath}/api/evaluations/export?format=csv`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Export failed");
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evaluation-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(console.error);
}

type EvalRow = {
  id: number;
  projectId: number;
  facultyName?: string | null;
  score: number;
  feedback: string;
  innovationScore?: number | null;
  technicalScore?: number | null;
  presentationScore?: number | null;
  documentationScore?: number | null;
  createdAt: string;
};

function generatePDF(evaluations: EvalRow[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(16);
  doc.setTextColor(26, 54, 93);
  doc.text("SCEM — Project Evaluation Report", 40, 40);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Department of CSE (AI & ML)  |  BAI402G DBMS Mini Project  |  Generated: ${format(new Date(), "PPP")}`,
    40,
    60
  );

  autoTable(doc, {
    startY: 80,
    head: [
      [
        "#",
        "Project ID",
        "Evaluated By",
        "Overall",
        "Innovation",
        "Technical",
        "Presentation",
        "Docs",
        "Feedback",
        "Date",
      ],
    ],
    body: evaluations.map((e, i) => [
      i + 1,
      `#${e.projectId}`,
      e.facultyName ?? "—",
      e.score,
      e.innovationScore ?? "—",
      e.technicalScore ?? "—",
      e.presentationScore ?? "—",
      e.documentationScore ?? "—",
      e.feedback?.slice(0, 80) + (e.feedback?.length > 80 ? "…" : ""),
      format(new Date(e.createdAt), "dd MMM yyyy"),
    ]),
    headStyles: {
      fillColor: [26, 54, 93],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      8: { cellWidth: 140 },
    },
    margin: { left: 40, right: 40 },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Page ${p} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" }
    );
  }

  doc.save(`evaluation-report-${Date.now()}.pdf`);
}

export default function Evaluations() {
  const { data: evaluations, isLoading } = useListEvaluations({
    query: { queryKey: getListEvaluationsQueryKey() },
  });
  const [csvLoading, setCsvLoading] = useState(false);
  const token = localStorage.getItem("token");

  const handleCSVExport = async () => {
    setCsvLoading(true);
    try {
      await downloadCSV(token);
    } finally {
      setTimeout(() => setCsvLoading(false), 1000);
    }
  };

  const handlePDFExport = () => {
    if (evaluations && evaluations.length > 0) {
      generatePDF(evaluations as EvalRow[]);
    }
  };

  const hasData = evaluations && evaluations.length > 0;

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Evaluations</h1>
          <p className="text-gray-500 mt-1">A history of projects you have evaluated.</p>
        </div>

        {hasData && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCSVExport}
              disabled={csvLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {csvLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePDFExport}
              className="border-primary/40 text-primary hover:bg-primary/5"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        )}
      </div>

      <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-6">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-4 w-1/4 mt-4" />
                </div>
              ))}
            </div>
          ) : hasData ? (
            <div className="divide-y border-gray-100">
              {evaluations.map((evalRecord) => (
                <div key={evalRecord.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Project #{evalRecord.projectId}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {format(new Date(evalRecord.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2 bg-gray-50 p-3 rounded border">
                        {evalRecord.feedback}
                      </p>
                    </div>
                    <div className="flex flex-col sm:items-end justify-between">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                          Score
                        </p>
                        <div className="bg-primary/10 text-primary px-3 py-1 rounded-md text-xl font-bold inline-block border border-primary/20">
                          {evalRecord.score}
                        </div>
                      </div>
                      <Link href={`/projects/${evalRecord.projectId}`}>
                        <span className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 mt-4 cursor-pointer">
                          View Project <ArrowRight className="ml-1 h-4 w-4" />
                        </span>
                      </Link>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t text-xs">
                    <div>
                      <span className="text-gray-500">Innovation:</span>{" "}
                      <span className="font-medium">{evalRecord.innovationScore ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Technical:</span>{" "}
                      <span className="font-medium">{evalRecord.technicalScore ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Presentation:</span>{" "}
                      <span className="font-medium">{evalRecord.presentationScore ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Docs:</span>{" "}
                      <span className="font-medium">{evalRecord.documentationScore ?? "—"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No evaluations</h3>
              <p className="text-gray-500 mt-1">You haven't evaluated any projects yet.</p>
              <Link href="/projects">
                <span className="inline-flex items-center text-sm font-medium text-primary hover:underline mt-4 cursor-pointer">
                  Browse projects to evaluate
                </span>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
