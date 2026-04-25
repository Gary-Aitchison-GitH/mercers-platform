from flask import Blueprint, jsonify, request
import logging
from seed.data import agents as AGENTS

log = logging.getLogger("mercers.agents")
agents_bp = Blueprint("agents", __name__)


@agents_bp.route("/agents", methods=["GET"])
def get_agents():
    """Return all agents, optionally filtered by branch."""
    branch = request.args.get("branch", "").lower()
    result = AGENTS if not branch else [a for a in AGENTS if a["branch"] == branch]
    log.info("GET /api/agents → %d results", len(result))
    return jsonify({"agents": result, "total": len(result)})


@agents_bp.route("/agents/<agent_id>", methods=["GET"])
def get_agent(agent_id):
    """Return a single agent by id."""
    agent = next((a for a in AGENTS if a["id"] == agent_id), None)
    if not agent:
        return jsonify({"error": "Agent not found"}), 404
    return jsonify(agent)
