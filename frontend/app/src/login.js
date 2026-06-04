import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  PlayCircle,
  FileText,
  Sparkles,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  Database,
  History,
  Upload,
  BrainCircuit,
  BadgeCheck,
  BarChart3,
  FolderOpen,
  Activity,
  ChevronLeft,
  ChevronRight,
  Star,
  HardDriveUpload,
  ScanSearch,
  LayoutTemplate,
  Gauge,
  Mail,
  Lock,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import { API_URL } from "./apiService.js";
import "./login.css";

const stats = [
  { label: "Documents Processed", value: 10000000, suffix: "M+", compact: true },
  { label: "Extraction Accuracy", value: 99.8, suffix: "%", decimals: 1 },
  { label: "Faster Processing", value: 70, suffix: "%" },
  { label: "Organizations", value: 500, suffix: "+" },
];

const features = [
  {
    icon: Upload,
    title: "PDF Upload",
    description: "Upload single or multiple PDF documents securely with encrypted transfer and fast intake pipelines.",
    size: "large",
  },
  {
    icon: LayoutTemplate,
    title: "Preset Templates",
    description: "Use predefined extraction templates for invoices, contracts, forms, and reports.",
    size: "small",
  },
  {
    icon: Sparkles,
    title: "AI Data Extraction",
    description: "Automatically extract structured information using advanced AI models tuned for document intelligence.",
    size: "large",
  },
  {
    icon: CheckCircle2,
    title: "Result Verification",
    description: "Review, compare, and validate extracted data before export with confidence indicators.",
    size: "small",
  },
  {
    icon: History,
    title: "History Dashboard",
    description: "Access previous extraction jobs, reports, audit traces, and analytics from one timeline.",
    size: "medium",
  },
  {
    icon: Cloud,
    title: "Cloud Integrations",
    description: "Connect Google Drive, OneDrive, Dropbox, and AWS S3 with seamless cloud sync.",
    size: "medium",
  },
];

const workflow = [
  {
    step: "Step 1",
    icon: FileText,
    title: "Upload Documents",
    description: "Drop PDFs, forms, invoices, and reports into a secure intake pipeline.",
  },
  {
    step: "Step 2",
    icon: BrainCircuit,
    title: "AI Extraction Engine",
    description: "Parse text, detect fields, classify layouts, and extract structured outputs.",
  },
  {
    step: "Step 3",
    icon: BadgeCheck,
    title: "Review & Verify Results",
    description: "Validate extracted values, compare confidence scores, and approve exceptions.",
  },
  {
    step: "Step 4",
    icon: BarChart3,
    title: "Export Structured Data",
    description: "Push results to CSV, JSON, dashboards, or cloud document storage.",
  },
];

const benefits = [
  {
    icon: Gauge,
    title: "Faster Automation",
    text: "Reduce manual document processing time by up to 70% across intake, review, and export flows.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Data Handling",
    text: "Enterprise-grade security, encrypted processing, and auditable document workflows.",
  },
  {
    icon: Database,
    title: "Clear Structured Results",
    text: "Convert scattered PDF content into reliable, organized, searchable business data.",
  },
  {
    icon: FolderOpen,
    title: "Cloud Accessibility",
    text: "Access documents and results anywhere through connected cloud storage systems.",
  },
];

const testimonials = [
  {
    quote:
      "AIExtracter reduced our document turnaround time from hours to minutes and made validation far less painful.",
    name: "Priya Nair",
    role: "Operations Lead, FinSure",
  },
  {
    quote:
      "The structured extraction and review workflow helped us improve accuracy while keeping our team in control.",
    name: "Kiran Rao",
    role: "Document Automation Manager, AxisFlow",
  },
  {
    quote:
      "Cloud sync plus audit history gave us a much cleaner way to manage high-volume document operations.",
    name: "Arjun Mehta",
    role: "Head of Process Excellence, NovaDocs",
  },
  {
    quote:
      "The dashboard and verification flow made AI outputs actually usable for production teams, not just demos.",
    name: "Sana Iqbal",
    role: "Digital Transformation Lead, ClearLedger",
  },
];

const integrations = [
  { name: "Google Drive", short: "GD" },
  { name: "OneDrive", short: "OD" },
  { name: "Dropbox", short: "DB" },
  { name: "AWS S3", short: "S3" },
];

