import React from "react";
import { Search, Gift, Bell, Plus } from "lucide-react";
import "./Profile.css";

// ── Radar Chart ──────────────────────────────────────────────────────────────
function RadarChart({ data, size = 260 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = data.labels.length;

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2; // start from top

  const polarToXY = (angle, radius) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const seriesPoints = (values) =>
    values.map((v, i) => {
      const angle = startAngle + i * angleStep;
      const pt = polarToXY(angle, r * v);
      return `${pt.x},${pt.y}`;
    }).join(" ");

  return (
    <svg
      className="radar-svg"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
    >
      {/* Grid */}
      {gridLevels.map((level, li) => (
        <polygon
          key={li}
          points={Array.from({ length: n }, (_, i) => {
            const angle = startAngle + i * angleStep;
            const pt = polarToXY(angle, r * level);
            return `${pt.x},${pt.y}`;
          }).join(" ")}
          fill="none"
          stroke="#E5EBF0"
          strokeWidth="1"
        />
      ))}

      {/* Axes */}
      {Array.from({ length: n }, (_, i) => {
        const angle = startAngle + i * angleStep;
        const outer = polarToXY(angle, r);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={outer.x} y2={outer.y}
            stroke="#E5EBF0"
            strokeWidth="1"
          />
        );
      })}

      {/* Series: Achieved */}
      <polygon
        points={seriesPoints(data.achieved)}
        fill="rgba(88, 214, 141, 0.15)"
        stroke="#58D68D"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {data.achieved.map((v, i) => {
        const angle = startAngle + i * angleStep;
        const pt = polarToXY(angle, r * v);
        return <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#58D68D" />;
      })}

      {/* Series: Progressing */}
      <polygon
        points={seriesPoints(data.progressing)}
        fill="rgba(243, 156, 18, 0.12)"
        stroke="#F39C12"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {data.progressing.map((v, i) => {
        const angle = startAngle + i * angleStep;
        const pt = polarToXY(angle, r * v);
        return <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#F39C12" />;
      })}

      {/* Series: Want to Learn */}
      <polygon
        points={seriesPoints(data.wantLearn)}
        fill="rgba(74, 144, 217, 0.12)"
        stroke="#4A90D9"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {data.wantLearn.map((v, i) => {
        const angle = startAngle + i * angleStep;
        const pt = polarToXY(angle, r * v);
        return <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#4A90D9" />;
      })}

      {/* Labels */}
      {data.labels.map((label, i) => {
        const angle = startAngle + i * angleStep;
        const labelPt = polarToXY(angle, r * 1.22);
        return (
          <text
            key={i}
            x={labelPt.x}
            y={labelPt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="#6B7280"
            fontFamily="Inter, sans-serif"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Profile Page ─────────────────────────────────────────────────────────────
export function ProfilePage({ userName, userRole, userAvatar, onBackToDashboard }) {
  const displayName = userName || "Young Alaska";
  const displayRole = userRole || "Business Analyst";
  const displayAvatar = userAvatar || "https://i.pravatar.cc/150?img=68";

  const radarData = {
    labels: ["Client Mgmt", "Metrics", "User Flow", "User Research", "Accessibility", "Prototyping", "Visual Design"],
    achieved:    [0.80, 0.70, 0.85, 0.65, 0.60, 0.90, 0.75],
    progressing: [0.65, 0.55, 0.70, 0.80, 0.45, 0.60, 0.50],
    wantLearn:   [0.50, 0.90, 0.55, 0.40, 0.75, 0.45, 0.85],
  };

  const learningHistory = [
    { course: "Document Extraction Basics", cert: true,  duration: "16.5h" },
    { course: "Data Processing Fundamentals", cert: true,  duration: "12h"  },
    { course: "Template Design",              cert: false, duration: "3.5h"  },
    { course: "AI Integration Skills",        cert: true,  duration: "8h"   },
    { course: "Workflow Automation",          cert: true,  duration: "8h"   },
    { course: "Advanced Analytics",           cert: true,  duration: "24.5h" },
  ];

  const achievements = [
    { name: "Learning Master",   icon: "🏆", style: "gold",   current: 4, total: 5,  color: "#F39C12" },
    { name: "Skill Builder",     icon: "🥈", style: "silver", current: 1, total: 5,  color: "#95A5A6" },
    { name: "Leadership",        icon: "🛡️", style: "green",  current: 2, total: 2,  color: "#27AE60" },
    { name: "Communicator",      icon: "💬", style: "purple", current: 5, total: 10, color: "#8E44AD" },
    { name: "Innovator",         icon: "💡", style: "blue",   current: 3, total: 8,  color: "#2980B9" },
  ];

  const learningStats = [
    { icon: "⏱️", iconStyle: "yellow", name: "Total learning hours",    value: 254 },
    { icon: "📋", iconStyle: "purple", name: "Certificates completed",  value: 8   },
    { icon: "🔧", iconStyle: "blue",   name: "Hands-on practice hours", value: 14  },
    { icon: "✅", iconStyle: "green",  name: "Courses completed",       value: 12  },
  ];

  return (
    <div className="profile-page">
      {/* ── Top Nav Bar ── */}
      <div className="profile-top-nav">
        <div
          className="search-container"
          onClick={() => document.getElementById("profile-search-input")?.focus()}
          style={{ cursor: "text" }}
        >
          <Search size={14} className="search-icon" />
          <input
            id="profile-search-input"
            type="text"
            placeholder="Search"
            className="search-input"
          />
          <span className="search-shortcut">Alt + S</span>
        </div>

        <div className="profile-nav-actions">
          <button className="profile-icon-btn"><Gift size={16} /></button>
          <button className="profile-icon-btn"><Bell size={16} /></button>
          <button
            className="profile-icon-btn"
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              padding: 0,
            }}
          >
            <Plus size={14} />
          </button>

          <div className="profile-nav-divider" />

          <div className="profile-user-chip" onClick={onBackToDashboard}>
            <img src={displayAvatar} alt="Avatar" className="chip-avatar" />
            <div className="chip-info">
              <span className="chip-name">{displayName}</span>
              <span className="chip-role">{displayRole}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="profile-breadcrumb">
        <span onClick={onBackToDashboard} style={{ cursor: "pointer", color: "#4A90D9" }}>Dashboard</span>
        <span className="bc-sep">›</span>
        <span className="bc-active">{displayName}</span>
      </div>

      {/* ── Main Grid ── */}
      <div className="profile-content">

        {/* ── Profile Hero Card ── */}
        <div className="profile-hero-card">
          <button className="hero-more-btn" title="More options">⋯</button>

          <div className="hero-avatar-wrap">
            <div className="hero-avatar-ring">
              <img src={displayAvatar} alt={displayName} className="hero-avatar" />
            </div>
          </div>

          <div className="hero-name">{displayName}</div>
          <div className="hero-role">{displayRole}</div>

          <div className="hero-skills-row">
            <div className="hero-skill-item">
              <span className="hero-skill-label">Technical Skills</span>
              <span className="hero-skill-value">86%</span>
            </div>
            <div className="hero-skill-item">
              <span className="hero-skill-label">Soft Skills</span>
              <span className="hero-skill-value">92%</span>
            </div>
            <div className="hero-skill-item">
              <span className="hero-skill-label">Experience</span>
              <span className="hero-skill-value">8 yrs</span>
            </div>
          </div>
        </div>

        {/* ── Learning Time Radar ── */}
        <div className="profile-chart-card">
          <div className="card-title-row">
            <h3>Learning Time</h3>
            <div className="card-info-icon" title="Skill competency overview">i</div>
            <button className="card-expand-btn" title="Expand">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="radar-wrapper">
            <RadarChart data={radarData} size={270} />
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="profile-legend-card">
          <p className="legend-title">Legend</p>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-dot dot-dontknow" />
              Don't know this competency
            </div>
            <div className="legend-item">
              <div className="legend-dot dot-novice" />
              Novice
            </div>
            <div className="legend-item">
              <div className="legend-dot dot-beginner" />
              Advanced beginner
            </div>
            <div className="legend-item">
              <div className="legend-dot dot-competent" />
              Competent
            </div>
            <div className="legend-item">
              <div className="legend-dot dot-proficient" />
              Proficient
            </div>
            <div className="legend-item">
              <div className="legend-dot dot-expert" />
              Expert
            </div>
          </div>

          <div className="legend-divider" />

          <div className="legend-series">
            <div className="legend-series-item">
              <div className="legend-line" style={{ background: "#58D68D" }} />
              Achieved
            </div>
            <div className="legend-series-item">
              <div className="legend-line" style={{ background: "#F39C12" }} />
              Progressing
            </div>
            <div className="legend-series-item">
              <div className="legend-line" style={{ background: "#4A90D9" }} />
              Want to Learn
            </div>
          </div>
        </div>

        {/* ── Learning History ── */}
        <div className="profile-history-card">
          <div className="card-title-row">
            <h3>Learning History</h3>
            <div className="card-info-icon" title="Completed courses">i</div>
            <button className="card-expand-btn" title="Expand">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <table className="history-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Certification</th>
                <th style={{ textAlign: "right" }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {learningHistory.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.course}</td>
                  <td>
                    {item.cert
                      ? <span className="hist-cert-yes">Yes</span>
                      : <span className="hist-cert-no">–</span>
                    }
                  </td>
                  <td className="hist-duration">{item.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Achievements ── */}
        <div className="profile-achievements-card">
          <div className="card-title-row">
            <h3>Achievements</h3>
            <div className="card-info-icon" title="Your badges">i</div>
            <button className="card-expand-btn" title="Expand">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="achievements-list">
            {achievements.map((ach, idx) => {
              const pct = Math.round((ach.current / ach.total) * 100);
              return (
                <div key={idx} className="achievement-item">
                  <div className={`achievement-badge ${ach.style}`}>{ach.icon}</div>
                  <div className="achievement-info">
                    <div className="achievement-name">{ach.name}</div>
                    <div className="achievement-progress-wrap">
                      <div className="achievement-bar">
                        <div
                          className="achievement-bar-fill"
                          style={{ width: `${pct}%`, background: ach.color }}
                        />
                      </div>
                      <span className="achievement-count">{ach.current}/{ach.total}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Learning Statistics ── */}
        <div className="profile-stats-card">
          <div className="card-title-row">
            <h3>Learning Statistics</h3>
            <div className="card-info-icon" title="Your learning metrics">i</div>
            <button className="card-expand-btn" title="Expand">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="stat-table-header">
            <span>Name</span>
            <span>Value</span>
          </div>

          <div className="stat-rows">
            {learningStats.map((s, i) => (
              <div key={i} className="stat-row">
                <div className="stat-row-left">
                  <div className={`stat-row-icon ${s.iconStyle}`}>{s.icon}</div>
                  <span className="stat-row-name">{s.name}</span>
                </div>
                <span className="stat-row-value">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
