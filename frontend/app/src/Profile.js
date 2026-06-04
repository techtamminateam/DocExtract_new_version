import React, { useEffect, useMemo, useState } from 'react';

import {
  Area,
  AreaChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cloud,
  Database,
  FileCheck2,
  FileJson2,
  FileSpreadsheet,
  FileText,
  Globe,
  HardDrive,
  KeyRound,
  Layers3,
  LockKeyhole,
  MoreHorizontal,
  RefreshCcw,
  ScanText,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  Workflow,
  XCircle,
} from 'lucide-react';
import './Profile.css';

const API_URL = "http://localhost:5000/api";
const heroStats = [
  { label: 'Documents Processed', value: 12458, suffix: '', tone: 'blue' },
  { label: 'Extraction Accuracy', value: 99.4, suffix: '%', tone: 'green' },
  { label: 'Templates Created', value: 34, suffix: '', tone: 'violet' },
  { label: 'Active Integrations', value: 5, suffix: '', tone: 'amber' },
];

const documentTypeData = [
  { subject: 'Invoices', value: 94 },
  { subject: 'Contracts', value: 88 },
  { subject: 'Bank Statements', value: 82 },
  { subject: 'KYC Docs', value: 90 },
  { subject: 'Purchase Orders', value: 86 },
  { subject: 'Custom Templates', value: 80 },
];

const distributionData = [
  { name: 'Invoices', value: 34, color: '#2F62B8' },
  { name: 'Contracts', value: 18, color: '#4F8EF7' },
  { name: 'Bank Statements', value: 14, color: '#7BA8FF' },
  { name: 'KYC Documents', value: 12, color: '#10B981' },
  { name: 'Purchase Orders', value: 11, color: '#F59E0B' },
  { name: 'Custom Templates', value: 11, color: '#8B5CF6' },
];

const analyticsMetrics = [
  { label: 'Accuracy Rate', value: '99.4%', detail: '+0.8% vs last month' },
  { label: 'Avg Processing Time', value: '18s', detail: '-3s optimization gain' },
  { label: 'Auto Validation', value: '96.2%', detail: '412 successful validations' },
  { label: 'Export Success', value: '98.8%', detail: 'Stable across all formats' },
];

const activityData = [
  { name: 'Invoice_2026.pdf', type: 'Invoice', status: 'Approved', date: '03 Jun 2026', source: 'Google Drive' },
  { name: 'Contract_145.pdf', type: 'Contract', status: 'Exported', date: '03 Jun 2026', source: 'SharePoint' },
  { name: 'BankStatement_May.pdf', type: 'Bank Statement', status: 'Under Review', date: '02 Jun 2026', source: 'OneDrive' },
  { name: 'KYC_Client_42.zip', type: 'KYC', status: 'Processing', date: '02 Jun 2026', source: 'Dropbox' },
  { name: 'PO_1148.pdf', type: 'Purchase Order', status: 'Flagged', date: '01 Jun 2026', source: 'AWS S3' },
];

const performanceMetrics = [
  { label: 'OCR Accuracy', value: 98, tone: 'blue' },
  { label: 'Field Detection Accuracy', value: 96, tone: 'green' },
  { label: 'Validation Success Rate', value: 94, tone: 'violet' },
  { label: 'Auto Approval Rate', value: 91, tone: 'amber' },
];

const usageItems = [
  { label: 'Monthly Extractions', value: 650, total: 1000, display: '650 / 1000' },
  { label: 'Storage Usage', value: 2.4, total: 5, display: '2.4 GB / 5 GB' },
  { label: 'API Requests', value: 4500, total: 10000, display: '4,500 / 10,000' },
  { label: 'Templates Used', value: 8, total: 20, display: '8 / 20' },
];

const integrations = [
  { name: 'Google Drive', status: 'Connected', sync: 'Healthy', lastSync: '2 min ago', brand: 'google' },
  { name: 'OneDrive', status: 'Connected', sync: 'Syncing', lastSync: '8 min ago', brand: 'onedrive' },
  { name: 'Dropbox', status: 'Disconnected', sync: 'Paused', lastSync: 'Yesterday', brand: 'dropbox' },
  { name: 'AWS S3', status: 'Connected', sync: 'Healthy', lastSync: 'Just now', brand: 'aws' },
  { name: 'SharePoint', status: 'Connected', sync: 'Healthy', lastSync: '14 min ago', brand: 'sharepoint' },
];

