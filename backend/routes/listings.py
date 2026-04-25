from flask import Blueprint, jsonify, request
import logging
from seed.data import listings as LISTINGS

log = logging.getLogger("mercers.listings")
listings_bp = Blueprint("listings", __name__)


@listings_bp.route("/listings", methods=["GET"])
def get_listings():
    """Return all listings, optionally filtered by query params."""
    type_filter = request.args.get("type", "all").lower()
    listing_type_filter = request.args.get("listingType", "all").lower()
    search = request.args.get("q", "").lower()
    branch = request.args.get("branch", "").lower()

    result = LISTINGS

    if type_filter != "all":
        result = [l for l in result if l["type"] == type_filter]

    if listing_type_filter != "all":
        result = [l for l in result if l["listingType"] == listing_type_filter]

    if branch:
        result = [l for l in result if l["branch"] == branch]

    if search:
        result = [
            l for l in result
            if search in l["title"].lower()
            or search in l["location"].lower()
            or search in l["area"].lower()
            or search in l["priceDisplay"].lower()
            or search in l["type"].lower()
        ]

    log.info("GET /api/listings → %d results", len(result))
    return jsonify({"listings": result, "total": len(result)})


@listings_bp.route("/listings/<listing_id>", methods=["GET"])
def get_listing(listing_id):
    """Return a single listing by id."""
    listing = next((l for l in LISTINGS if l["id"] == listing_id), None)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    return jsonify(listing)


@listings_bp.route("/listings", methods=["POST"])
def create_listing():
    """Placeholder for future listing creation."""
    data = request.get_json(silent=True) or {}
    # TODO: validate and persist to a real database
    log.info("POST /api/listings (stub) — data: %s", data)
    return jsonify({"message": "Listing creation is not yet implemented.", "received": data}), 201
