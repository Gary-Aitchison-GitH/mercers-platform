from flask import Blueprint, jsonify, request
import logging

log = logging.getLogger("mercers.admin")
admin_bp = Blueprint("admin", __name__)

# Shared in-memory store — imported lazily to avoid circular import at module load
def _sessions():
    from routes import chat as _chat_module
    return _chat_module._sessions


@admin_bp.route("/admin/conversations", methods=["GET"])
def get_conversations():
    """Return all active conversations (for Gary's dashboard)."""
    sessions = _sessions()
    result = []
    for session_id, data in sessions.items():
        result.append({
            "sessionId": session_id,
            "messages": data.get("messages", []),
            "garyOnline": data.get("garyOnline", False),
            "locale": data.get("locale", "en"),
            "unreadCount": data.get("unreadCount", 0),
        })
    # Most recent activity first (approximate: more messages = more active)
    result.sort(key=lambda c: len(c["messages"]), reverse=True)
    log.info("GET /api/admin/conversations → %d sessions", len(result))
    return jsonify({"conversations": result, "total": len(result)})


@admin_bp.route("/admin/join", methods=["POST"])
def join_conversation():
    """Gary joins a session — future messages are handled by Gary, not AI."""
    data = request.get_json(silent=True) or {}
    session_id = data.get("sessionId", "").strip()
    if not session_id:
        return jsonify({"error": "sessionId is required"}), 400

    sessions = _sessions()
    if session_id not in sessions:
        return jsonify({"error": "Session not found"}), 404

    sessions[session_id]["garyOnline"] = True
    sessions[session_id]["unreadCount"] = 0
    log.info("Gary joined session %s", session_id[:8])
    return jsonify({"ok": True, "sessionId": session_id, "garyOnline": True})


@admin_bp.route("/admin/leave", methods=["POST"])
def leave_conversation():
    """Gary leaves a session — AI resumes responding."""
    data = request.get_json(silent=True) or {}
    session_id = data.get("sessionId", "").strip()
    if not session_id:
        return jsonify({"error": "sessionId is required"}), 400

    sessions = _sessions()
    if session_id not in sessions:
        return jsonify({"error": "Session not found"}), 404

    sessions[session_id]["garyOnline"] = False
    log.info("Gary left session %s", session_id[:8])
    return jsonify({"ok": True, "sessionId": session_id, "garyOnline": False})


@admin_bp.route("/admin/reply", methods=["POST"])
def admin_reply():
    """Gary sends a reply into a session. Stored as a Gary-flagged assistant message."""
    data = request.get_json(silent=True) or {}
    session_id = data.get("sessionId", "").strip()
    content = data.get("content", "").strip()

    if not session_id or not content:
        return jsonify({"error": "sessionId and content are required"}), 400

    sessions = _sessions()
    if session_id not in sessions:
        return jsonify({"error": "Session not found"}), 404

    sessions[session_id]["messages"].append({
        "role": "assistant",
        "content": content,
        "isGary": True,
    })
    log.info("Gary replied in session %s (%d chars)", session_id[:8], len(content))
    return jsonify({"ok": True, "sessionId": session_id, "message": content})