const templates = [
  { name: 'Invoice Extractor', usage: 2840, lastUsed: '12 min ago' },
  { name: 'Contract Analyzer', usage: 1228, lastUsed: '43 min ago' },
  { name: 'Purchase Order Parser', usage: 968, lastUsed: 'Today' },
  { name: 'KYC Extractor', usage: 844, lastUsed: 'Yesterday' },
  { name: 'Bank Statement Extractor', usage: 731, lastUsed: 'Yesterday' },
];

const securityItems = [
  { icon: ShieldCheck, label: 'Two-Factor Authentication', value: 'Enabled', helper: 'Authenticator app active' },
  { icon: LockKeyhole, label: 'Password Last Updated', value: '15 days ago', helper: 'Rotation policy compliant' },
  { icon: UserCircle2, label: 'Active Sessions', value: '3 sessions', helper: 'Hyderabad, Singapore, Frankfurt' },
  { icon: KeyRound, label: 'API Keys', value: '4 active keys', helper: '1 expiring in 9 days' },
  { icon: BellRing, label: 'Recent Login Activity', value: 'No anomalies', helper: 'Last login today at 09:48 IST' },
];

const exportStats = [
  { name: 'Jan', csv: 320, excel: 420, json: 260, pdf: 180 },
  { name: 'Feb', csv: 360, excel: 450, json: 280, pdf: 190 },
  { name: 'Mar', csv: 380, excel: 490, json: 310, pdf: 220 },
  { name: 'Apr', csv: 420, excel: 520, json: 350, pdf: 250 },
  { name: 'May', csv: 455, excel: 560, json: 370, pdf: 270 },
  { name: 'Jun', csv: 480, excel: 610, json: 395, pdf: 300 },
];

const exportSummary = [
  { label: 'CSV Exports', value: '2,415', icon: FileText },
  { label: 'Excel Exports', value: '3,050', icon: FileSpreadsheet },
  { label: 'JSON Exports', value: '1,965', icon: FileJson2 },
  { label: 'PDF Reports', value: '1,410', icon: FileCheck2 },
];

const healthBreakdown = [
  { label: 'Extraction Accuracy', score: 96 },
  { label: 'Validation Success', score: 94 },
  { label: 'Storage Health', score: 88 },
  { label: 'Failed Jobs', score: 91 },
  { label: 'Template Efficiency', score: 93 },
];

const recommendations = [
  'Enable Auto Validation to improve efficiency.',
  'Connect Google Drive for automated backups.',
  'Archive low-use templates to improve governance.',
];

