import React, { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Zap,
  Search,
  Gift,
  Bell,
  Calendar,
  ChevronDown,
  Filter,
  Upload,
} from "lucide-react";
import { exportToExcel, deletePdf, ReviewView } from "./history";
import "./Dashboard.css";

export function Dashboard({ setActiveNav }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [reviewItem, setReviewItem] = useState(null);
  const [recentPage, setRecentPage] = useState(1);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalExtractions: 0,
    approved: 0,
    flagged: 0,
    pending: 0,
  });

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

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/result_status");
        if (!response.ok) throw new Error("Failed to fetch dashboard metrics");
        const data = await response.json();
        const statusCount = data?.status_count || {};

        setDashboardMetrics({
          totalExtractions: Number(data?.pdf_files_count || 0),
          approved: Number(statusCount.approved || 0),
          flagged: Number(statusCount.flagged || 0),
          pending: Number(statusCount.pending || 0),
        });
      } catch (err) {
        console.error("Error fetching dashboard metrics:", err);
      }
    };

    fetchDashboardMetrics();
  }, []);

  const stats = [
    {
      label: "Total Extractions",
      value: historyItems.length.toLocaleString(),
      icon: FileText,
      color: "blue",
      change: "Live data",
    },
    {
      label: "Fields Approved",
      value: dashboardMetrics.approved.toLocaleString(),
      icon: CheckCircle,
      color: "green",
      change: "Live data",
    },
    {
      label: "Fields Flagged",
      value: dashboardMetrics.flagged.toLocaleString(),
      icon: AlertTriangle,
      color: "red",
      change: "Live data",
    },
    {
      label: "Pending Review",
      value: dashboardMetrics.pending.toLocaleString(),
      icon: Clock,
      color: "gray",
      change: "Live data",
    },
  ];

  const recentPerPage = 10;
  const recentTotalPages = Math.max(1, Math.ceil(historyItems.length / recentPerPage));
  const recentStart = (recentPage - 1) * recentPerPage;
  const recentItems = historyItems.slice(recentStart, recentStart + recentPerPage);

  useEffect(() => {
    setRecentPage((prev) => Math.min(prev, recentTotalPages));
  }, [recentTotalPages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        document.getElementById('dashboard-search-input')?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (reviewItem) {
    return <ReviewView item={reviewItem} onBack={() => setReviewItem(null)} />;
  }

  return (
    <div className="dashboard">
      {/* Top Navigation Bar (Global Header) */}
      <div className="top-nav-bar">
        <div className="search-container" onClick={() => document.getElementById('dashboard-search-input')?.focus()} style={{ cursor: 'text' }}>
          <Search size={14} className="search-icon" />
          <input id="dashboard-search-input" type="text" placeholder="Search" className="search-input" />
          <span className="search-shortcut" style={{ cursor: 'pointer' }}>Alt + S</span>
        </div>
        
        <div className="top-nav-actions">
          <button className="icon-btn"><Gift size={16} /></button>
          <button className="icon-btn"><Bell size={16} /></button>
          <button className="icon-btn" style={{ border: '1px solid var(--border-strong)', borderRadius: '50%', width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
          
          <div className="nav-divider"></div>
          
          <div className="user-profile" onClick={() => setActiveNav?.("profile")} style={{ cursor: 'pointer' }}>
            <img src="https://i.pravatar.cc/150?img=68" alt="Avatar" className="avatar" />
            <div className="user-info">
              <span className="user-name">Young Alaska</span>
              <span className="user-role">Business</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-container">

        {/* Page Header */}
        <div className="dashboard-header-modern">
          <h1>Dashboard</h1>
          
          <div className="header-actions">
            <button className="header-btn">
              <Calendar size={14} />
              Oct 18 - Nov 18
            </button>
            <button className="header-btn">
              Monthly
              <ChevronDown size={14} />
            </button>
            <button className="header-btn">
              <Filter size={14} />
              Filter
            </button>
            <button className="header-btn">
              <Upload size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {stats.map(({ label, value, icon: Icon, color, change }) => (
            <div key={label} className="stat-card">
              <div className="stat-top">
                <div className={`icon-box ${color}`}>
                  <Icon size={18} />
                </div>
                <div className="stat-label">{label}</div>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{value}</div>
                <span className="stat-change">{change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Section */}
        <div className="main-grid">

          {/* Recent Extractions */}
          <div className="recent">
            <div className="recent-header">
              <h2>Recent Extractions</h2>
              <button onClick={() => setActiveNav?.("history")}>
                View all <ArrowRight size={14} />
              </button>
            </div>

            <div className="recent-list">
              {historyItems.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-dim)", fontSize: "14px" }}>
                  No recent extractions found.
                </div>
              ) : (
                recentItems.map((item, index) => {
                  const totalFields = item.data_points?.length || 0;
                  const approved = Object.values(item.results || {}).filter(
                    (v) => v !== null && v !== undefined
                  ).length;
                  const approvalPct = totalFields ? (approved / totalFields) * 100 : 0;

                  return (
                    <div key={item.id || index} className="recent-item">
                      <FileText size={15} />

                      <div className="recent-info">
                        <div className="recent-name">{item.pdf_filename || "Untitled"}</div>
                        <div className="recent-meta">
                          {item.template_name || "N/A"} · {item.timestamp
                            ? new Date(item.timestamp).toLocaleString("en-US", {
                                month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true
                              }).replace(",", " ·")
                            : "—"}
                        </div>
                      </div>

                      <div className="recent-status-wrapper">
                        <div className="recent-status">
                          <div className="status-text">
                            {approved}/{totalFields} fields
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress"
                              style={{ width: `${approvalPct}%`, backgroundColor: approvalPct === 100 ? "#22c55e" : "#3b82f6" }}
                            />
                          </div>
                        </div>
                        <div className="hover-actions">
                          <button className="h-btn primary" onClick={() => setReviewItem(item)}>👁 Review</button>
                          <button className="h-btn secondary" onClick={() => exportToExcel(item)}>⬇ Export</button>
                          <button className="h-btn danger" onClick={() => deletePdf(item.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {historyItems.length > recentPerPage && (
              <div className="recent-pagination">
                <button
                  className="recent-page-btn"
                  onClick={() => setRecentPage((p) => Math.max(1, p - 1))}
                  disabled={recentPage === 1}
                >
                  Previous
                </button>
                <span className="recent-page-info">Page {recentPage} of {recentTotalPages}</span>
                <button
                  className="recent-page-btn"
                  onClick={() => setRecentPage((p) => Math.min(recentTotalPages, p + 1))}
                  disabled={recentPage === recentTotalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="side-panel">

            {/* Usage */}
            <div className="card">
              <div className="card-header">
                <TrendingUp size={16} />
                <h3>Usage Overview</h3>
              </div>

              <div className="usage-item">
                <div className="usage-label">
                  <span>Monthly extractions</span>
                  <span>650 / 1000</span>
                </div>
                <div className="progress-bar">
                  <div className="progress blue" style={{ width: "65%" }} />
                </div>
              </div>

              <div className="usage-item">
                <div className="usage-label">
                  <span>Templates used</span>
                  <span>8 / 20</span>
                </div>
                <div className="progress-bar">
                  <div className="progress green" style={{ width: "40%" }} />
                </div>
              </div>

              <div className="usage-item">
                <div className="usage-label">
                  <span>Storage</span>
                  <span>2.4 / 5 GB</span>
                </div>
                <div className="progress-bar">
                  <div className="progress amber" style={{ width: "48%" }} />
                </div>
              </div>

              <p className="reset-text">Resets on May 1, 2026</p>
            </div>

            {/* Quick Action */}
            <div className="quick-card">
              <Zap size={16} />
              <h3>Quick Extraction</h3>
              <p>
                Upload a document and extract data in seconds using your templates.
              </p>
              <button className="white-btn" onClick={() => setActiveNav?.("extraction")}>Start Now</button>
            </div>

          </div>
        </div>
        </div>
      </div>
    </div>
  );
}