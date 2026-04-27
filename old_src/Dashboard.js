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

const stats = [
  { label: "Total Extractions", value: "650", icon: FileText, color: "blue", change: "+12 this week" },
  { label: "Fields Approved", value: "4,821", icon: CheckCircle, color: "green", change: "+234 this week" },
  { label: "Fields Flagged", value: "142", icon: AlertTriangle, color: "amber", change: "-18 this week" },
  { label: "Pending Review", value: "32", icon: Clock, color: "gray", change: "2 documents" },
];


const getResults = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/result_status",
      {
        method: "GET",
        headers: {
          "ngrok-skip-browser-warning": "true", // bypasses ngrok HTML interstitial
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log(data);

  } catch (error) {
    console.error("Error fetching results:", error);
  }
};


export function Dashboard({ setActiveNav }) {
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
          
          <div className="user-profile">
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
          <button className="primary-btn">
            <Plus size={16} />
            New Extraction
          </button>
          <button onClick={getResults}>Get results</button>
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
                historyItems.slice(0, 5).map((item, index) => {
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