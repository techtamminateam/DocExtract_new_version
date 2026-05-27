import React, { useEffect, useState } from "react";
import "./integration.css";

// ─── Constants ───────────────────────────────────────────────
const BACKEND_URL = "http://localhost:5000/api";

const PROVIDERS = {
  google: {
    key: "google",
    label: "Google Drive",
    subtitle: "File extraction & integration",
    logo: "/drive_logo.png",
    logoAlt: "Google Drive",
    authEndpoint: `${BACKEND_URL}/auth/google`,
    statusUrl: `${BACKEND_URL}/auth/status`,
    disconnectUrl: `${BACKEND_URL}/auth/disconnect`,
    filesUrl: `${BACKEND_URL}/drive/files`,
    extractUrl: `${BACKEND_URL}/extract-from-drive`,
    scope: "drive.readonly",
  },
  onedrive: {
    key: "onedrive",
    label: "Microsoft OneDrive",
    subtitle: "File extraction & integration",
    logo: "/onedrive_logo.webp",
    logoAlt: "OneDrive",
    authEndpoint: `${BACKEND_URL}/auth/microsoft`,
    statusUrl: `${BACKEND_URL}/onedrive/auth/status`,
    disconnectUrl: `${BACKEND_URL}/onedrive/auth/disconnect`,
    filesUrl: `${BACKEND_URL}/onedrive/files`,
    extractUrl: `${BACKEND_URL}/onedrive/extract`,
    scope: "Files.Read",
  },
};

// ─── Single-provider panel ───────────────────────────────────
function DrivePanel({ provider }) {
  const [files, setFiles] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [extracting, setExtracting] = useState(null);
  const [user, setUser] = useState(null);

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
      if (data.connected) {
        setConnected(true);
        setUser(data.user || null);
      }
      else {
        setConnected(false);
        setUser(null);
        if (data.error === "insufficient_scopes") {
          setError("Access to Google Drive was not fully authorized. Please connect again and check the permission checkbox.");
        }
      }
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
      setUser(null);
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
          <div className="connect-state">
            {user && user.picture ? (
              <img
                src={user.picture}
                alt="Profile"
                referrerPolicy="no-referrer"
                style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 16, border: '3px solid #e2e8f0', objectFit: 'cover' }}
              />
            ) : (
              <div className="connect-illustration" style={{ opacity: 0.5 }} />
            )}
            <div className="connect-text">
              <h3>{user && user.name ? user.name : `${provider.label} Connected`}</h3>
              {user && user.email && <p style={{ fontWeight: 600, color: '#64748b', margin: '4px 0 8px' }}>{user.email}</p>}
              <p style={{ marginTop: '8px' }}>
                Your account is successfully connected. Please go to the New Extraction page to browse and select your files.
              </p>
            </div>
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