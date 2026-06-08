import os
import razorpay
import hashlib
import hmac
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from datetime import datetime, timedelta
from flask import Blueprint
load_dotenv()

from models import db, Subscriptions, BillingHistory


billing_bp = Blueprint("billing_bp", __name__)

client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))

PLANS = {
    "basic":{
        "id" : os.getenv("RAZORPAY_BASIC_PLAN_ID", ""),
        "name" : "Basic",
        "amount" : 49900, #in paisa (499)
        "currency" : "INR",
        "interval" : "monthly",
    },
    "pro":{
        "id" : os.getenv("RAZORPAY_PRO_PLAN_ID", ""),
        "name" : "Pro",
        "amount" : 99900, #in paisa (999)
        "currency" : "INR",
        "interval" : "monthly",
    }
}

@billing_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

@billing_bp.route("/create-order", methods=["POST"])
def create_order():
    data = request.get_json()
    plan_key = data.get("plan", "pro")
    plan = PLANS.get(plan_key)

    if not plan:
        return jsonify({"error": "Invalid plan"}), 400
    try:
        order = client.order.create({
            "amount": plan["amount"],
            "currency": plan["currency"],
            "receipt" : f"reciept_{data.get('user_id','user')}_{int(datetime.now().timestamp())}",
            "notes": {
                "user_id" : data.get("user_id", ""),
                "plan" : plan_key,
            }
            })
        return jsonify({
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": os.getenv("RAZORPAY_KEY_ID")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@billing_bp.route("/create-subscription", methods=["POST"])
def create_subscription():
    data = request.get_json()
    plan_key = data.get("plan", "pro")
    plan = PLANS.get(plan_key)

    if not plan:
        return jsonify({"error": "Invalid plan"}), 400
    if not plan["id"]:
        return jsonify({"error": "Invalid plan ID"}), 400

    try:
        subscription = client.subscription.create({
            "plan_id": plan["id"],
            "customer_id": data["customer_id"],
            "total_count": 12, # For a yearly subscription, or adjust as needed
            "notes": {
                "user_id" : data.get("user_id", ""),
                "email" : data.get("email", ""),
            }
        })
        return jsonify({
            "subscription_id": subscription["id"],
            "key_id": os.getenv("RAZORPAY_KEY_ID")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@billing_bp.route("/billing-history", methods=["GET"])
def billing_history():
    user_id = request.args.get("user_id")

    rows = BillingHistory.query.filter_by(user_id=user_id).all()

    history = [
        {
            "invoice": row.invoice,
            "date": row.date.strftime("%Y-%m-%d"),
            "amount": f"₹{row.amount/100:.2f}",
            "status": row.status,
            "tracking": row.tracking,
        }
        for row in rows
    ]

    return jsonify({"history": history})

@billing_bp.route("/verify-payment", methods=["POST"])
def verify_payment():
    try:
        data = request.get_json() or {}
        print("VERIFY PAYMENT HIT")
        print("VERIFY DATA:", data)

        razorpay_order_id = data.get("razorpay_order_id", "")
        razorpay_payment_id = data.get("razorpay_payment_id", "")
        razorpay_signature = data.get("razorpay_signature", "")
        user_id = data.get("user_id", "")
        plan = data.get("plan", "pro")

        secret = os.getenv("RAZORPAY_KEY_SECRET")
        if not secret:
            return jsonify({"error": "RAZORPAY_KEY_SECRET missing"}), 500

        msg = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected = hmac.new(
            secret.encode(),
            msg=msg.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected, razorpay_signature):
            return jsonify({"error": "Invalid signature"}), 400

        plan_info = PLANS.get(plan, {})
        print("PLAN INFO:", plan_info)

        sub = Subscriptions(
            plan=plan,
            user_id=user_id,
            payment_id=razorpay_payment_id,
            order_id=razorpay_order_id,
            status="active",
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=30)
        )
        db.session.add(sub)

        billing = BillingHistory(
            invoice=f"INV-{razorpay_payment_id[:8].upper()}",
            date=datetime.now(),
            amount=plan_info.get("amount", 0),
            user_id=user_id,
            status="Paid",
            tracking=razorpay_payment_id,
        )
        db.session.add(billing)

        db.session.commit()
        return jsonify({"success": True, "message": "Payment verified"}), 200

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@billing_bp.route("/subscription-status", methods=["GET"])
def subscription_status():
    user_id = request.args.get("user_id")

    subscription = Subscriptions.query.filter_by(
        user_id=user_id,
        status="active"
    ).first()

    return jsonify({
        "active": subscription is not None,
        "plan": subscription.plan if subscription else None
    })

# ---------------------------------------------------------------------------
# Cancel subscription
# ---------------------------------------------------------------------------
@billing_bp.route("/cancel-subscription", methods=["POST"])
def cancel_subscription():
    data = request.json
    user_id = data.get("user_id", "unknown")
    sub = Subscriptions.query.filter_by(user_id=user_id, status="active").first()
 
    if not sub:
        return jsonify({"error": "No active subscription found"}), 404
 
    try:
        sub_id = sub.subscription_id
        if sub_id:
            client.subscription.cancel(sub_id, {"cancel_at_cycle_end": 1})

        subscription = Subscriptions.query.filter_by(user_id=user_id).first()
        subscription.status = "canceled"
        db.session.commit()
        return jsonify({"success": True, "message": "Subscription canceled at period end"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
 
 
# ---------------------------------------------------------------------------
# Razorpay webhook — receives events automatically from Razorpay
# ---------------------------------------------------------------------------
@billing_bp.route("/razorpay-webhook", methods=["POST"])
def razorpay_webhook():
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
    signature = request.headers.get("X-Razorpay-Signature", "")
    payload = request.data
 
    # Verify webhook signature
    expected = hmac.new(
        webhook_secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
 
    if not hmac.compare_digest(expected, signature):
        return "Invalid signature", 400
 
    event = request.json
    event_type = event.get("event")
 
    if event_type == "payment.captured":
        payment = event["payload"]["payment"]["entity"]
        user_id = payment.get("notes", {}).get("user_id", "unknown")
        print(f"Payment captured for user {user_id}: {payment['id']}")
 
    elif event_type == "subscription.charged":
        sub = event["payload"]["subscription"]["entity"]
        user_id = sub.get("notes", {}).get("user_id", "unknown")
        print(f"Subscription renewed for user {user_id}")
 
    elif event_type == "subscription.cancelled":
        sub = event["payload"]["subscription"]["entity"]
        user_id = sub.get("notes", {}).get("user_id", "unknown")
        subscription = Subscriptions.query.filter_by(user_id=user_id).first()
        if subscription:
            subscription.status = "canceled"
            db.session.commit()
        print(f"Subscription cancelled for user {user_id}")
 
    elif event_type == "payment.failed":
        payment = event["payload"]["payment"]["entity"]
        print(f"Payment failed: {payment['id']}")
 
    return jsonify({"status": "ok"}), 200