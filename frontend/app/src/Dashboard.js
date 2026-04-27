import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Zap,
} from "lucide-react";
import "./Dashboard.css";

const recentExtractions = [
  { id: "1", name: "Whatfix_SaaS_Agreement.pdf", template: "MSA Extraction", date: "2 hours ago", status: "completed", fields: 32, approved: 28 },
  { id: "2", name: "Vendor_Contract_Q1.pdf", template: "Contract Review", date: "5 hours ago", status: "completed", fields: 18, approved: 18 },
  { id: "3", name: "NDA_TechCorp_2024.pdf", template: "NDA Template", date: "Yesterday", status: "completed", fields: 12, approved: 10 },
  { id: "4", name: "Employment_Agreement.pdf", template: "HR Template", date: "2 days ago", status: "completed", fields: 24, approved: 22 },
  { id: "5", name: "Partnership_Agreement.pdf", template: "MSA Extraction", date: "3 days ago", status: "processing", fields: 28, approved: 0 },
];

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

export function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-container">

        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Monitor your document extractions and review activity</p>
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
              <div className="stat-header">
                <div className={`icon-box ${color}`}>
                  <Icon size={18} />
                </div>
                <span className="stat-change">{change}</span>
              </div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Main Section */}
        <div className="main-grid">

          {/* Recent Extractions */}
          <div className="recent">
            <div className="recent-header">
              <h2>Recent Extractions</h2>
              <button>
                View all <ArrowRight size={14} />
              </button>
            </div>

            <div className="recent-list">
              {recentExtractions.map((item) => (
                <div key={item.id} className="recent-item">
                  <FileText size={15} />

                  <div className="recent-info">
                    <div className="recent-name">{item.name}</div>
                    <div className="recent-meta">
                      {item.template} · {item.date}
                    </div>
                  </div>

                  <div className="recent-status">
                    <div className="status-text">
                      {item.approved}/{item.fields} fields
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress"
                        style={{
                          width: `${(item.approved / item.fields) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
              <button className="white-btn">Start Now</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}