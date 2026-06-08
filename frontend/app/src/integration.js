import React, { useEffect, useState } from "react";
import "./integration.css";
import { API_URL } from "./apiService";

// ─── Constants ───────────────────────────────────────────────
const BACKEND_URL = `${API_URL}`;

const PROVIDERS = {
  google: {
    key: "google",
    label: "Google Drive",
    subtitle: "DocExtract + Google Drive",
    description: "Authorize access to browse, search, and extract files directly from your Google Drive account.",
    logo: "/drive_logo.png",
    logoAlt: "Google Drive",
    authEndpoint: `${BACKEND_URL}/auth/google`,
    statusUrl: `${BACKEND_URL}/auth/status`,
    disconnectUrl: `${BACKEND_URL}/auth/disconnect`,
    scope: "drive.readonly",
  },
  onedrive: {
    key: "onedrive",
    label: "Microsoft OneDrive",
    subtitle: "DocExtract + OneDrive",
    description: "Authorize access to browse, search, and extract files directly from your Microsoft OneDrive account.",
    logo: "/onedrive_logo.png",
    logoAlt: "OneDrive",
    authEndpoint: `${BACKEND_URL}/auth/microsoft`,
    statusUrl: `${BACKEND_URL}/onedrive/auth/status`,
    disconnectUrl: `${BACKEND_URL}/onedrive/auth/disconnect`,
    scope: "Files.Read",
  },
  dropbox: {
    key: "dropbox",
    label: "Dropbox",
    subtitle: "DocExtract + Dropbox",
    description: "Authorize access to browse, search, and extract files directly from your Dropbox account.",
    logo: "",
    logoAlt: "Dropbox",
    authEndpoint: "#",
    statusUrl: "#",
    disconnectUrl: "#",
    scope: "files.metadata.read",
  },
};

const tabs = [
  { id: "all", label: "View all" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "archived", label: "Archived" }
];

