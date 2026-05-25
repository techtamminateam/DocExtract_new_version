import React, { useEffect, useState, useRef } from "react";
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
  Eye,
  Download,
  Trash2,
} from "lucide-react";
import { exportToExcel, exportAllToExcel, deletePdf, ReviewView } from "./history";
import "./Dashboard.css";

export function Dashboard({ setActiveNav, setSettingsTab, notifications = [], setNotifications }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [reviewItem, setReviewItem] = useState(null);
  const [recentPage, setRecentPage] = useState(1);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalExtractions: 0,
    approved: 0,
    flagged: 0,
    pending: 0,
  });

  // Date range filter state
  const [dateRange, setDateRange] = useState({ type: "all", start: null, end: null, label: "All Time" });
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Status and template filter state
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");

  // Interval (frequency) state
  const [interval, setIntervalVal] = useState("Monthly");

  // Dropdown visibility state
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Refs for click-outside detection
  const bellRef = useRef(null);
  const dateRef = useRef(null);
  const intervalRef = useRef(null);
  const filterRef = useRef(null);

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
  }, [dateRange]);

  // Client-side filtering of extractions history list
  const filteredHistory = historyItems.filter((item) => {
    // 1. Date Range Filter
    if (item.timestamp) {
      const itemDate = new Date(item.timestamp);
      if (dateRange.start && itemDate < dateRange.start) return false;
      if (dateRange.end && itemDate > dateRange.end) return false;
    }

    // 2. Status Filter
    const totalFields = item.data_points?.length || 0;
    const approved = Object.values(item.results || {}).filter(
      (v) => v !== null && v !== undefined
    ).length;
    const isCompleted = totalFields > 0 && approved === totalFields;

    if (statusFilter === "completed" && !isCompleted) return false;
    if (statusFilter === "pending" && isCompleted) return false;

    // 3. Template Filter
    if (templateFilter !== "all" && item.template_name !== templateFilter) return false;

    return true;
  });

  // Unique template names for the filter dropdown
  const uniqueTemplates = Array.from(
    new Set(historyItems.map((item) => item.template_name).filter(Boolean))
  );

  const stats = [
    {
      label: "Total Extractions",
      value: filteredHistory.length.toLocaleString(),
      icon: FileText,
      color: "blue",
      change: interval === "Daily" ? "vs Yesterday" : interval === "Weekly" ? "vs Last Week" : interval === "Yearly" ? "vs Last Year" : "vs Last Month",
    },
    {
      label: "Fields Approved",
      value: dashboardMetrics.approved.toLocaleString(),
      icon: CheckCircle,
      color: "green",
      change: interval === "Daily" ? "vs Yesterday" : interval === "Weekly" ? "vs Last Week" : interval === "Yearly" ? "vs Last Year" : "vs Last Month",
    },
    {
      label: "Fields Flagged",
      value: dashboardMetrics.flagged.toLocaleString(),
      icon: AlertTriangle,
      color: "red",
      change: interval === "Daily" ? "vs Yesterday" : interval === "Weekly" ? "vs Last Week" : interval === "Yearly" ? "vs Last Year" : "vs Last Month",
    },
    {
      label: "Pending Review",
      value: dashboardMetrics.pending.toLocaleString(),
      icon: Clock,
      color: "gray",
      change: interval === "Daily" ? "vs Yesterday" : interval === "Weekly" ? "vs Last Week" : interval === "Yearly" ? "vs Last Year" : "vs Last Month",
    },
  ];

  const recentPerPage = 10;
  const recentTotalPages = Math.max(1, Math.ceil(filteredHistory.length / recentPerPage));
  const recentStart = (recentPage - 1) * recentPerPage;
  const recentItems = filteredHistory.slice(recentStart, recentStart + recentPerPage);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifPopup(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setShowDateDropdown(false);
      }
      if (intervalRef.current && !intervalRef.current.contains(e.target)) {
        setShowIntervalDropdown(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleCustomDateApply = (e) => {
    e.preventDefault();
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      
      setDateRange({
        type: "custom",
        start,
        end,
        label: "Custom Range"
      });
      setShowDateDropdown(false);
    }
  };

  const getDateRangeButtonLabel = () => {
    if (dateRange.type === "all") return "All Time";
    if (dateRange.start && dateRange.end) {
      const options = { month: "short", day: "numeric" };
      return `${dateRange.start.toLocaleDateString("en-US", options)} - ${dateRange.end.toLocaleDateString("en-US", options)}`;
    }
    return dateRange.label;
  };

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
          <div className="bell-container" ref={bellRef}>
            <button className="icon-btn" onClick={() => setShowNotifPopup(!showNotifPopup)} aria-label="Notifications">
              <Bell size={16} />
              {unreadCount > 0 && <span className="bell-red-dot" />}
            </button>
            {showNotifPopup && (
              <div className="bell-notifications-popup">
                <div className="popup-header">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && <span className="unread-badge">{unreadCount} new</span>}
                </div>
                <div className="popup-body">
                  {notifications.length === 0 ? (
                    <div className="popup-empty-state">No notifications.</div>
                  ) : (
                    notifications.slice(0, 3).map((notif) => (
                      <div
                        key={notif.id}
                        className={`popup-item ${notif.unread ? 'unread' : ''}`}
                        onClick={() => {
                          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
                        }}
                        title="Click to mark as read"
                      >
                        <div className="popup-item-top">
                          <span className="popup-item-title">{notif.title}</span>
                          <span className="popup-item-time">{notif.time}</span>
                        </div>
                        <p className="popup-item-desc">{notif.description}</p>
                      </div>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  className="popup-footer-btn"
                  onClick={() => {
                    setShowNotifPopup(false);
                    setActiveNav("settings");
                    setSettingsTab("Notifications");
                  }}
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
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
            {/* 1. Date Range Picker */}
            <div className="dropdown-action-container" ref={dateRef}>
              <button className={`header-btn ${dateRange.type !== 'all' ? 'active' : ''}`} onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setShowIntervalDropdown(false);
                setShowFilterDropdown(false);
              }}>
                <Calendar size={14} />
                {getDateRangeButtonLabel()}
              </button>
              {showDateDropdown && (
                <div className="dashboard-dropdown-popup date-popup">
                  <button className={dateRange.type === 'all' ? 'active' : ''} onClick={() => {
                    setDateRange({ type: "all", start: null, end: null, label: "All Time" });
                    setShowDateDropdown(false);
                  }}>All Time</button>
                  <button className={dateRange.type === '7days' ? 'active' : ''} onClick={() => {
                    const start = new Date();
                    start.setDate(start.getDate() - 7);
                    start.setHours(0,0,0,0);
                    setDateRange({ type: "7days", start, end: new Date(), label: "Last 7 Days" });
                    setShowDateDropdown(false);
                  }}>Last 7 Days</button>
                  <button className={dateRange.type === '30days' ? 'active' : ''} onClick={() => {
                    const start = new Date();
                    start.setDate(start.getDate() - 30);
                    start.setHours(0,0,0,0);
                    setDateRange({ type: "30days", start, end: new Date(), label: "Last 30 Days" });
                    setShowDateDropdown(false);
                  }}>Last 30 Days</button>
                  <button className={dateRange.type === 'thismonth' ? 'active' : ''} onClick={() => {
                    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                    setDateRange({ type: "thismonth", start, end: new Date(), label: "This Month" });
                    setShowDateDropdown(false);
                  }}>This Month</button>
                  <div className="dropdown-custom-range">
                    <div className="custom-range-title">Custom Range</div>
                    <form onSubmit={handleCustomDateApply}>
                      <div className="custom-range-inputs">
                        <label>
                          <span>Start:</span>
                          <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} required />
                        </label>
                        <label>
                          <span>End:</span>
                          <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} required />
                        </label>
                      </div>
                      <button type="submit" className="custom-range-btn">Apply Range</button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Frequency/Interval Dropdown */}
            <div className="dropdown-action-container" ref={intervalRef}>
              <button className="header-btn" onClick={() => {
                setShowIntervalDropdown(!showIntervalDropdown);
                setShowDateDropdown(false);
                setShowFilterDropdown(false);
              }}>
                {interval}
                <ChevronDown size={14} />
              </button>
              {showIntervalDropdown && (
                <div className="dashboard-dropdown-popup">
                  {["Daily", "Weekly", "Monthly", "Yearly"].map((item) => (
                    <button
                      key={item}
                      className={interval === item ? 'active' : ''}
                      onClick={() => {
                        setIntervalVal(item);
                        setShowIntervalDropdown(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Filter Dropdown */}
            <div className="dropdown-action-container" ref={filterRef}>
              <button className={`header-btn ${(statusFilter !== 'all' || templateFilter !== 'all') ? 'active' : ''}`} onClick={() => {
                setShowFilterDropdown(!showFilterDropdown);
                setShowDateDropdown(false);
                setShowIntervalDropdown(false);
              }}>
                <Filter size={14} />
                Filter {(statusFilter !== 'all' || templateFilter !== 'all') && <span className="active-filter-dot" />}
              </button>
              {showFilterDropdown && (
                <div className="dashboard-dropdown-popup filter-popup">
                  <div className="filter-section">
                    <div className="filter-section-title">Status</div>
                    <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter("all")}>All Statuses</button>
                    <button className={statusFilter === 'completed' ? 'active' : ''} onClick={() => setStatusFilter("completed")}>100% Approved</button>
                    <button className={statusFilter === 'pending' ? 'active' : ''} onClick={() => setStatusFilter("pending")}>Needs Review</button>
                  </div>
                  <div className="filter-section">
                    <div className="filter-section-title">Template</div>
                    <button className={templateFilter === 'all' ? 'active' : ''} onClick={() => setTemplateFilter("all")}>All Templates</button>
                    {uniqueTemplates.map((tpl) => (
                      <button
                        key={tpl}
                        className={templateFilter === tpl ? 'active' : ''}
                        onClick={() => setTemplateFilter(tpl)}
                      >
                        {tpl}
                      </button>
                    ))}
                  </div>
                  {(statusFilter !== 'all' || templateFilter !== 'all') && (
                    <button className="clear-filters-btn" onClick={() => {
                      setStatusFilter("all");
                      setTemplateFilter("all");
                      setShowFilterDropdown(false);
                    }}>
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 4. Export Button */}
            <button className="header-btn export-btn" onClick={() => exportAllToExcel(filteredHistory)} disabled={filteredHistory.length === 0} title="Export filtered extractions to Excel">
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
                          <button className="h-btn primary" onClick={() => setReviewItem(item)}>
                            <Eye size={13} />
                            <span>Review</span>
                          </button>
                          <button className="h-btn secondary" onClick={() => exportToExcel(item)}>
                            <Download size={13} />
                            <span>Export</span>
                          </button>
                          <button className="h-btn danger" onClick={() => deletePdf(item.id)}>
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
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