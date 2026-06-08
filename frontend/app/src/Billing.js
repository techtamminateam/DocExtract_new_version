import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./DocExtract.css";
import { API_URL } from "./apiService";


const API = API_URL;

// Load Razorpay script dynamically
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
}

function maskCard(number) {
  if (!number) return "";
  const digits = number.replace(/\D/g, "");
  const masked = digits.slice(0, -4).replace(/\d/g, "•") + digits.slice(-4);
  return masked.replace(/(.{4})/g, "$1 ").trim();
}

function getCardValue(number, focused, show) {
  if (!number) return "";
  if (focused || show) {
    return number.replace(/(.{4})/g, "$1 ").trim();
  }
  return maskCard(number);
}

function getCvvValue(cvv, focused, show) {
  if (!cvv) return "";
  if (focused || show) return cvv;
  return "•".repeat(cvv.length);
}

const billingRowsDefault = [
  { invoice: "—", date: "—", amount: "—", status: "Pending", tracking: "—" },
];

export default function BillingSettings({ user = { id: "user_001", email: "alex.johnson@company.com" } }) {
  // Card state
  const [primaryCard, setPrimaryCard] = useState({ name: "", expiry: "", number: "", cvv: "" });
  const [extraCard, setExtraCard]     = useState({ name: "", expiry: "", number: "", cvv: "" });
  const [showExtraCard, setShowExtraCard] = useState(false);

  const [primaryCvvFocused, setPrimaryCvvFocused] = useState(false);
  const [extraCvvFocused, setExtraCvvFocused] = useState(false);
  const [primaryCardFocused, setPrimaryCardFocused] = useState(false);
  const [extraCardFocused,   setExtraCardFocused]   = useState(false);
  const [showPrimaryNumber,  setShowPrimaryNumber]  = useState(false);
  const [showExtraNumber,    setShowExtraNumber]    = useState(false);
  const [showPrimaryCvv,     setShowPrimaryCvv]     = useState(false);
  const [showExtraCvv,       setShowExtraCvv]       = useState(false);

  // Billing email state
  const [contactMode,     setContactMode]     = useState("existing");
  const [additionalEmail, setAdditionalEmail] = useState("");

  // Subscription state
  const [isSubscribed,  setIsSubscribed]  = useState(false);
  const [activePlan,    setActivePlan]    = useState(null);
  const [billingRows,   setBillingRows]   = useState(billingRowsDefault);
  const [loading,       setLoading]       = useState(false);
  const [statusMsg,     setStatusMsg]     = useState(null); // { type: "success"|"error", text }
  const user_id = localStorage.getItem("id")
  // -------------------------------------------------------------------
  // On mount: check subscription status + billing history
  // -------------------------------------------------------------------
  const fetchStatus = useCallback(async () => {
    try {
      const [subRes, histRes] = await Promise.all([
        fetch(`${API}/subscription-status?user_id=${user_id}`),
        fetch(`${API}/billing-history?user_id=${user_id}`),
      ]);
      const subData  = await subRes.json();
      const histData = await histRes.json();

      setIsSubscribed(subData.active);
      setActivePlan(subData.plan || null);
      if (histData.history?.length) setBillingRows(histData.history);
    } catch {
      // backend not reachable yet — silent fail
    }
  }, [user_id]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------
  const updatePrimaryCard = (field, val) => setPrimaryCard((p) => ({ ...p, [field]: val }));
  const updateExtraCard   = (field, val) => setExtraCard((p)   => ({ ...p, [field]: val }));

  const showMessage = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // -------------------------------------------------------------------
  // Subscribe — opens Razorpay checkout
  // -------------------------------------------------------------------
  const handleSubscribe = async (planKey = "pro") => {
    setLoading(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      showMessage("error", "Failed to load payment gateway. Check your connection.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create order on backend
      const res = await fetch(`${API}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user_id, plan: planKey }),
      });
      const { order_id, amount, currency, key_id, error } = await res.json();
      if (error) throw new Error(error);

      // 2. Open Razorpay checkout
      const options = {
        key: key_id,
        amount,
        currency,
        name: "Your App Name",
        description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan Subscription`,
        order_id,
        prefill: {
          email: user.email,
          // If user has filled card name, prefill it
          name: primaryCard.name || "",
        },
        theme: { color: "#6366f1" },
        handler: async (response) => {
          // 3. Verify on backend
          try {
            const verifyRes = await fetch(`${API}/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                user_id: user_id,
                plan: planKey,
              }),
            });
            const result = await verifyRes.json();
            if (result.success) {
              showMessage("success", "Payment successful! Your subscription is now active.");
              await fetchStatus();
            } else {
              showMessage("error", "Payment verification failed. Contact support.");
            }
          } catch {
            showMessage("error", "Could not verify payment. Contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            showMessage("error", "Payment cancelled.");
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showMessage("error", err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // Cancel subscription
  // -------------------------------------------------------------------
  const handleCancel = async () => {
    if (!window.confirm("Cancel your subscription? It will remain active until the end of this billing cycle.")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/cancel-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user_id }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Subscription cancelled. Access continues until end of billing period.");
        await fetchStatus();
      } else {
        showMessage("error", data.error || "Could not cancel subscription.");
      }
    } catch {
      showMessage("error", "Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div className="settings-billing-detail-card">

      {/* Status message banner */}
      {statusMsg && (
        <div className={`settings-status-banner settings-status-banner--${statusMsg.type}`}>
          {statusMsg.text}
        </div>
      )}

      {/* Subscription status strip */}
      <div className="settings-billing-block">
        <h2>Subscription</h2>
        {isSubscribed ? (
          <div className="settings-subscription-active">
            <span className="settings-status-badge paid">
              Active — {activePlan?.charAt(0).toUpperCase() + activePlan?.slice(1)} Plan
            </span>
            <button
              className="settings-card-action settings-card-action--danger"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel subscription
            </button>
          </div>
        ) : (
          <div className="settings-subscription-inactive">
            <p>You don't have an active subscription.</p>
            <div className="settings-plan-buttons">
              <button
                className="settings-card-action"
                onClick={() => handleSubscribe("basic")}
                disabled={loading}
              >
                {loading ? "Processing..." : "Subscribe Basic — ₹499/mo"}
              </button>
              <button
                className="settings-card-action settings-card-action--primary"
                onClick={() => handleSubscribe("pro")}
                disabled={loading}
              >
                {loading ? "Processing..." : "Subscribe Pro — ₹999/mo"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="settings-billing-block">
        <h2>Payment Method</h2>
        <p>
          Card details below are for display/reference only. Actual payment is
          handled securely by Razorpay — your card data never touches our servers.
        </p>
      </div>

      <div className="settings-billing-grid">
        <div className="settings-billing-block">
          <h3>Card Details</h3>
          <p>Update your billing details and address.</p>
          <button
            className="settings-card-action"
            onClick={() => setShowExtraCard((prev) => !prev)}
          >
            {showExtraCard ? "Hide additional card" : "+ Add another card"}
          </button>
        </div>

        <div className="settings-card-form">
          <label>
            Name on your Card
            <input
              value={primaryCard.name}
              onChange={(e) => updatePrimaryCard("name", e.target.value)}
            />
          </label>
          <label>
            Expiry
            <input
              value={primaryCard.expiry}
              placeholder="MM/YYYY"
              onChange={(e) => updatePrimaryCard("expiry", formatExpiry(e.target.value))}
            />
          </label>
          <label>
            Card Number
            <div className="settings-input-wrapper">
              <input
                value={getCardValue(primaryCard.number, primaryCardFocused, showPrimaryNumber)}
                placeholder="•••• •••• •••• ••••"
                onChange={(e) => updatePrimaryCard("number", e.target.value.replace(/\D/g, "").slice(0, 16))}
                onFocus={() => setPrimaryCardFocused(true)}
                onBlur={() => setPrimaryCardFocused(false)}
              />
              <button
                type="button"
                className="settings-input-toggle-btn"
                onClick={() => setShowPrimaryNumber(!showPrimaryNumber)}
                title={showPrimaryNumber ? "Hide card number" : "Show card number"}
              >
                {showPrimaryNumber ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          <label>
            CVV
            <div className="settings-input-wrapper">
              <input
                value={getCvvValue(primaryCard.cvv, primaryCvvFocused, showPrimaryCvv)}
                placeholder="•••"
                onChange={(e) => updatePrimaryCard("cvv", e.target.value.replace(/\D/g, "").slice(0, 3))}
                onFocus={() => setPrimaryCardFocused(true)}
                onBlur={() => setPrimaryCardFocused(false)}
              />
              <button
                type="button"
                className="settings-input-toggle-btn"
                onClick={() => setShowPrimaryCvv(!showPrimaryCvv)}
                title={showPrimaryCvv ? "Hide CVV" : "Show CVV"}
              >
                {showPrimaryCvv ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
        </div>
      </div>

      {showExtraCard && (
        <div className="settings-extra-card">
          <div className="settings-billing-block">
            <h3>Additional Card</h3>
            <p>Add backup billing card details.</p>
          </div>
          <div className="settings-card-form">
            <label>
              Name on your Card
              <input
                placeholder="Enter cardholder name"
                value={extraCard.name}
                onChange={(e) => updateExtraCard("name", e.target.value)}
              />
            </label>
            <label>
              Expiry
              <input
                placeholder="MM/YYYY"
                value={extraCard.expiry}
                onChange={(e) => updateExtraCard("expiry", formatExpiry(e.target.value))}
              />
            </label>
            <label>
              Card Number
              <div className="settings-input-wrapper">
                <input
                  placeholder="•••• •••• •••• ••••"
                  value={getCardValue(extraCard.number, extraCardFocused, showExtraNumber)}
                  onChange={(e) => updateExtraCard("number", e.target.value.replace(/\D/g, "").slice(0, 16))}
                  onFocus={() => setExtraCardFocused(true)}
                  onBlur={() => setExtraCardFocused(false)}
                />
                <button
                  type="button"
                  className="settings-input-toggle-btn"
                  onClick={() => setShowExtraNumber(!showExtraNumber)}
                >
                  {showExtraNumber ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <label>
              CVV
              <div className="settings-input-wrapper">
                <input
                  placeholder="•••"
                  value={getCvvValue(extraCard.cvv, extraCvvFocused, showExtraCvv)}
                  onChange={(e) => updateExtraCard("cvv", e.target.value.replace(/\D/g, "").slice(0, 3))}
                  onFocus={() => setExtraCardFocused(true)}
                  onBlur={() => setExtraCardFocused(false)}
                />
                <button
                  type="button"
                  className="settings-input-toggle-btn"
                  onClick={() => setShowExtraCvv(!showExtraCvv)}
                >
                  {showExtraCvv ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Contact email */}
      <div className="settings-contact-block">
        <h3>Contact email</h3>
        <p>Where should invoices be sent?</p>
        <label className="settings-radio-row">
          <input
            type="radio"
            name="contactEmailMode"
            checked={contactMode === "existing"}
            onChange={() => setContactMode("existing")}
          />
          <span>Send to the existing email</span>
          <small>{user.email}</small>
        </label>
        <label className="settings-radio-row">
          <input
            type="radio"
            name="contactEmailMode"
            checked={contactMode === "additional"}
            onChange={() => setContactMode("additional")}
          />
          <span>Add another email address</span>
        </label>
        {contactMode === "additional" && (
          <div className="settings-extra-email">
            <label>
              New billing email
              <input
                type="email"
                placeholder="name@company.com"
                value={additionalEmail}
                onChange={(e) => setAdditionalEmail(e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className="settings-billing-card">
        <div className="settings-billing-head">
          <h2>Billing History</h2>
          <p>See your recent subscription and add-on invoices.</p>
        </div>
        <div className="settings-billing-table-wrap">
          <table className="settings-billing-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Tracking</th>
              </tr>
            </thead>
            <tbody>
              {billingRows.map((row, i) => (
                <tr key={row.tracking + i}>
                  <td>{row.invoice}</td>
                  <td>{row.date}</td>
                  <td>{row.amount}</td>
                  <td>
                    <span className={`settings-status-badge ${row.status.toLowerCase()}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                      {row.tracking}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}