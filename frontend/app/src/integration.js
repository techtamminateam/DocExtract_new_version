import React, { useEffect, useState } from "react";
import "./integration.css";

// ─── Constants ───────────────────────────────────────────────
const BACKEND_URL = "http://localhost:5000/api";

const PROVIDERS = {
  google: {
    key:          "google",
    label:        "Google Drive",
    subtitle:     "File extraction & integration",
    logo:         "/drive_logo.png",
    logoAlt:      "Google Drive",
    authEndpoint: `${BACKEND_URL}/auth/google`,
    statusUrl:    `${BACKEND_URL}/auth/status`,
    disconnectUrl:`${BACKEND_URL}/auth/disconnect`,
    filesUrl:     `${BACKEND_URL}/drive/files`,
    extractUrl:   `${BACKEND_URL}/extract-from-drive`,
    scope:        "drive.readonly",
  },
  onedrive: {
    key:          "onedrive",
    label:        "Microsoft OneDrive",
    subtitle:     "File extraction & integration",
    logo:         "/onedrive_logo.png",
    logoAlt:      "OneDrive",
    authEndpoint: `${BACKEND_URL}/auth/microsoft`,
    statusUrl:    `${BACKEND_URL}/onedrive/auth/status`,
    disconnectUrl:`${BACKEND_URL}/onedrive/auth/disconnect`,
    filesUrl:     `${BACKEND_URL}/onedrive/files`,
    extractUrl:   `${BACKEND_URL}/onedrive/extract`,
    scope:        "Files.Read",
  },
};

// ─── Single-provider panel ───────────────────────────────────
function DrivePanel({ provider }) {
  const [files,      setFiles]      = useState([]);
  const [connected,  setConnected]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [toast,      setToast]      = useState(null);
  const [extracting, setExtracting] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { checkConnection(); }, []);

  const checkConnection = async () => {
    try {
      const res = await fetch(provider.statusUrl, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.connected) { setConnected(true); fetchFiles(); }
      else setConnected(false);
    } catch {
      setError("Could not verify connection status.");
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(provider.filesUrl, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFiles(data.files || []);
    } catch {
      setError("Failed to load files.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = provider.authEndpoint;
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch(provider.disconnectUrl, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setConnected(false);
      setFiles([]);
      showToast(`Disconnected from ${provider.label}`);
    } catch {
      setError("Failed to disconnect.");
    }
  };

  const handleExtract = async (fileId, fileName) => {
    setExtracting(fileId);
    setError("");
    try {
      const res = await fetch(provider.extractUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId }),
      });
      if (!res.ok) throw new Error();
      showToast(`Extracted "${fileName}" successfully`);
    } catch {
      setError(`Extraction failed for "${fileName}".`);
    } finally {
      setExtracting(null);
    }
  };

  return (
    <div className="drive-card">

      {/* Header */}
      <div className="drive-header">
        <div className="drive-header-left">
          <div className="drive-icon-wrap">
            <img src={provider.logo} alt={provider.logoAlt} />
          </div>
          <div>
            <div className="drive-title">{provider.label}</div>
            <div className="drive-subtitle">{provider.subtitle}</div>
          </div>
        </div>
        <div className={`status-badge ${connected ? "connected" : "disconnected"}`}>
          <span className="status-dot" />
          {connected ? "Connected" : "Not connected"}
        </div>
      </div>

      {/* Body */}
      <div className="drive-body">
        {error && <div className="error-banner">{error}</div>}

        {!connected ? (
          <div className="connect-state">
            <div className="connect-illustration" />
            <div className="connect-text">
              <h3>Connect your {provider.label}</h3>
              <p>
                Authorize access to browse and extract PDFs directly from
                your {provider.label}.
              </p>
            </div>
            <button className="btn-primary" onClick={handleConnect}>
              Authorize {provider.label}
            </button>
          </div>
        ) : (
          <div className="files-section">
            <div className="files-toolbar">
              <span className="files-label">PDF Files</span>
              {!loading && files.length > 0 && (
                <span className="files-count">
                  {files.length} file{files.length !== 1 ? "s" : ""}
                </span>
              )}
              <button
                className="btn-ghost"
                onClick={fetchFiles}
                disabled={loading}
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="state-loading">
                <div className="spinner" />
                Fetching files…
              </div>
            ) : files.length === 0 ? (
              <div className="state-empty">
                No PDF files found in your {provider.label}
              </div>
            ) : (
              <ul className="file-list">
                {files.map((file) => (
                  <li key={file.id} className="file-item">
                    <div className="file-icon">📄</div>
                    <div className="file-info">
                      <div className="file-name" title={file.name}>
                        {file.name}
                      </div>
                      <div className="file-meta">{file.id}</div>
                    </div>
                    <button
                      className="btn-extract"
                      onClick={() => handleExtract(file.id, file.name)}
                      disabled={extracting !== null}
                    >
                      {extracting === file.id ? (
                        <>
                          <div className="spinner"
                            style={{ width: 11, height: 11, borderWidth: 1.5 }}
                          />
                          Extracting…
                        </>
                      ) : "Extract"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="drive-footer">
        <span className="drive-footer-note">
          {connected ? `Scope: ${provider.scope}` : "OAuth 2.0 · read-only scope"}
        </span>
        {connected && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn-ghost" onClick={checkConnection}>
              Re-check auth
            </button>
            <button
              className="btn-ghost"
              onClick={handleDisconnect}
              style={{ color: "#ef4444" }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Toast (scoped per panel) */}
      {toast && (
        <div className={`toast ${toast.type}`}>✓ {toast.msg}</div>
      )}
    </div>
  );
}

// ─── Root component ──────────────────────────────────────────
export function Integration() {
  const [active, setActive] = useState("google");

  return (
    <div className="drive-wrapper">
      <div className="provider-tabs">
        {Object.values(PROVIDERS).map((p) => (
          <button
            key={p.key}
            className={`provider-tab ${active === p.key ? "active" : ""}`}
            onClick={() => setActive(p.key)}
          >
            <img src={p.logo} alt={p.logoAlt} className="tab-logo" />
            {p.label}
          </button>
        ))}
      </div>

      {/* Mount both panels but only show the active one so state is preserved */}
      {Object.values(PROVIDERS).map((p) => (
        <div
          key={p.key}
          style={{ display: active === p.key ? "block" : "none", width: "100%", maxWidth: 580 }}
        >
          <DrivePanel provider={p} />
        </div>
      ))}
    </div>
  );
}