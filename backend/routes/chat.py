from flask import Blueprint, jsonify, request
import anthropic
import os
import logging
import time

log = logging.getLogger("mercers.chat")
chat_bp = Blueprint("chat", __name__)

# In-memory conversation store: { sessionId: { messages: [], garyOnline: bool, locale: str, unreadCount: int } }
_sessions = {}

SYSTEM_PROMPT = """You are the Mercers AI property agent — a friendly, professional assistant for Mercers Kensington, a registered estate agency in Zimbabwe.

You help clients:
- Find properties matching their needs (commercial, industrial, agricultural, residential)
- Understand listing details, prices, and locations
- Learn about Mercers' two offices: Harare (19 Kay Gardens, Kensington) and Marondera (Mashonaland East)
- Connect with the right agent

Our listings include properties in: Harare, Marondera, Victoria Falls, Zvishavane, Bindura, Tynwald, Chiredzi, and beyond.

You can respond in English, Shona (sn), or Ndebele (nd) depending on the client's locale.
If locale is 'sn', respond primarily in Shona. If 'nd', respond primarily in Ndebele. Otherwise use English.

Keep responses concise, warm, and professional. Always encourage clients to contact an agent for viewings.
You represent a trusted, 20+ year estate agency and a member of the Estate Agents Council of Zimbabwe (EACZ).
"""

def _get_client():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")
    return anthropic.Anthropic(api_key=api_key)


def _build_messages(session):
    """Convert stored messages to Anthropic API format."""
    result = []
    for msg in session["messages"]:
        role = "user" if msg["role"] == "user" else "assistant"
        result.append({"role": role, "content": msg["content"]})
    return result


@chat_bp.route("/chat", methods=["POST"])
def send_message():
    """Accept a user message and return an AI (or Gary) response."""
    data = request.get_json(silent=True) or {}
    session_id = data.get("sessionId", "").strip()
    content = data.get("content", "").strip()
    locale = data.get("locale", "en").strip()

    if not session_id or not content:
        return jsonify({"error": "sessionId and content are required"}), 400

    # Initialise session if new
    if session_id not in _sessions:
        _sessions[session_id] = {
            "messages": [],
            "garyOnline": False,
            "locale": locale,
            "unreadCount": 0,
        }
    session = _sessions[session_id]
    session["locale"] = locale

    # Store user message
    session["messages"].append({"role": "user", "content": content, "isGary": False})
    session["unreadCount"] = session.get("unreadCount", 0) + 1

    gary_online = session.get("garyOnline", False)

    # If Gary is online, don't auto-reply — just acknowledge
    if gary_online:
        log.info("Session %s: Gary is live, not auto-replying", session_id[:8])
        return jsonify({
            "message": None,
            "garyOnline": True,
            "sessionId": session_id,
        })

    # Otherwise call Claude
    try:
        client = _get_client()
        messages = _build_messages({"messages": [
            m for m in session["messages"] if m["role"] in ("user", "assistant")
        ]})

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=messages,
        )
        reply_text = response.content[0].text

        session["messages"].append({"role": "assistant", "content": reply_text, "isGary": False})

        log.info("Session %s: AI replied (%d chars)", session_id[:8], len(reply_text))
        return jsonify({
            "message": reply_text,
            "garyOnline": False,
            "isGary": False,
            "sessionId": session_id,
        })

    except Exception as e:
        log.exception("Claude API error for session %s", session_id[:8])
        return jsonify({"error": "AI service unavailable", "detail": str(e)}), 503


@chat_bp.route("/chat/session", methods=["GET"])
def get_session():
    """Poll endpoint — returns conversation history and Gary online status."""
    session_id = request.args.get("sessionId", "").strip()
    if not session_id:
        return jsonify({"error": "sessionId is required"}), 400

    session = _sessions.get(session_id)
    if not session:
        return jsonify({"messages": [], "garyOnline": False, "sessionId": session_id})

    return jsonify({
        "messages": session["messages"],
        "garyOnline": session.get("garyOnline", False),
        "locale": session.get("locale", "en"),
        "sessionId": session_id,
    })
