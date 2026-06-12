import { useState, useEffect } from "react";
import { FileText, Clock, Eye, Download, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import "./history.css";
import {API_URL} from "./apiService"

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

  const filename = `${(item.file_name || "extraction").replace(/\.pdf$/i, "")}_results.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportAllToExcel(items) {
  if (!items || items.length === 0) return;
  const rows = items.map(item => {
    const results = item.results || {};
    const dataString = Object.entries(results)
      .map(([k, v]) => `${k}: ${Array.isArray(v) || typeof v === "object" ? JSON.stringify(v) : v}`)
      .join("\n");
    return {
      "File Name": item.file_name || "Untitled",
      "Template Name": item.template_name || "N/A",
      "Date Extracted": item.timestamp ? new Date(item.timestamp).toLocaleString() : "N/A",
      "Total Fields": item.data_points?.length || 0,
      "Approved Fields": Object.values(item.results || {}).filter(v => v !== null && v !== undefined).length,
      "Extracted Values": dataString
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 80 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dashboard Export");
  XLSX.writeFile(wb, "dashboard_extractions_report.xlsx");
}

export function deletePdf(id) {
  if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
    return;
  }

  fetch(`${API_URL}/history/delete_pdf/${id}`, {
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
  const [previewError, setPreviewError] = useState(false);
  const [previewErrorMessage, setPreviewErrorMessage] = useState("");
  const [previewLoading, setPreviewLoading] = useState(true);

  const entries = Object.entries(item.results || {});
  const totalFields = entries.length;
  const extractedCount = entries.filter(([, v]) => v !== null && v !== undefined).length;

  const fileName = item.file_name || item.file_name || "";
  const lowerFileName = fileName.toLowerCase();
  const isPdf = lowerFileName.endsWith(".pdf");
  const isImage = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"].some((ext) =>
    lowerFileName.endsWith(ext)
  );

  useEffect(() => {
    if (!fileName) {
      setPreviewLoading(false);
      setPreviewError(true);
      setPreviewErrorMessage("No file associated with this extraction.");
      return;
    }

    let objectUrl = null;
    setPreviewLoading(true);
    setPreviewError(false);
    setPreviewErrorMessage("");
    setBlobUrl(null);

    const endpoint = isPdf
      ? `${API_URL}/pdf/${encodeURIComponent(fileName)}`
      : `${API_URL}/file/${encodeURIComponent(fileName)}`;

    fetch(endpoint)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`File not found: ${fileName}`);
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.blob();
      })
      .then((blob) => {
        if (blob.size === 0) {
          throw new Error("File is empty or corrupted");
        }

        let contentType = blob.type;
        if (isPdf) {
          contentType = "application/pdf";
        } else if (isImage && !contentType) {
          if (lowerFileName.endsWith(".png")) contentType = "image/png";
          else if (lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg")) contentType = "image/jpeg";
          else if (lowerFileName.endsWith(".webp")) contentType = "image/webp";
          else if (lowerFileName.endsWith(".gif")) contentType = "image/gif";
          else if (lowerFileName.endsWith(".bmp")) contentType = "image/bmp";
        }

        const typedBlob = new Blob([blob], {
          type: contentType || "application/octet-stream",
        });

        objectUrl = URL.createObjectURL(typedBlob);
        setBlobUrl(objectUrl);
        setPreviewLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load preview:", err);
        setPreviewError(true);
        setPreviewErrorMessage(err.message || "Failed to load preview");
        setPreviewLoading(false);
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileName, isPdf, isImage, lowerFileName]);

  return (
    <div className="dv-root">
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
          <span className="dv-filename">{fileName || "Untitled"}</span>
          <div className="dv-topbar-stats">
            <span className="dv-stat approved">{extractedCount} extracted</span>
            <span className="dv-stat pending">{totalFields - extractedCount} null</span>
            {item.template_name && (
              <span
                className="dv-stat"
                style={{ background: "var(--surface-3, #2a2a3a)", color: "var(--text-dim)" }}
              >
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

      <div className="dv-split">
        <div className="dv-pdf-pane">
          <div className="dv-pane-label">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" width="13" height="13">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Source Document
          </div>

          {previewLoading && (
            <div className="dv-pdf-fallback">Loading preview…</div>
          )}

          {!previewLoading && previewError && (
            <div className="dv-pdf-fallback" style={{ color: "#ef4444" }}>
              <div style={{ marginBottom: "12px" }}>⚠ Preview unavailable</div>
              <div style={{ fontSize: "12px", opacity: 0.8, lineHeight: "1.4" }}>
                {previewErrorMessage}
              </div>
            </div>
          )}

          {!previewLoading && !previewError && blobUrl && isPdf && (
            <iframe
              className="dv-pdf-iframe"
              src={blobUrl}
              title="PDF Viewer"
            />
          )}

          {!previewLoading && !previewError && blobUrl && isImage && (
            <div
              className="dv-pdf-fallback"
              style={{
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "auto",
              }}
            >
              <img
                src={blobUrl}
                alt={fileName}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  display: "block",
                  borderRadius: "10px",
                }}
              />
            </div>
          )}

          {!previewLoading && !previewError && blobUrl && !isPdf && !isImage && (
            <div className="dv-pdf-fallback" style={{ color: "#ef4444" }}>
              Preview is not available for this file type.
            </div>
          )}
        </div>

        <div
          className="dv-fields-pane-v2"
          style={{
            display: "flex",
            flexDirection: "column",
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            <div className="dv-pane-header-v2" style={{ marginBottom: "14px" }}>
              <div className="dv-pane-label-v2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.8"
                  stroke="currentColor"
                  width="14"
                  height="14"
                >
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                EXTRACTED FIELDS
              </div>

              <span className="dv-field-count-pill">
                {totalFields} FIELDS
              </span>
            </div>

            <div className="dv-fields-cards-grid">
              {entries.length === 0 ? (
                <div className="dv-pdf-fallback">
                  No extracted fields found.
                </div>
              ) : (
                entries.map(([key, val], idx) => {
                  const isNull = val === null || val === undefined || val === "";
                  const status = isNull ? "pending" : "approved";

                  return (
                    <div
                      key={key}
                      className={`dv-field-card-v3 status-${status}`}
                    >
                      <div className="dv-card-header-v3">
                        <div className="dv-card-num-label">
                          <span className="dv-card-num">
                            {String(idx + 1).padStart(2, "0")}
                          </span>

                          <span className="dv-card-label">
                            {key}
                          </span>
                        </div>

                        <span
                          className={`dv-card-badge badge-${isNull ? "pending" : "approved"}`}
                        >
                          {isNull ? "— Not Found" : "✓ Extracted"}
                        </span>
                      </div>

                      <div className="dv-card-body-v3">
                        <textarea
                          className={`dv-card-textarea ${isNull ? "null-val" : ""}`}
                          value={formatValue(val)}
                          readOnly
                          rows={Math.min(
                            8,
                            Math.max(2, formatValue(val).split("\n").length + 1)
                          )}
                          placeholder="No value found"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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
        const response = await fetch(`${API_URL}/history`);
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
                <th className="text-right actions-header">Actions</th>
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
                            {item.file_name || "Untitled"}
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
                      <td className="cell cell-lg text-right actions-cell">
                        <div className="actions">
                          <button
                            className="btn primary"
                            onClick={() => setReviewItem(item)}
                          >
                            <Eye size={13} />
                            <span>Review</span>
                          </button>
                          <button
                            className="btn secondary"
                            onClick={() => exportToExcel(item)}
                          >
                            <Download size={13} />
                            <span>Export</span>
                          </button>
                          <button
                            className="btn danger"
                            onClick={() => deletePdf(item.id)}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
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