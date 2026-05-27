import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  X,
  Trash2,
  Send,
  FileText,
  LayoutTemplate,
  HelpCircle,
  Zap,
} from "lucide-react";
import "./chatBot.css";

const QUICK_PROMPTS = [
  { label: "Invoice", icon: <FileText size={12} />, msg: "How does Invoice Checking work?" },
  { label: "Templates", icon: <LayoutTemplate size={12} />, msg: "Show my custom templates" },
  { label: "Workflow", icon: <HelpCircle size={12} />, msg: "How do I extract data from a PDF?" },
];

const BACKEND_URL = "http://localhost:5000/api/chat";

function renderMarkdown(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="aex-inline-code">$1</code>')
    .replace(/^• (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="aex-list">$1</ul>')
    .replace(/\n/g, "<br/>");
}

export default function AIExtractorChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open && !historyLoaded) {
      fetch(`${BACKEND_URL}/history`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMessages(
              data.map((m) => ({
                role: m.role === "user" ? "user" : "bot",
                text: m.content,
              }))
            );
          }
        })
        .catch(() => {})
        .finally(() => setHistoryLoaded(true));
    }
  }, [open, historyLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (overrideText) => {
      const text = (overrideText ?? input).trim();
      if (!text || busy) return;

      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setBusy(true);
      setMessages((prev) => [...prev, { role: "user", text }]);

      try {
        const res = await fetch(`${BACKEND_URL}/message`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: data.reply || data.error || "Sorry, something went wrong." },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "Could not reach the server. Please try again." },
        ]);
      } finally {
        setBusy(false);
        textareaRef.current?.focus();
      }
    },
    [input, busy]
  );

  const clearChat = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/clear`, { method: "POST" });

    if (!res.ok) {
      console.error("Failed to clear backend chat");
      return; // do NOT clear UI if backend failed
    }

    setMessages([]);
    setHistoryLoaded(false);
  } catch (err) {
    console.error("Clear chat error:", err);
  }
};

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
  };

  return (
    <>
      {/* FAB */}
      <button
        className="aex-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {open ? (
          <X size={20} color="#fff" strokeWidth={2.5} />
        ) : (
          <>
            <Bot size={24} color="#fff" strokeWidth={1.75} />
            <span className="aex-notification-dot" />
          </>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="aex-panel" role="dialog" aria-label="AI Extraction Assistant">
          {/* Header */}
          <div className="aex-header">
            <div className="aex-header-icon">
              <Zap size={16} color="#fff" strokeWidth={2} />
            </div>

            <div className="aex-header-text">
              <p className="aex-header-title">AI Extraction Assistant</p>
              <p className="aex-header-subtitle">
                <span className="aex-header-status" />
                Online
              </p>
            </div>

            <div className="aex-header-actions">
              <button
                className="aex-header-btn"
                onClick={clearChat}
                title="Clear conversation"
              >
                <Trash2 size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                Clear
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="aex-quickbar">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q.msg}
                className="aex-qbtn"
                onClick={() => sendMessage(q.msg)}
                disabled={busy}
              >
                <span className="aex-qbtn-icon">{q.icon}</span>
                {q.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="aex-messages">
            {messages.length === 0 && !busy && (
              <div className="aex-welcome">
                <div className="aex-welcome-icon">
                  <FileText size={26} color="#0f62fe" strokeWidth={1.5} />
                </div>
                <p className="aex-welcome-title">Hello! I'm your extraction assistant.</p>
                <p className="aex-welcome-sub">
                  Ask me about templates, extraction history, analytics, or how to get the
                  best results from your PDFs.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`aex-msg ${m.role === "user" ? "aex-user-row" : "aex-bot-row"}`}
              >
                <div
                  className={`aex-avatar ${
                    m.role === "user" ? "aex-user-avatar" : "aex-bot-avatar"
                  }`}
                >
                  {m.role === "user" ? (
                    "U"
                  ) : (
                    <Bot size={13} strokeWidth={2} />
                  )}
                </div>

                <div
                  className={`aex-bubble ${
                    m.role === "user" ? "aex-user-bubble" : "aex-bot-bubble"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html:
                      m.role === "bot"
                        ? renderMarkdown(m.text)
                        : m.text.replace(/</g, "&lt;"),
                  }}
                />
              </div>
            ))}

            {/* Typing indicator */}
            {busy && (
              <div className="aex-msg aex-bot-row">
                <div className="aex-avatar aex-bot-avatar">
                  <Bot size={13} strokeWidth={2} />
                </div>
                <div className="aex-bubble aex-bot-bubble aex-typing">
                  <span className="aex-dot" />
                  <span className="aex-dot" />
                  <span className="aex-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="aex-input-area">
            <div className="aex-input-row">
              <textarea
                ref={textareaRef}
                className="aex-textarea"
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize(e);
                }}
                onKeyDown={handleKey}
                placeholder="Ask about extractions, templates, or workflows…"
                disabled={busy}
              />

              <button
                className="aex-send"
                onClick={() => sendMessage()}
                disabled={busy || !input.trim()}
                aria-label="Send message"
              >
                <Send size={13} strokeWidth={2.5} />
              </button>
            </div>

            <p className="aex-footer-text">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}