export function Integration() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [requestedIntegrations, setRequestedIntegrations] = useState({});

  const [connections, setConnections] = useState({
    google: { connected: false, user: null, loading: true, error: "" },
    onedrive: { connected: false, user: null, loading: true, error: "" },
    dropbox: { connected: false, user: null, loading: false, error: "" }
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchConnectionStatus = async (key) => {
    if (key === "dropbox") return; // Dropbox status is mocked locally
    const provider = PROVIDERS[key];
    setConnections(prev => ({
      ...prev,
      [key]: { ...prev[key], loading: true, error: "" }
    }));
    try {
      const res = await fetch(provider.statusUrl, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.connected) {
        setConnections(prev => ({
          ...prev,
          [key]: {
            connected: true,
            user: data.user || null,
            loading: false,
            error: ""
          }
        }));
      } else {
        setConnections(prev => ({
          ...prev,
          [key]: {
            connected: false,
            user: null,
            loading: false,
            error: data.error === "insufficient_scopes" ? "Access was not fully authorized. Please reconnect." : ""
          }
        }));
      }
    } catch {
      setConnections(prev => ({
        ...prev,
        [key]: {
          connected: false,
          user: null,
          loading: false,
          error: "Could not verify connection status."
        }
      }));
    }
  };

  useEffect(() => {
    Object.keys(PROVIDERS).forEach(key => {
      fetchConnectionStatus(key);
    });

    const handleOutsideClick = () => {
      setActiveMenu(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleConnect = (key) => {
    window.location.href = PROVIDERS[key].authEndpoint;
  };

  const handleDisconnect = async (key) => {
    if (key === "dropbox") {
      setConnections(prev => ({
        ...prev,
        dropbox: { connected: false, user: null, loading: false, error: "" }
      }));
      showToast("Disconnected from Dropbox");
      return;
    }
    const provider = PROVIDERS[key];
    setConnections(prev => ({
      ...prev,
      [key]: { ...prev[key], loading: true }
    }));
    try {
      const res = await fetch(provider.disconnectUrl, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setConnections(prev => ({
        ...prev,
        [key]: { connected: false, user: null, loading: false, error: "" }
      }));
      showToast(`Disconnected from ${provider.label}`);
    } catch {
      setConnections(prev => ({
        ...prev,
        [key]: { ...prev[key], loading: false, error: "Disconnect failed." }
      }));
      showToast(`Failed to disconnect from ${provider.label}`, "error");
    }
  };

  const handleToggle = (key) => {
    if (key === "dropbox") {
      const isCurrentlyConnected = connections.dropbox.connected;
      setConnections(prev => ({
        ...prev,
        dropbox: { ...prev.dropbox, loading: true }
      }));
      setTimeout(() => {
        if (isCurrentlyConnected) {
          setConnections(prev => ({
            ...prev,
            dropbox: { connected: false, user: null, loading: false, error: "" }
          }));
          showToast("Disconnected from Dropbox");
        } else {
          setConnections(prev => ({
            ...prev,
            dropbox: {
              connected: true,
              user: { name: "ShankarReddy", email: "shankar.reddy@company.com", picture: null },
              loading: false,
              error: ""
            }
          }));
          showToast("Connected to Dropbox");
        }
      }, 600);
      return;
    }

    const conn = connections[key];
    if (conn.connected) {
      handleDisconnect(key);
    } else {
      handleConnect(key);
    }
  };

  const handleRequestIntegration = (name) => {
    setRequestedIntegrations(prev => ({
      ...prev,
      [name]: true
    }));
    showToast(`Integration request for ${name} submitted successfully!`);
  };

  const filteredProviders = Object.values(PROVIDERS).filter((p) => {
    const conn = connections[p.key] || { connected: false };

    // Search Term Filter
    if (
      searchTerm &&
      !p.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Tab Filter
    if (activeTab === "active") {
      return conn.connected;
    }
    if (activeTab === "inactive") {
      return !conn.connected;
    }
    if (activeTab === "archived") {
      return false;
    }
    return true;
  });

  return (
    <div className="integrations-page-root">
      {/* Toast notifications */}
      {toast && (
        <div className={`integration-toast ${toast.type}`}>
          <span className="toast-icon">{toast.type === "error" ? "⚠" : "✓"}</span>
          <span className="toast-msg">{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="integrations-header-container">
        <div className="integrations-header-left">
          <h1 className="integrations-title">Integrations and workflows</h1>
          <p className="integrations-subtitle">
            Supercharge your workflow and handle repetitive tasks in the apps you use every day.
          </p>
        </div>
        <button className="new-integration-btn" onClick={() => setShowNewModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New integration
        </button>
      </div>

      {/* Tabs and Search & Filters Controls Row */}
      <div className="integrations-controls-row">
        <div className="integrations-tabs">
          {tabs.map((tab) => {
            const count = tab.id === "all"
              ? Object.keys(PROVIDERS).length
              : tab.id === "active"
                ? Object.values(connections).filter(c => c.connected).length
                : tab.id === "inactive"
                  ? Object.values(connections).filter(c => !c.connected).length
                  : 0;

            return (
              <button
                key={tab.id}
                className={`integration-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span className="tab-count-badge">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="search-filter-row">
          <div className="search-input-container">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="integration-search-input"
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="integration-filter-btn" onClick={() => showToast("Advanced filters coming soon!", "info")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* Integrations Grid */}
      {filteredProviders.length === 0 ? (
        <div className="integrations-empty-state">
          <div className="empty-state-icon">🔌</div>
          <h3>No integrations found</h3>
          <p>We couldn't find any integrations matching your filter criteria.</p>
        </div>
      ) : (
        <div className="integrations-grid">
          {filteredProviders.map((p) => {
            const conn = connections[p.key] || { connected: false, loading: false, user: null };
            const isMenuOpen = activeMenu === p.key;

            return (
              <div key={p.key} className="integration-card-v2">
                {/* Apps connection layout */}
                <div className="card-connection-display">
                  <div className="card-app-icon card-app-icon-docextract" title="DocExtract">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                      <path d="M9 12h6M9 16h6M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
                      <path d="M9 4h6a2 2 0 010 4H9a2 2 0 010-4z" />
                    </svg>
                  </div>
                  <div className="card-connection-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <path d="M17 3L21 7L17 11" />
                      <path d="M21 7H3" />
                      <path d="M7 21L3 17L7 13" />
                      <path d="M3 17H21" />
                    </svg>
                  </div>
                  <div className="card-app-icon card-app-icon-partner" title={p.label}>
                    {p.key === "onedrive" ? (
                      <svg viewBox="-4 -4 32 32">
                        <path fill="#0078d4" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                      </svg>
                    ) : p.key === "dropbox" ? (
                      <svg viewBox="0 -0.75 24 24">
                        <path fill="#0061ff" d="M6.5 2.5L12 6L6.5 9.5L1 6Z" />
                        <path fill="#0061ff" d="M17.5 2.5L23 6L17.5 9.5L12 6Z" />
                        <path fill="#0061ff" d="M6.5 9.5L12 13L6.5 16.5L1 13Z" />
                        <path fill="#0061ff" d="M17.5 9.5L23 13L17.5 16.5L12 13Z" />
                        <path fill="#0061ff" d="M12 13L17.5 16.5L12 20L6.5 16.5Z" />
                      </svg>
                    ) : (
                      <img src={p.logo} alt={p.logoAlt} />
                    )}
                  </div>
                </div>

                {/* Title & Status Toggle */}
                <div className="card-title-row">
                  <div className="card-text-wrap">
                    <h3 className="card-title">{p.subtitle}</h3>
                    <span className="card-subtitle">{p.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {conn.loading && <div className="card-mini-spinner" />}
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={conn.connected}
                        disabled={conn.loading}
                        onChange={() => handleToggle(p.key)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <p className="card-description">
                  {p.description}
                </p>

                {/* Card specific error */}
                {conn.error && (
                  <div className="card-error-banner">
                    <span className="card-error-dot">●</span>
                    {conn.error}
                  </div>
                )}

                <div className="card-divider"></div>

                {/* Footer (avatar/connected user + dropdown) */}
                <div className="card-footer">
                  <div className="card-user-info">
                    {conn.connected && conn.user ? (
                      <>
                        {conn.user.picture ? (
                          <img
                            src={conn.user.picture}
                            alt={conn.user.name || "User profile"}
                            referrerPolicy="no-referrer"
                            className="card-avatar"
                          />
                        ) : (
                          <div className="card-avatar-fallback">
                            {(conn.user.name || conn.user.email || "U").substring(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="card-user-text" title={conn.user.email}>
                          by {conn.user.name || conn.user.email.split("@")[0]}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="card-avatar-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <span className="card-user-text disconnected">
                          Not connected
                        </span>
                      </>
                    )}
                  </div>

                  <div className="card-menu-container" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="card-menu-btn"
                      onClick={() => setActiveMenu(isMenuOpen ? null : p.key)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                        <circle cx="12" cy="12" r="1.5"></circle>
                        <circle cx="12" cy="5" r="1.5"></circle>
                        <circle cx="12" cy="19" r="1.5"></circle>
                      </svg>
                    </button>
                    {isMenuOpen && (
                      <div className="card-dropdown">
                        {conn.connected ? (
                          <>
                            <button className="dropdown-item" onClick={() => fetchConnectionStatus(p.key)}>
                              🔄 Check Status
                            </button>
                            <button className="dropdown-item" onClick={() => showToast(`Scope: ${p.scope}`, "info")}>
                              ℹ️ View Scope
                            </button>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item text-red" onClick={() => handleDisconnect(p.key)}>
                              ❌ Disconnect
                            </button>
                          </>
                        ) : (
                          <button className="dropdown-item" onClick={() => handleConnect(p.key)}>
                            🔌 Connect Now
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request New Integration Modal */}
      {showNewModal && (
        <div className="new-integration-backdrop" onClick={() => setShowNewModal(false)}>
          <div className="new-integration-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Request New Integration</h2>
                <p>Vote for the integrations you would like us to build next.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowNewModal(false)}>×</button>
            </div>
            <div className="modal-grid">
              {[
                { name: "Dropbox", logo: "📦", desc: "Sync documents from your personal or business Dropbox folders." },
                { name: "Slack Alerts", logo: "💬", desc: "Receive notifications in Slack when extractions complete." },
                { name: "Notion", logo: "📝", desc: "Export extracted document fields directly to a Notion Database." },
                { name: "Salesforce", logo: "☁️", desc: "Automatically create or update leads and opportunities in Salesforce." },
                { name: "Zapier", logo: "⚡", desc: "Connect DocExtract to thousands of other apps via Zapier workflows." },
                { name: "HubSpot", logo: "🎯", desc: "Sync parsed document info with your HubSpot CRM." }
              ].map(item => (
                <div key={item.name} className="modal-card">
                  <div className="modal-card-logo">{item.logo}</div>
                  <h3>{item.name}</h3>
                  <p>{item.desc}</p>
                  <button
                    className={`modal-request-btn ${requestedIntegrations[item.name] ? "requested" : ""}`}
                    disabled={requestedIntegrations[item.name]}
                    onClick={() => handleRequestIntegration(item.name)}
                  >
                    {requestedIntegrations[item.name] ? "✓ Requested" : "Request Integration"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}