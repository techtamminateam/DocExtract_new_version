"""
chat_routes.py  —  Flask Blueprint for AIExtracter chatbot API.

Register in your app.py:
    from chat_routes import chat_bp, init_chat
    app.register_blueprint(chatbot_bp)
    init_chat(app)          # ← THIS IS THE CRITICAL FIX — call after register_blueprint
"""

import uuid
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify, session
from langchain_core.messages import HumanMessage, AIMessage
import os

logger = logging.getLogger(__name__)

chatbot_bp = Blueprint("chatbot_bp", __name__)


def init_chat(app):
    """
    REQUIRED: Call this after registering the blueprint.
    Passes the Flask app instance to the tools so they can use app_context().

        from chat_routes import chat_bp, init_chat
        app.register_blueprint(chat_bp)
        init_chat(app)
    """
    from chatbot.tools import init_tools
    init_tools(app)
    logger.info("AIExtracter chatbot tools initialized with app context.")


# ── ChatHistory model inline (or import from your models.py) ─────────────────

def _get_chat_model():
    """Returns (db, ChatHistory). Adjust imports to match your project."""
    from models import db, ChatHistory
    return db, ChatHistory


# ── Session helpers ───────────────────────────────────────────────────────────

def _session_id() -> str:
    if "chat_session_id" not in session:
        session["chat_session_id"] = str(uuid.uuid4())
    return session["chat_session_id"]


def _load_history(session_id: str):
    try:
        db, ChatHistory = _get_chat_model()
        rows = (
            ChatHistory.query
            .filter_by(session_id=session_id)
            .order_by(ChatHistory.timestamp.desc())
            .limit(20)
            .all()
        )

        rows.reverse()
        messages = []
        for r in rows:
            if r.role == "user":
                messages.append(HumanMessage(content=r.content))
            else:
                messages.append(AIMessage(content=r.content))
        return messages
    except Exception as e:
        logger.error(f"Error loading history: {e}")
        return []


def _save(session_id: str, role: str, content: str):
    try:
        db, ChatHistory = _get_chat_model()
        db.session.add(ChatHistory(
            session_id=session_id,
            role=role,
            content=content,
            timestamp=datetime.utcnow()
        ))
        db.session.commit()
    except Exception as e:
        logger.error(f"Error saving message: {e}")


# ── Routes ────────────────────────────────────────────────────────────────────

@chatbot_bp.route("/chat/message", methods=["POST"])
def message():
    """POST /api/chat/message  →  { "reply": "...", "session_id": "..." }"""
    data = request.get_json(silent=True) or {}
    user_msg = (data.get("message") or "").strip()

    if not user_msg:
        return jsonify({"error": "Message is required"}), 400

    session_id = _session_id()
    _save(session_id, "user", user_msg)

    history = _load_history(session_id)   # includes the new user message

    try:
        from chatbot.graph import invoke_graph, system
        messages = [system] + history[-7:]

        # Build a plain-text string for token counting (extract .content from message objects)
        text_to_count = "\n".join(getattr(m, "content", "") for m in messages)
        import google.generativeai as genai
        genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.5-flash")
        token_count = model.count_tokens(text_to_count)
        print(f"📨 Tokens for message '{user_msg[:50]}...': {token_count.total_tokens}")

        result = invoke_graph({"messages": messages})

        # Normalize the LLM reply into a single string
        raw = result["messages"][-1].content
        if isinstance(raw, list):
            reply = "\n".join(map(str, raw))
        elif isinstance(raw, dict) and "content" in raw:
            reply = str(raw["content"])
        else:
            reply = str(raw)

        # Count reply tokens safely
        reply_token_count = model.count_tokens(reply)
        logger.info(f"🤖 Reply tokens: {reply_token_count.total_tokens}")
        logger.info(f"Chat reply for session {session_id}: {reply[:80]}...")
    except Exception as e:
        logger.error(f"Graph error: {e}", exc_info=True)
        reply = f"Sorry, I encountered an error: {type(e).__name__}: {e}"

    _save(session_id, "assistant", reply)
    return jsonify({"reply": reply, "session_id": session_id})


@chatbot_bp.route("/chat/history", methods=["GET"])
def history():
    """GET /api/chat/history"""
    session_id = _session_id()
    try:
        db, ChatHistory = _get_chat_model()
        rows = ChatHistory.query.filter_by(session_id=session_id).order_by(ChatHistory.timestamp).all()
        return jsonify([{"role": r.role, "content": r.content} for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route("/chat/clear", methods=["POST"])
def clear():
    """POST /api/chat/clear"""
    session_id = _session_id()
    try:
        db, ChatHistory = _get_chat_model()
        ChatHistory.query.filter_by(session_id=session_id).delete()
        db.session.commit()
        session.clear()

        new_session_id = str(uuid.uuid4())
        session["chat_session_id"] = new_session_id

        return jsonify({
            "status": "cleared",
            "session_id": new_session_id
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@chatbot_bp.route("/chat/status", methods=["GET"])
def status():
    """GET /api/chat/status"""
    session_id = _session_id()
    try:
        db, ChatHistory = _get_chat_model()
        count = ChatHistory.query.filter_by(session_id=session_id).count()
        return jsonify({"session_id": session_id, "message_count": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