function formatCounter(value, suffix = "", compact = false, decimals = 0) {
  if (compact && value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}${suffix}`;
  }
  if (typeof value === "number" && !Number.isInteger(value)) {
    return `${value.toFixed(decimals)}${suffix}`;
  }
  return `${value}${suffix}`;
}

function useCountUp(finalValue, trigger, decimals = 0, duration = 1400) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    let frame;
    const start = performance.now();

    const animate = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = finalValue * eased;
      setCount(Number(current.toFixed(decimals)));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [finalValue, trigger, decimals, duration]);

  return count;
}

const StatCard = ({ label, value, suffix, compact, decimals, start }) => {
  const animatedValue = useCountUp(value, start, decimals || 0);
  return (
    <div className="ae-stat-card reveal">
      <div className="ae-stat-value">
        {formatCounter(animatedValue, suffix, compact, decimals || 0)}
      </div>
      <div className="ae-stat-label">{label}</div>
    </div>
  );
};

const FeatureCard = ({ feature, index }) => {
  const Icon = feature.icon;
  return (
    <article className={`ae-feature-card ${feature.size} reveal`} style={{ animationDelay: `${index * 0.08}s` }}>
      <div className="ae-feature-glow" />
      <div className="ae-feature-icon">
        <Icon size={22} />
      </div>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </article>
  );
};

const WorkflowStep = ({ item, index, activeStep }) => {
  const Icon = item.icon;
  const isActive = activeStep === index;

  return (
    <div className={`ae-workflow-step reveal ${isActive ? "active" : ""}`}>
      <div className="ae-workflow-line" />
      <div className="ae-workflow-node">
        <Icon size={20} />
      </div>
      <div className="ae-workflow-copy">
        <span>{item.step}</span>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
    </div>
  );
};

const BenefitCard = ({ item, index }) => {
  const Icon = item.icon;
  return (
    <article className="ae-benefit-card reveal" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="ae-benefit-icon">
        <Icon size={20} />
      </div>
      <h3>{item.title}</h3>
      <p>{item.text}</p>
    </article>
  );
};

const TestimonialCard = ({ item, active }) => (
  <article className={`ae-testimonial-card ${active ? "active" : ""}`}>
    <div className="ae-stars">
      {[...Array(5)].map((_, idx) => (
        <Star key={idx} size={14} fill="currentColor" />
      ))}
    </div>
    <p>“{item.quote}”</p>
    <div className="ae-testimonial-author">
      <strong>{item.name}</strong>
      <span>{item.role}</span>
    </div>
  </article>
);

const AIExtracterLanding = ({ onLoginSuccess }) => {
  const [statsStarted, setStatsStarted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [cursorStyle, setCursorStyle] = useState({});
  const [authOpen, setAuthOpen] = useState(false);
  const [view, setView] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [accountData, setAccountData] = useState({
    email: "",
    verification_code: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const heroRef = useRef(null);
  const particleCanvasRef = useRef(null);

  const resetAuthState = () => {
    setErrors({});
    setIsCodeSent(false);
    setIsSendingCode(false);
    setIsLoading(false);
    setEmail("");
    setPassword("");
    setAccountData({
      email: "",
      verification_code: "",
      password: "",
      confirmPassword: "",
    });
  };

  const switchView = (nextView) => {
    setView(nextView);
    setErrors({});
    setIsCodeSent(false);
    setAccountData({
      email: "",
      verification_code: "",
      password: "",
      confirmPassword: "",
    });
    setEmail("");
    setPassword("");
  };

  const openAuth = (nextView = "login") => {
    setAuthOpen(true);
    switchView(nextView);
  };

  const closeAuth = () => {
    setAuthOpen(false);
    resetAuthState();
    setView("login");
  };

  const validateLogin = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAccountCreation = () => {
    const newErrors = {};

    if (!accountData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(accountData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!accountData.verification_code.trim()) {
      newErrors.verification_code = "Verification code is required";
    }

    if (!accountData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (accountData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (accountData.password !== accountData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Invalid email or password");
      }

      localStorage.setItem("id", result.user.id);
      localStorage.setItem("email", result.user.email);

      if (onLoginSuccess) {
        onLoginSuccess(result);
      }

      closeAuth();
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!accountData.email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(accountData.email)) {
      setErrors({ email: "Please enter a valid email" });
      return;
    }

    setIsSendingCode(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/send-verification-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: accountData.email,
          password: accountData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setIsCodeSent(true);
      setErrors({ success: "✓ Verification code sent to your email!" });
    } catch (error) {
      setErrors({ email: error.message });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResetSendCode = async () => {
    if (!accountData.email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(accountData.email)) {
      setErrors({ email: "Please enter a valid email" });
      return;
    }

    setIsSendingCode(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: accountData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setIsCodeSent(true);
      setErrors({ success: "✓ Verification code sent to your email!" });
    } catch (error) {
      setErrors({ email: error.message });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!validateAccountCreation()) return;

    if (!isCodeSent) {
      setErrors({ general: "Please verify your email first" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/register/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: accountData.email,
          verification_code: accountData.verification_code,
          password: accountData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to setup account");
      }

      setErrors({ success: "✓ Account created successfully! Redirecting to login..." });

      setTimeout(() => {
        setAccountData({
          email: "",
          verification_code: "",
          password: "",
          confirmPassword: "",
        });
        setIsCodeSent(false);
        setErrors({});
        setView("login");
      }, 2000);
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateAccountCreation()) return;

    if (!isCodeSent) {
      setErrors({ general: "Please verify your email first" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/forgot-password/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: accountData.email,
          verification_code: accountData.verification_code,
          new_password: accountData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to setup account");
      }

      setErrors({ success: "✓ Password reseted successfully! Redirecting to login..." });

      setTimeout(() => {
        setAccountData({
          email: "",
          verification_code: "",
          password: "",
          confirmPassword: "",
        });
        setIsCodeSent(false);
        setErrors({});
        setView("login");
      }, 2000);
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === "Enter") {
      action();
    }
  };

  const isLoginDisabled = !email || !password || isLoading;
  const isCreateDisabled =
    !accountData.email ||
    !accountData.verification_code ||
    !accountData.password ||
    !accountData.confirmPassword ||
    isLoading;

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.16 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const statsSection = document.querySelector(".ae-stats-grid");
    if (!statsSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStatsStarted(true);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(statsSection);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflow.length);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 3800);

    return () => clearInterval(testimonialInterval);
  }, []);

  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrame;
    let width = 0;
    let height = 0;
    const pointer = { x: null, y: null };

    const setSize = () => {
      const parent = canvas.parentElement;
      width = parent.offsetWidth;
      height = parent.offsetHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const createParticles = (count) =>
      Array.from({ length: count }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 2.2 + 1,
      }));

    let particles = createParticles(window.innerWidth < 768 ? 28 : 48);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const distanceToPointer =
          pointer.x !== null ? Math.hypot(pointer.x - p.x, pointer.y - p.y) : Infinity;

        ctx.beginPath();
        ctx.fillStyle =
          distanceToPointer < 140
            ? "rgba(120, 188, 255, 0.95)"
            : "rgba(112, 132, 255, 0.55)";
        ctx.shadowBlur = distanceToPointer < 140 ? 18 : 8;
        ctx.shadowColor = "rgba(99, 179, 255, 0.8)";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        for (let j = i + 1; j < particles.length; j += 1) {
          const q = particles[j];
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(90, 130, 255, ${0.16 - dist / 900})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
            ctx.closePath();
          }
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    const handleMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };

    const handleLeave = () => {
      pointer.x = null;
      pointer.y = null;
    };

    setSize();
    particles = createParticles(window.innerWidth < 768 ? 28 : 48);
    draw();

    window.addEventListener("resize", setSize);
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", setSize);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const extractionRows = useMemo(
    () => [
      { field: "Invoice No", value: "INV-2026-1048", status: "Verified" },
      { field: "Vendor", value: "Northstar Health Services", status: "Verified" },
      { field: "Amount", value: "$18,420.00", status: "Review" },
      { field: "Policy ID", value: "PL-88-2041", status: "Verified" },
    ],
    []
  );

  const handleHeroMove = (e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCursorStyle({
      left: `${x}px`,
      top: `${y}px`,
      opacity: 1,
    });
  };

  const handleHeroLeave = () => {
    setCursorStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div className="ae-page">
      <div className="ae-aurora ae-aurora-one" />
      <div className="ae-aurora ae-aurora-two" />
      <div className="ae-aurora ae-aurora-three" />
      <canvas ref={particleCanvasRef} className="ae-particle-canvas" />

      <header className="ae-header">
        <div className="ae-container ae-header-inner">
          <a href="#hero" className="ae-logo" aria-label="AIExtracter home">
            <div className="ae-logo-mark">
              <BrainCircuit size={20} />
            </div>
            <div className="ae-logo-text">
              <strong>AIExtracter</strong>
              <small>Document Intelligence Platform</small>
            </div>
          </a>

          <nav className="ae-nav">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#testimonials">Testimonials</a>
          </nav>

          <div className="ae-header-actions">
            <button className="ae-btn ae-btn-ghost" onClick={() => openAuth("forgot")}>
              Forgot Password
            </button>
            <button className="ae-btn ae-btn-secondary" onClick={() => openAuth("login")}>
              Sign In
            </button>
            <button className="ae-btn ae-btn-primary" onClick={() => openAuth("create")}>
              Try AIExtracter
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section
          id="hero"
          className="ae-hero"
          ref={heroRef}
          onMouseMove={handleHeroMove}
          onMouseLeave={handleHeroLeave}
        >
          <div className="ae-hero-cursor" style={cursorStyle} />
          <div className="ae-container ae-hero-grid">
            <div className="ae-hero-copy reveal">
              <div className="ae-eyebrow">
                <Sparkles size={14} />
                AI-powered document intelligence
              </div>

              <h1>Transform Documents Into Actionable Data with AI</h1>

              <p>
                Upload PDFs, extract structured information using AI, verify results instantly,
                and seamlessly export or sync with your cloud storage.
              </p>

              <div className="ae-hero-actions">
                <button className="ae-btn ae-btn-primary ae-btn-magnetic" onClick={() => openAuth("create")}>
                  🚀 Try AIExtracter
                  <ArrowRight size={17} />
                </button>
                <button className="ae-btn ae-btn-secondary ae-btn-magnetic" onClick={() => openAuth("login")}>
                  <PlayCircle size={18} />
                  Watch Demo
                </button>
              </div>

              <div className="ae-hero-mini-proof">
                <span>Secure workflows</span>
                <span>Human-in-the-loop validation</span>
                <span>Cloud-ready exports</span>
              </div>
            </div>

            <div className="ae-hero-visual reveal">
  <div className="ae-hero-orbit ae-orbit-one" />
  <div className="ae-hero-orbit ae-orbit-two" />

  <div className="ae-workflow-board">
    <div className="ae-board-glow ae-board-glow-one" />
    <div className="ae-board-glow ae-board-glow-two" />
    <div className="ae-board-rail ae-rail-horizontal" />
    <div className="ae-board-rail ae-rail-vertical" />

    <div className="ae-floating-card ae-card-upload">
      <div className="ae-card-top">
        <HardDriveUpload size={18} />
        <span>PDF Upload</span>
      </div>
      <div className="ae-doc-stack">
        <div className="ae-doc-item">
          <FileText size={16} />
          <span>invoice_batch_24.pdf</span>
        </div>
        <div className="ae-doc-item">
          <FileText size={16} />
          <span>claim_form_112.pdf</span>
        </div>
        <div className="ae-doc-item">
          <FileText size={16} />
          <span>contract_archive.pdf</span>
        </div>
      </div>
    </div>

    <div className="ae-connector ae-connector-one" />

    <div className="ae-floating-card ae-card-ai">
      <div className="ae-card-top">
        <BrainCircuit size={18} />
        <span>AI Processing</span>
      </div>
      <div className="ae-ai-core">
        <div className="ae-ai-pulse" />
        <div className="ae-ai-pulse pulse-two" />
        <div className="ae-ai-node n1" />
        <div className="ae-ai-node n2" />
        <div className="ae-ai-node n3" />
        <div className="ae-ai-node n4" />
        <div className="ae-ai-center">AI</div>
      </div>
    </div>

    <div className="ae-connector ae-connector-two" />

    <div className="ae-floating-card ae-card-verify">
      <div className="ae-card-top">
        <ScanSearch size={18} />
        <span>Data Verification</span>
      </div>
      <div className="ae-verify-list">
        {extractionRows.map((row) => (
          <div key={row.field} className="ae-verify-row">
            <div>
              <strong>{row.field}</strong>
              <span>{row.value}</span>
            </div>
            <em className={row.status === "Verified" ? "ok" : "review"}>
              {row.status}
            </em>
          </div>
        ))}
      </div>
    </div>

    <div className="ae-connector ae-connector-three" />

    <div className="ae-floating-card ae-card-export">
      <div className="ae-card-top">
        <BarChart3 size={18} />
        <span>Export Results</span>
      </div>
      <div className="ae-export-panel">
        <div className="ae-export-bar">
          <span>CSV</span>
          <div><i style={{ width: "92%" }} /></div>
        </div>
        <div className="ae-export-bar">
          <span>JSON</span>
          <div><i style={{ width: "78%" }} /></div>
        </div>
        <div className="ae-export-bar">
          <span>Cloud Sync</span>
          <div><i style={{ width: "96%" }} /></div>
        </div>
      </div>
    </div>

    <div className="ae-live-chip chip-one">OCR complete</div>
    <div className="ae-live-chip chip-two">12 fields verified</div>
    <div className="ae-live-chip chip-three">Sync active</div>
  </div>
</div>
          </div>
        </section>

        <section className="ae-stats">
          <div className="ae-container">
            <div className="ae-stats-grid">
              {stats.map((item) => (
                <StatCard key={item.label} {...item} start={statsStarted} />
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="ae-section">
          <div className="ae-container">
            <div className="ae-section-head reveal">
              <span className="ae-section-kicker">Platform Features</span>
              <h2>Built for modern document operations</h2>
              <p>
                From intelligent intake to validation and cloud delivery, every step is designed
                to reduce manual work and increase trust in AI-driven extraction.
              </p>
            </div>

            <div className="ae-features-grid">
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} feature={feature} index={index} />
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="ae-section ae-section-alt">
          <div className="ae-container">
            <div className="ae-section-head reveal">
              <span className="ae-section-kicker">Visual Workflow</span>
              <h2>AIExtracter turns complex documents into usable business data</h2>
              <p>
                The workflow is designed to be transparent, auditable, and easy to review before
                anything gets exported downstream.
              </p>
            </div>

            <div className="ae-workflow-timeline">
              {workflow.map((item, index) => (
                <WorkflowStep key={item.title} item={item} index={index} activeStep={activeStep} />
              ))}
            </div>
          </div>
        </section>

        <section className="ae-section">
          <div className="ae-container">
            <div className="ae-section-head reveal">
              <span className="ae-section-kicker">Benefits</span>
              <h2>Premium automation with practical business outcomes</h2>
              <p>
                AIExtracter is built for speed, reviewability, reliability, and secure access
                across distributed document operations.
              </p>
            </div>

            <div className="ae-benefits-grid">
              {benefits.map((item, index) => (
                <BenefitCard key={item.title} item={item} index={index} />
              ))}
            </div>
          </div>
        </section>

        <section id="dashboard" className="ae-section ae-dashboard-section">
          <div className="ae-container ae-dashboard-grid">
            <div className="ae-dashboard-copy reveal">
              <span className="ae-section-kicker">Dashboard Preview</span>
              <h2>See extraction, validation, and analytics in one place</h2>
              <p>
                Monitor uploaded files, live progress, verification states, analytics, and recent
                activity from a clean operational dashboard.
              </p>

              <ul className="ae-dashboard-points">
                <li><CheckCircle2 size={16} />Uploaded files and processing queues</li>
                <li><CheckCircle2 size={16} />Validation status and review exceptions</li>
                <li><CheckCircle2 size={16} />Analytics cards and document activity history</li>
              </ul>
            </div>

            <div className="ae-dashboard-mockup reveal">
              <div className="ae-dash-window">
                <div className="ae-dash-sidebar">
                  <div className="ae-dash-brand">AE</div>
                  <span className="active">Dashboard</span>
                  <span>New Extractions</span>
                  <span>Templates</span>
                  <span>Integrations</span>
                  <span>History</span>
                </div>

                <div className="ae-dash-main">
                  <div className="ae-dash-topbar">
                    <div>
                      <strong>Document Intelligence Console</strong>
                      <small>Live AI extraction workflow</small>
                    </div>
                    <div className="ae-dash-status">
                      <i />
                      Syncing
                    </div>
                  </div>

                  <div className="ae-dash-kpis">
                    <div className="ae-kpi-card">
                      <span>Total Extractions</span>
                      <strong>1,284</strong>
                    </div>
                    <div className="ae-kpi-card">
                      <span>Fields Approved</span>
                      <strong>5,002</strong>
                    </div>
                    <div className="ae-kpi-card">
                      <span>Pending Review</span>
                      <strong>546</strong>
                    </div>
                  </div>

                  <div className="ae-dash-panels">
                    <div className="ae-dash-panel large">
                      <div className="ae-panel-head">
                        <span>Extraction Progress</span>
                        <Activity size={16} />
                      </div>
                      <div className="ae-progress-list">
                        <div className="ae-progress-row">
                          <span>Claims Packet - Batch 24</span>
                          <div className="ae-progress-track"><i style={{ width: "84%" }} /></div>
                        </div>
                        <div className="ae-progress-row">
                          <span>Invoice Set - Q2</span>
                          <div className="ae-progress-track"><i style={{ width: "62%" }} /></div>
                        </div>
                        <div className="ae-progress-row">
                          <span>Contract Review Archive</span>
                          <div className="ae-progress-track"><i style={{ width: "93%" }} /></div>
                        </div>
                      </div>
                    </div>

                    <div className="ae-dash-panel">
                      <div className="ae-panel-head">
                        <span>Validation Status</span>
                        <BadgeCheck size={16} />
                      </div>
                      <div className="ae-status-list">
                        <div><b className="ok" /> Verified 842</div>
                        <div><b className="warn" /> Needs review 29</div>
                        <div><b className="wait" /> In progress 113</div>
                      </div>
                    </div>

                    <div className="ae-dash-panel">
                      <div className="ae-panel-head">
                        <span>Analytics</span>
                        <BarChart3 size={16} />
                      </div>
                      <div className="ae-chart-bars">
                        <i style={{ height: "42%" }} />
                        <i style={{ height: "70%" }} />
                        <i style={{ height: "58%" }} />
                        <i style={{ height: "88%" }} />
                        <i style={{ height: "76%" }} />
                        <i style={{ height: "98%" }} />
                      </div>
                    </div>

                    <div className="ae-dash-panel large">
                      <div className="ae-panel-head">
                        <span>Recent Activity</span>
                        <History size={16} />
                      </div>
                      <div className="ae-activity-list">
                        <div>
                          <strong>Invoice batch exported to S3</strong>
                          <span>2 min ago</span>
                        </div>
                        <div>
                          <strong>12 exceptions flagged for review</strong>
                          <span>6 min ago</span>
                        </div>
                        <div>
                          <strong>Claim packet extraction completed</strong>
                          <span>11 min ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ae-section ae-integrations-section">
          <div className="ae-container">
            <div className="ae-section-head reveal">
              <span className="ae-section-kicker">Cloud Integrations</span>
              <h2>Connect with the platforms your team already uses</h2>
              <p>
                Sync extracted results into storage and downstream workflows with a clean,
                cloud-native integration layer.
              </p>
            </div>

            <div className="ae-orbit-wrap reveal">
              <div className="ae-orbit-center">
                <Cloud size={26} />
                <strong>Cloud Sync Hub</strong>
              </div>

              {integrations.map((item, index) => (
                <div key={item.name} className={`ae-orbit-icon orbit-${index + 1}`}>
                  <span>{item.short}</span>
                  <small>{item.name}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="ae-section ae-section-alt">
          <div className="ae-container">
            <div className="ae-section-head reveal">
              <span className="ae-section-kicker">Testimonials</span>
              <h2>Teams use AIExtracter to move faster with more confidence</h2>
              <p>
                Real value comes from speed, visibility, and verified extraction that fits
                operational teams, not just prototypes.
              </p>
            </div>

            <div className="ae-testimonials-shell reveal">
              <button
                className="ae-slider-btn"
                onClick={() =>
                  setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
                }
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="ae-testimonials-track">
                {testimonials.map((item, index) => (
                  <TestimonialCard
                    key={`${item.name}-${index}`}
                    item={item}
                    active={index === activeTestimonial}
                  />
                ))}
              </div>

              <button
                className="ae-slider-btn"
                onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
                aria-label="Next testimonial"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

        <section className="ae-final-cta">
          <div className="ae-container">
            <div className="ae-final-cta-card reveal">
              <div className="ae-final-rings ring-one" />
              <div className="ae-final-rings ring-two" />
              <span className="ae-section-kicker">Get Started</span>
              <h2>Ready to Automate Document Processing with AI?</h2>
              <p>
                Start extracting, validating, and managing documents intelligently in minutes.
              </p>

              <div className="ae-hero-actions">
                <button className="ae-btn ae-btn-primary ae-btn-magnetic" onClick={() => openAuth("create")}>
                  🚀 Get Started Free
                  <ArrowRight size={17} />
                </button>
                <button className="ae-btn ae-btn-secondary ae-btn-magnetic" onClick={() => openAuth("login")}>
                  📅 Schedule Demo
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {authOpen && (
        <div className="ae-auth-overlay" onClick={closeAuth}>
          <div className="ae-auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ae-auth-close" onClick={closeAuth} aria-label="Close modal">
              <X size={18} />
            </button>

            <div className="ae-auth-brand">
              <div className="ae-logo-mark">
                <BrainCircuit size={20} />
              </div>
              <div>
                <strong>AIExtracter Access</strong>
                <small>Secure document intelligence workspace</small>
              </div>
            </div>

            {errors.general && (
              <div className="ae-alert ae-alert-error">
                <AlertCircle size={18} />
                <p>{errors.general}</p>
              </div>
            )}

            {errors.success && (
              <div className="ae-alert ae-alert-success">
                <Check size={18} />
                <p>{errors.success}</p>
              </div>
            )}

            {view === "login" && (
              <div className="ae-auth-card">
                <h3>Sign in to AIExtracter</h3>
                <p className="ae-auth-subtitle">
                  Access your extraction history, templates, and validation dashboard.
                </p>

                <div className="ae-form-group">
                  <label className="ae-form-label">Email</label>
                  <div className="ae-input-wrapper">
                    <Mail className="ae-input-icon" size={18} />
                    <input
                      type="email"
                      className="ae-form-input"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors({});
                      }}
                      onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                    />
                  </div>
                  {errors.email && <p className="ae-error-text">{errors.email}</p>}
                </div>

                <div className="ae-form-group">
                  <label className="ae-form-label">Password</label>
                  <div className="ae-input-wrapper">
                    <Lock className="ae-input-icon" size={18} />
                    <input
                      type="password"
                      className="ae-form-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors({});
                      }}
                      onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                    />
                  </div>
                  {errors.password && <p className="ae-error-text">{errors.password}</p>}
                </div>

                <div className="ae-auth-links-row">
                  <button className="ae-text-link" onClick={() => switchView("forgot")}>
                    Forgot Password?
                  </button>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={isLoginDisabled}
                  className="ae-auth-btn"
                >
                  {isLoading ? <div className="ae-loader" /> : "Login"}
                </button>

                <div className="ae-auth-footer">
                  <p>
                    New user?{" "}
                    <button className="ae-text-link inline" onClick={() => switchView("create")}>
                      Create Account
                    </button>
                  </p>
                </div>
              </div>
            )}

            {view === "create" && (
              <div className="ae-auth-card">
                <h3>Create your account</h3>
                <p className="ae-auth-subtitle">
                  Setup your password and start using AIExtracter in minutes.
                </p>

                <div className="ae-form-group">
                  <label className="ae-form-label">Email</label>
                  <input
                    type="email"
                    className="ae-form-input ae-no-icon"
                    placeholder="Enter your registered email"
                    value={accountData.email}
                    disabled={isCodeSent}
                    onChange={(e) => {
                      setAccountData({ ...accountData, email: e.target.value });
                      setErrors({});
                    }}
                  />
                  {errors.email && <p className="ae-error-text">{errors.email}</p>}
                </div>

                <div className="ae-form-group">
                  <label className="ae-form-label">Verification Code</label>
                  <div className="ae-flex-gap">
                    <input
                      type="text"
                      className="ae-form-input ae-no-icon"
                      placeholder="Enter code"
                      value={accountData.verification_code}
                      onChange={(e) => {
                        setAccountData({ ...accountData, verification_code: e.target.value });
                        setErrors({});
                      }}
                    />
                    <button
                      onClick={handleSendCode}
                      disabled={isSendingCode || isCodeSent}
                      className="ae-secondary-btn"
                    >
                      {isSendingCode ? <div className="ae-loader-small" /> : isCodeSent ? "Sent" : "Send Code"}
                    </button>
                  </div>
                  {errors.verification_code && (
                    <p className="ae-error-text">{errors.verification_code}</p>
                  )}
                </div>

                <div className="ae-form-group">
                  <label className="ae-form-label">Password</label>
                  <input
                    type="password"
                    className="ae-form-input ae-no-icon"
                    placeholder="Enter password"
                    value={accountData.password}
                    onChange={(e) => {
                      setAccountData({ ...accountData, password: e.target.value });
                      setErrors({});
                    }}
                  />
                  {errors.password && <p className="ae-error-text">{errors.password}</p>}
                </div>

                <div className="ae-form-group">
                  <label className="ae-form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="ae-form-input ae-no-icon"
                    placeholder="Confirm password"
                    value={accountData.confirmPassword}
                    onChange={(e) => {
                      setAccountData({ ...accountData, confirmPassword: e.target.value });
                      setErrors({});
                    }}
                    onKeyPress={(e) => handleKeyPress(e, handleCreateAccount)}
                  />
                  {errors.confirmPassword && (
                    <p className="ae-error-text">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  onClick={handleCreateAccount}
                  disabled={isCreateDisabled}
                  className="ae-auth-btn"
                >
                  {isLoading ? <div className="ae-loader" /> : "Create Account"}
                </button>

                <div className="ae-auth-footer">
                  <p>
                    Already have an account?{" "}
                    <button className="ae-text-link inline" onClick={() => switchView("login")}>
                      Login
                    </button>
                  </p>
                </div>
              </div>
            )}

            {view === "forgot" && (
              <div className="ae-auth-card">
                <h3>Reset your password</h3>
                <p className="ae-auth-subtitle">
                  Reset your password with your registered email and verification code.
                </p>

                <div className="ae-form-group">
                  <label className="ae-form-label">Email</label>
                  <input
                    type="email"
                    className="ae-form-input ae-no-icon"
                    placeholder="Enter your registered email"
                    value={accountData.email}
                    disabled={isCodeSent}
                    onChange={(e) => {
                      setAccountData({ ...accountData, email: e.target.value });
                      setErrors({});
                    }}
                  />
                  {errors.email && <p className="ae-error-text">{errors.email}</p>}
                </div>

                <div className="ae-form-group">
                  <label className="ae-form-label">Verification Code</label>
                  <div className="ae-flex-gap">
                    <input
                      type="text"
                      className="ae-form-input ae-no-icon"
                      placeholder="Enter code"
                      value={accountData.verification_code}
                      onChange={(e) => {
                        setAccountData({ ...accountData, verification_code: e.target.value });
                        setErrors({});
                      }}
                    />
                    <button
                      onClick={handleResetSendCode}
                      disabled={isSendingCode || isCodeSent}
                      className="ae-secondary-btn"
                    >
                      {isSendingCode ? <div className="ae-loader-small" /> : isCodeSent ? "Sent" : "Send Code"}
                    </button>
                  </div>
                  {errors.verification_code && (
                    <p className="ae-error-text">{errors.verification_code}</p>
                  )}
                </div>

                <div className="ae-form-group">
                  <label className="ae-form-label">New Password</label>
                  <input
                    type="password"
                    className="ae-form-input ae-no-icon"
                    placeholder="Enter new password"
                    value={accountData.password}
                    onChange={(e) => {
                      setAccountData({ ...accountData, password: e.target.value });
                      setErrors({});
                    }}
                  />
                  {errors.password && <p className="ae-error-text">{errors.password}</p>}
                </div>

                <div className="ae-form-group">
                  <label className="ae-form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="ae-form-input ae-no-icon"
                    placeholder="Confirm password"
                    value={accountData.confirmPassword}
                    onChange={(e) => {
                      setAccountData({ ...accountData, confirmPassword: e.target.value });
                      setErrors({});
                    }}
                    onKeyPress={(e) => handleKeyPress(e, handleResetPassword)}
                  />
                  {errors.confirmPassword && (
                    <p className="ae-error-text">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={isCreateDisabled}
                  className="ae-auth-btn"
                >
                  {isLoading ? <div className="ae-loader" /> : "Reset Password"}
                </button>

                <div className="ae-auth-footer">
                  <p>
                    Already have an account?{" "}
                    <button className="ae-text-link inline" onClick={() => switchView("login")}>
                      Login
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIExtracterLanding;