import { useState, useEffect } from "react";
import { FileText, Clock } from "lucide-react";
import * as XLSX from "xlsx";
import "./history.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatValue(val) {
  if (val === null || val === undefined) return "null";
  if (Array.isArray(val) || typeof val === "object") {
    return JSON.stringify(val, null, 2);
  }
  return String(val);
}

export function exportToExcel(item) {
  const results = item.results || {};
  const rows = Object.entries(results).map(([field, value]) => ({
    Field: field,
    Value: Array.isArray(value) || typeof value === "object"
      ? JSON.stringify(value)
      : value ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws["!cols"] = [{ wch: 30 }, { wch: 60 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");

  const filename = `${(item.pdf_filename || "extraction").replace(/\.pdf$/i, "")}_results.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function deletePdf(id) {
  if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
    return;
  }

  fetch(`http://localhost:5000/api/history/delete_pdf/${id}`, {
    method: "DELETE",
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to delete record (status ${res.status})`);
      }
      alert("Record deleted successfully.");
      window.location.reload();
    })
    .catch((err) => {
      console.error("Error deleting record:", err);
      alert("Failed to delete record. Please try again.");
    });
}

// ── Review View ───────────────────────────────────────────────────────────────

export function ReviewView({ item, onBack }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [pdfError, setPdfError] = useState(false);
  const [pdfErrorMessage, setPdfErrorMessage] = useState("");
  const [pdfLoading, setPdfLoading] = useState(true);

  const entries = Object.entries(item.results || {});
  const totalFields = entries.length;
  const extractedCount = entries.filter(([, v]) => v !== null && v !== undefined).length;

  // Fetch the PDF as a blob so the browser treats it as same-origin — avoids
  // all cross-origin / Content-Disposition / X-Frame-Options problems.
  useEffect(() => {
    if (!item.pdf_filename) {
      setPdfLoading(false);
      setPdfError(true);
      setPdfErrorMessage("No PDF file associated with this extraction.");
      return;
    }

    let objectUrl = null;
    setPdfLoading(true);
    setPdfError(false);
    setPdfErrorMessage("");

    fetch(`http://localhost:5000/api/pdf/${encodeURIComponent(item.pdf_filename)}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`PDF file not found: ${item.pdf_filename}`);
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.blob();
      })
      .then((blob) => {
        // Check if blob has content
        if (blob.size === 0) {
          throw new Error("PDF file is empty or corrupted");
        }
        // Force the MIME type so the browser's PDF viewer activates
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(pdfBlob);
        setBlobUrl(objectUrl);
        setPdfLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load PDF:", err);
        setPdfError(true);
        setPdfErrorMessage(err.message || "Failed to load PDF");
        setPdfLoading(false);
      });

    // Revoke the object URL when the component unmounts to free memory
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.pdf_filename]);

  return (
    <div className="dv-root">
      {/* ── Top bar ── */}
      <div className="dv-topbar">
        <button className="dv-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" width="15" height="15">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        <div className="dv-topbar-center">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" width="14" height="14">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span className="dv-filename">{item.pdf_filename || "Untitled"}</span>
          <div className="dv-topbar-stats">
            <span className="dv-stat approved">{extractedCount} extracted</span>
            <span className="dv-stat pending">{totalFields - extractedCount} null</span>
            {item.template_name && (
              <span className="dv-stat" style={{ background: "var(--surface-3, #2a2a3a)", color: "var(--text-dim)" }}>
                {item.template_name}
              </span>
            )}
          </div>
        </div>

        <div className="dv-topbar-actions">
          <button className="dv-export-btn" onClick={() => exportToExcel(item)}>
            ↓ Export Excel
          </button>
        </div>
      </div>

      {/* ── Split pane ── */}
      <div className="dv-split">
        {/* LEFT: PDF viewer */}
        <div className="dv-pdf-pane">
          <div className="dv-pane-label">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" width="13" height="13">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Source Document
          </div>

          {pdfLoading && (
            <div className="dv-pdf-fallback">Loading PDF…</div>
          )}
          {!pdfLoading && pdfError && (
            <div className="dv-pdf-fallback" style={{ color: "#ef4444" }}>
              <div style={{ marginBottom: "12px" }}>⚠ PDF unavailable</div>
              <div style={{ fontSize: "12px", opacity: 0.8, lineHeight: "1.4" }}>
                {pdfErrorMessage}
              </div>
            </div>
          )}
          {!pdfLoading && !pdfError && blobUrl && (
            <iframe
              className="dv-pdf-iframe"
              src={blobUrl}
              title="PDF Viewer"
            />
          )}
        </div>

        {/* RIGHT: Fields panel */}
        <div className="dv-fields-pane">
          <div className="dv-pane-label">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" width="13" height="13">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            Extracted Fields &nbsp;
            <span className="dv-field-count">{totalFields} fields</span>
          </div>

          <div className="dv-fields-list">
            {entries.length === 0 ? (
              <div className="dv-pdf-fallback">No extracted fields found.</div>
            ) : (
              entries.map(([key, val], idx) => {
                const isEmpty = val === null || val === undefined;
                const status = isEmpty ? "pending" : "approved";
                const displayVal = formatValue(val);
                const lineCount = displayVal.split("\n").length;

                return (
                  <div key={key} className={`dv-field-card dv-status-${status}`}>
                    <div className="dv-field-card-top">
                      <div className="dv-field-left">
                        <span className="dv-field-idx">{String(idx + 1).padStart(2, "0")}</span>
                        <span className="dv-field-key">{key}</span>
                      </div>
                      <div className="dv-field-actions">
                        <span className={`dv-status-badge dv-badge-${status}`}>
                          {isEmpty ? "● null" : "✓ Extracted"}
                        </span>
                      </div>
                    </div>
                    <textarea
                      className="dv-field-value"
                      value={displayVal}
                      readOnly
                      rows={Math.min(8, Math.max(2, lineCount + 1))}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── History Table ─────────────────────────────────────────────────────────────

export function History() {
  const [historyItems, setHistoryItems] = useState([]);
  const [reviewItem, setReviewItem] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/history");
        if (!response.ok) throw new Error("Failed to fetch history");
        const data = await response.json();
        setHistoryItems(data.history || []);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };
    fetchHistory();
  }, []);

  // ── Review mode: full screen ──
  if (reviewItem) {
    return <ReviewView item={reviewItem} onBack={() => setReviewItem(null)} />;
  }

  // ── Table mode ──
  return (
    <div className="de-wrap">
      <div className="de-surface-2">
        <header>
          <h2>History</h2>
          <p className="de-step-sub">All past document extractions and their results</p>
        </header>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Template</th>
                <th>Date</th>
                <th>Fields</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {historyItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">No history records found.</td>
                </tr>
              ) : (
                historyItems.map((item, index) => {
                  const totalFields = item.data_points?.length || 0;
                  const approved = Object.values(item.results || {}).filter(
                    (v) => v !== null && v !== undefined
                  ).length;
                  const approvalPct = totalFields
                    ? Math.round((approved / totalFields) * 100)
                    : 0;

                  return (
                    <tr key={item.id || index} className="table-row">
                      {/* Document */}
                      <td className="cell cell-lg">
                        <div className="doc-info">
                          <FileText className="doc-icon" />
                          <span className="doc-name">
                            {item.pdf_filename || "Untitled"}
                          </span>
                        </div>
                      </td>

                      {/* Template */}
                      <td className="cell">
                        <span className="badge">{item.template_name || "N/A"}</span>
                      </td>

                      {/* Date */}
                      <td className="cell">
                        <div className="date">
                          <Clock className="date-icon" />
                          <span>
                            {item.timestamp
                              ? new Date(item.timestamp)
                                  .toLocaleString("en-US", {
                                    month: "short",
                                    day: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                  .replace(",", " ·")
                              : "—"}
                          </span>
                        </div>
                      </td>

                      {/* Fields progress */}
                      <td className="cell">
                        <div className="fields">
                          <div className="field-top">
                            <span className="count">{approved}/{totalFields}</span>
                          </div>
                          <div className="progress">
                            <div
                              className="progress-bar"
                              style={{
                                width: `${approvalPct}%`,
                                backgroundColor:
                                  approvalPct === 100 ? "#22c55e" : "#3b82f6",
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="cell">
                        <span className="status status-completed">completed</span>
                      </td>

                      {/* Actions */}
                      <td className="cell cell-lg text-right">
                        <div className="actions">
                          <button
                            className="btn primary"
                            onClick={() => setReviewItem(item)}
                          >
                            👁 Review
                          </button>
                          <button
                            className="btn secondary"
                            onClick={() => exportToExcel(item)}
                          >
                            ⬇ Export
                          </button>
                          <button
                            className="btn danger"
                            onClick={() => deletePdf(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}