const fadeUp = {
  hidden: { opacity: 0, y: 26, filter: 'blur(10px)' },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

function CountUp({ value, suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let raf;
    const duration = 1200;
    const start = performance.now();

    const animate = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(value * eased);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className="hero-kpi-value">
      {count.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

function StatusBadge({ status }) {
  const toneMap = {
    Approved: 'success',
    Connected: 'success',
    Healthy: 'success',
    Exported: 'blue',
    Processing: 'blue',
    Syncing: 'blue',
    'Under Review': 'warning',
    Paused: 'warning',
    Flagged: 'danger',
    Disconnected: 'danger',
  };

  return <span className={`status-badge status-${toneMap[status] || 'neutral'}`}>{status}</span>;
}

function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="section-header-row">
      <div>
        <span className="section-eyebrow">{eyebrow}</span>
        <h3 className="section-title">{title}</h3>
        <p className="section-subtitle">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function ProgressLine({ label, value, total, display }) {
  const width = Math.min((value / total) * 100, 100);
  return (
    <div className="usage-row">
      <div className="usage-row-top">
        <span>{label}</span>
        <strong>{display}</strong>
      </div>
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          whileInView={{ width: `${width}%` }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

function BrandOrb({ brand }) {
  const brandStyles = {
    google: 'linear-gradient(135deg, #4285F4, #34A853)',
    onedrive: 'linear-gradient(135deg, #2563EB, #60A5FA)',
    dropbox: 'linear-gradient(135deg, #0061FF, #60A5FA)',
    aws: 'linear-gradient(135deg, #111827, #F59E0B)',
    sharepoint: 'linear-gradient(135deg, #0F766E, #2DD4BF)',
  };

  return <div className="brand-orb" style={{ background: brandStyles[brand] || '#CBD5E1' }} />;
}

function WorkspaceHealthRing() {
  const score = 92;
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="health-ring-wrap">
      <svg viewBox="0 0 220 220" className="health-ring-svg">
        <defs>
          <linearGradient id="healthStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2F62B8" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <circle className="health-ring-track" cx="110" cy="110" r={radius} />
        <motion.circle
          className="health-ring-progress"
          cx="110"
          cy="110"
          r={radius}
          stroke="url(#healthStroke)"
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: dashOffset }}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="health-ring-center">
        <span className="health-score-label">Workspace Health</span>
        <strong className="health-score-value">92%</strong>
        <span className="health-score-helper">Operationally strong</span>
      </div>
    </div>
  );
}

export function Profile() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    avatar_url: "",
    job_title: "",
    company_name: "",
    phone_number: "",
    email: localStorage.getItem("email") || "",
    userId : localStorage.getItem("id") || "",
  });

  const [stats, setStats] = useState({
    documnets_count:"",
    extraction_accuracy:"",
    templates_created:"",
    active_integrations:"",
  });
  

  useEffect(() => {
    const fecthStats = async () => {
      try {
        const userId = localStorage.getItem("id");
        const response = await fetch(`${API_URL}/profile/stats/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const result = await response.json();
        setStats({
          documnets_count: result.documents_count,
          templates_created: result.template_count
        });
      } catch (error) {
        console.assert(error.message);
      }
    };

    fecthStats();
  }, []);


  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userId = localStorage.getItem("id");
        if (!userId) return;

        const response = await fetch(`${API_URL}/profile/${userId}`);
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || "Failed to load profile");

        setProfileForm({
          full_name: result.full_name || "",
          avatar_url: result.avatar_url || "",
          job_title: result.job_title || "",
          company_name: result.company_name || "",
          phone_number: result.phone_number || "",
          email: result.email || localStorage.getItem("email") || "",
        });
      } catch (error) {
        console.error("Profile load error:", error.message);
      }
    };

    loadProfile();
  }, []);

const [profileErrors, setProfileErrors] = useState({});
  const totalExports = useMemo(
    () =>
      exportStats.reduce(
        (acc, item) => acc + item.csv + item.excel + item.json + item.pdf,
        0
      ),
    []
  );
  const handleSaveProfile = async () => {
    const newErrors = {};

    if (!profileForm.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    setProfileErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSavingProfile(true);

      const userId = localStorage.getItem("id");

      const response = await fetch(`${API_URL}/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          full_name: profileForm.full_name,
          avatar_url: profileForm.avatar_url,
          job_title: profileForm.job_title,
          company_name: profileForm.company_name,
          phone_number: profileForm.phone_number,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      setIsEditingProfile(false);
      setProfileErrors({});
    } catch (error) {
      setProfileErrors({ general: error.message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="aix-profile-page">
      <div className="dashboard-ambient dashboard-ambient-one" />
      <div className="dashboard-ambient dashboard-ambient-two" />

      <header className="profile-topbar">
        <div>
          <div className="profile-breadcrumbs">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <span className="active">Profile & Analytics</span>
          </div>
          <h1 className="profile-page-title">AIExtracter Profile & Workspace Overview</h1>
          <p className="profile-page-subtitle">
            Monitor AI extraction performance, workspace usage, integrations, security posture,
            and subscription intelligence from a unified enterprise-grade dashboard.
          </p>
        </div>
      </header>
      {isEditingProfile && (
        <section className="glass-card span-12 profile-edit-card">
          <div className="section-header-row">
            <div>
              <span className="section-eyebrow">Profile Settings</span>
              <h3 className="section-title">Update your profile</h3>
              <p className="section-subtitle">
                Add your personal and company details here.
              </p>
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="profile-form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={profileForm.full_name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, full_name: e.target.value })
                }
                placeholder="Enter full name"
              />
              {profileErrors.full_name && <p>{profileErrors.full_name}</p>}
            </div>

            <div className="profile-form-group">
              <label>Avatar URL</label>
              <input
                type="url"
                value={profileForm.avatar_url}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, avatar_url: e.target.value })
                }
                placeholder="https://example.com/avatar.png"
              />
            </div>

            <div className="profile-form-group">
              <label>Job Title</label>
              <input
                type="text"
                value={profileForm.job_title}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, job_title: e.target.value })
                }
                placeholder="Enter job title"
              />
            </div>

            <div className="profile-form-group">
              <label>Company Name</label>
              <input
                type="text"
                value={profileForm.company_name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, company_name: e.target.value })
                }
                placeholder="Enter company name"
              />
            </div>

            <div className="profile-form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={profileForm.phone_number}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, phone_number: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="profile-form-actions">
            <button
              className="ghost-action-btn"
              onClick={() => setIsEditingProfile(false)}
            >
              Cancel
            </button>
            <button
              className="primary-action-btn"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </section>
      )}
      <main className="dashboard-grid">
        <motion.section
          className="glass-card hero-card span-12"
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0.02}
        >
          <div className="hero-gradient-border" />
          <div className="hero-main-grid">
            <div className="hero-profile-block">
              <div className="hero-profile-top">
                <div className="hero-avatar-shell">
                  <img
                    className="hero-avatar"
                    src={profileForm.avatar_url || ""}
                    alt={profileForm.full_name || "User avatar"}
                  />
                  <span className="hero-avatar-status" />
                </div>
                <button
                  className="ghost-action-btn"
                  onClick={() => setIsEditingProfile(true)}
                >
                  Edit Profile
                </button>
              </div>

              <div className="hero-user-meta">
                <div className="hero-chip-row">
                  <span className="hero-chip hero-chip-primary">Professional Plan</span>
                  <span className="hero-chip">Workspace Admin</span>
                </div>
                  <h2>{profileForm.full_name || "Complete your profile"}</h2>
                  <p>{profileForm.job_title || "Add your job title"}</p>
                <div className="hero-company-row">
                  <span>{profileForm.company_name || "Add your company name"}</span>
                  <span className="dot-separator" />
                  <span>{profileForm.email || "No email available"}</span>
                </div>
              </div>
              
            </div>

            <div className="hero-kpi-grid">
              
                <motion.div
                  className={"hero-kpi-card tone-blue"}
                  key="Documents Processed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + 0 * 0.08, duration: 0.45 }}
                >
                  <span className="hero-kpi-label">Documents Processed</span>
                  <CountUp
                    value={stats.documnets_count}
                    suffix=""
                    decimals={String(stats.documnets_count).includes('.') ? 1 : 0}
                  />
                  <span className="hero-kpi-helper">
                    Updated in real time
                  </span>
                  
                </motion.div>
                <motion.div
                  className={"hero-kpi-card tone-green"}
                  key="Documents Processed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + 1 * 0.08, duration: 0.45 }}
                >
                  <span className="hero-kpi-label">Extraction Accuracy</span>
                  <CountUp
                    value={stats.extraction_accuracy || "0"}
                    suffix=""
                    decimals={String(stats.extraction_accuracy).includes('.') ? 1 : 0}
                  />
                  <span className="hero-kpi-helper">
                    Updated in real time
                  </span>
                </motion.div>
                <motion.div
                  className={"hero-kpi-card tone-violet"}
                  key="Templates Created"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + 2 * 0.08, duration: 0.45 }}
                >
                  <span className="hero-kpi-label">Templates Created</span>
                  <CountUp
                    value={stats.templates_created || "0"}
                    suffix=""
                    decimals={String(stats.templates_created).includes('.') ? 1 : 0}
                  />
                  <span className="hero-kpi-helper">
                    Updated in real time
                  </span>
                  
                </motion.div>
                <motion.div
                  className={"hero-kpi-card tone-amber"}
                  key="Active Integrations"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + 3 * 0.08, duration: 0.45 }}
                >
                  <span className="hero-kpi-label">Active Integrations</span>
                  <CountUp
                    value={stats.documnets_count || "0"}
                    suffix=""
                    decimals={String(stats.documnets_count).includes('.') ? 1 : 0}
                  />
                  <span className="hero-kpi-helper">
                    Updated in real time
                  </span>
                </motion.div>
    
            </div>
          </div>
        </motion.section>

        <motion.section
          className="glass-card span-8"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          custom={0.1}
          variants={fadeUp}
        >
          <SectionHeader
            eyebrow="AI Extraction Analytics"
            title="Document intelligence performance"
            subtitle="Track extraction quality by document class, processing reliability, and output success across the platform."
            action={
              <button className="text-action-btn">
                View detailed analytics
                <ArrowUpRight size={15} />
              </button>
            }
          />

          <div className="analytics-layout">
            <div className="chart-panel chart-panel-large">
              <div className="chart-shell loading-shimmer">
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={documentTypeData} outerRadius="70%">
                    <PolarGrid stroke="rgba(47, 98, 184, 0.12)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 12 }} />
                    <Radar
                      name="Extraction Quality"
                      dataKey="value"
                      stroke="#2F62B8"
                      fill="#4F8EF7"
                      fillOpacity={0.24}
                      strokeWidth={2.5}
                    />
                    <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 16px 40px rgba(15,23,42,0.12)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="metric-chip-grid">
                {analyticsMetrics.map((metric) => (
                  <div className="metric-chip" key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    <small>{metric.detail}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-panel chart-panel-side">
              <div className="mini-card-title">Extraction by document type</div>
              <div className="chart-shell doughnut-shell">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      innerRadius={68}
                      outerRadius={96}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="transparent"
                    >
                      {distributionData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid rgba(15,23,42,0.08)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="doughnut-center-label">
                  <strong>1.8M</strong>
                  <span>fields extracted</span>
                </div>
              </div>
              <div className="legend-stack">
                {distributionData.map((item) => (
                  <div className="legend-row" key={item.name}>
                    <div className="legend-row-left">
                      <span className="legend-color" style={{ background: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <strong>{item.value}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="glass-card span-4 recent-card"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          custom={0.14}
          variants={fadeUp}
        >
          <SectionHeader
            eyebrow="Recent Activity"
            title="Latest extraction jobs"
            subtitle="A live feed of recent document processing across the workspace."
          />
          <div className="activity-feed">
            {activityData.map((item) => (
              <div className="activity-item" key={`${item.name}-${item.date}`}>
                <div className="activity-item-top">
                  <div className="activity-file-icon">
                    <ScanText size={18} />
                  </div>
                  <div className="activity-main">
                    <strong>{item.name}</strong>
                    <span>{item.type} · {item.source}</span>
                  </div>
                </div>
                <div className="activity-item-bottom">
                  <StatusBadge status={item.status} />
                  <span className="activity-date">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="glass-card span-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          custom={0.18}
          variants={fadeUp}
        >
          <SectionHeader
            eyebrow="AI Performance Center"
            title="Extraction quality metrics"
            subtitle="Core machine intelligence KPIs with animated progress indicators."
          />
          <div className="performance-list">
            {performanceMetrics.map((metric) => (
              <div className="performance-item" key={metric.label}>
                <div className="performance-item-top">
                  <span>{metric.label}</span>
                  <strong>{metric.value}%</strong>
                </div>
                <div className="progress-track large-track">
                  <motion.div
                    className={`progress-fill tone-${metric.tone}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${metric.value}%` }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="glass-card span-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          custom={0.22}
          variants={fadeUp}
        >
          <SectionHeader
            eyebrow="Subscription & Usage"
            title="Plan capacity overview"
            subtitle="Monitor limits, consumption, and renewal details across the workspace."
          />
          <div className="plan-summary">
            <div>
              <span className="mini-label">Current Plan</span>
              <strong>Professional Plan</strong>
            </div>
            <div>
              <span className="mini-label">Renewal Date</span>
              <strong>28 Jan 2027</strong>
            </div>
          </div>
          <div className="usage-list">
            {usageItems.map((item) => (
              <ProgressLine key={item.label} {...item} />
            ))}
          </div>
        </motion.section>

        <motion.section
          className="glass-card span-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          custom={0.26}
          variants={fadeUp}
        >
          <SectionHeader
            eyebrow="Cloud Integrations"
            title="Connected platforms"
            subtitle="Manage cloud sync health, connection status, and operational readiness."
          />
          <div className="integration-list">
            {integrations.map((integration) => (
              <div className="integration-item" key={integration.name}>
                <div className="integration-left">
                  <BrandOrb brand={integration.brand} />
                  <div>
                    <strong>{integration.name}</strong>
                    <div className="integration-meta">
                      <StatusBadge status={integration.status} />
                      <StatusBadge status={integration.sync} />
                    </div>
                    <small>Last sync {integration.lastSync}</small>
                  </div>
                </div>
                <button className={`mini-action-btn ${integration.status === 'Connected' ? 'disconnect' : ''}`}>
                  {integration.status === 'Connected' ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="glass-card span-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          custom={0.3}
          variants={fadeUp}
        >
          <SectionHeader
            eyebrow="Favorite Templates"
            title="Frequently launched automations"
            subtitle="High-usage document extraction templates ready for one-click launch."
          />
          <div className="template-grid">
            {templates.map((template) => (
              <div className="template-card" key={template.name}>
                <div className="template-icon-wrap">
                  <Layers3 size={18} />
                </div>
                <div className="template-body">
                  <strong>{template.name}</strong>
                  <span>{template.usage.toLocaleString()} runs</span>
                  <small>Last used {template.lastUsed}</small>
                </div>
                <button className="launch-btn">Quick Launch</button>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="glass-card span-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          custom={0.34}
          variants={fadeUp}
        >
          <SectionHeader
            eyebrow="Security Center"
            title="Enterprise access posture"
            subtitle="Review authentication, sessions, credentials, and account protection signals."
          />
          <div className="security-list">
            {securityItems.map((item) => {
              const Icon = item.icon;
              return (
                <div className="security-item" key={item.label}>
                  <div className="security-icon-wrap">
                    <Icon size={18} />
                  </div>
                  <div className="security-text">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.helper}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          className="glass-card span-7"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          custom={0.38}
          variants={fadeUp}
        >
          <SectionHeader
            eyebrow="Export Analytics"
            title="Output format performance"
            subtitle="Analyze export usage across CSV, Excel, JSON, and PDF reporting pipelines."
          />
          <div className="export-summary-grid">
            {exportSummary.map((item) => {
              const Icon = item.icon;
              return (
                <div className="export-summary-card" key={item.label}>
                  <div className="export-summary-icon"><Icon size={18} /></div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              );
            })}
          </div>
          <div className="export-chart-shell">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={exportStats}>
                <defs>
                  <linearGradient id="excelFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2F62B8" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#2F62B8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid rgba(15,23,42,0.08)' }} />
                <Area type="monotone" dataKey="excel" stroke="#2F62B8" strokeWidth={2.5} fill="url(#excelFill)" />
                <Line type="monotone" dataKey="csv" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="json" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pdf" stroke="#F59E0B" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="export-footer-stats">
            <div>
              <span className="mini-label">Total exports</span>
              <strong>{totalExports.toLocaleString()}</strong>
            </div>
            <div>
              <span className="mini-label">Most used type</span>
              <strong>Excel Exports</strong>
            </div>
            <div>
              <span className="mini-label">Trend</span>
              <strong>+14.2% MoM</strong>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="glass-card span-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          custom={0.42}
          variants={fadeUp}
        >
          <SectionHeader
            eyebrow="Workspace Health Score"
            title="Operational readiness index"
            subtitle="A premium composite score built from quality, storage, failures, and template efficiency."
          />
          <WorkspaceHealthRing />
          <div className="health-breakdown-list">
            {healthBreakdown.map((item) => (
              <div className="health-breakdown-row" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.score}%</strong>
              </div>
            ))}
          </div>
          <div className="recommendation-box">
            <div className="recommendation-title">
              <Brain size={17} /> Recommendations
            </div>
            <ul>
              {recommendations.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

