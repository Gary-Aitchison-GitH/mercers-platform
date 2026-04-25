from flask import Blueprint, jsonify, request
import anthropic
import os
import logging

log = logging.getLogger("mercers.social")
social_bp = Blueprint("social", __name__)

SOCIAL_SYSTEM = """You are a social media copywriter for Mercers Kensington — a Zimbabwe estate agency.
You write engaging, on-brand property posts for Facebook, Instagram, LinkedIn and X (Twitter).
Brand tone: professional, warm, trustworthy. Brand colors: navy blue and gold.
Always include relevant hashtags. Respect platform character limits.
Return ONLY the post text — no additional commentary."""

PLATFORM_GUIDANCE = {
    "facebook": "Facebook post — up to 400 words. Friendly and informative. Include a call to action.",
    "instagram": "Instagram caption — up to 150 words. Punchy opener, emojis welcome, 5-10 hashtags at end.",
    "linkedin": "LinkedIn post — up to 300 words. Professional tone, business value focus, 3-5 hashtags.",
    "x": "X (Twitter) post — max 280 characters total including hashtags. Punchy and direct.",
}


def _get_client():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")
    return anthropic.Anthropic(api_key=api_key)


def _find_listing(listing_id):
    """Look up a listing from seed data."""
    from seed.data import listings
    return next((l for l in listings if l["id"] == listing_id), None)


@social_bp.route("/social", methods=["POST"])
def generate_social():
    """Generate a social media post for a given listing and platform."""
    data = request.get_json(silent=True) or {}
    listing_id = data.get("listingId", "").strip()
    platform = data.get("platform", "facebook").strip().lower()
    locale = data.get("locale", "en").strip()

    if platform not in PLATFORM_GUIDANCE:
        return jsonify({"error": f"Unknown platform '{platform}'. Use: facebook, instagram, linkedin, x"}), 400

    listing = _find_listing(listing_id) if listing_id else None
    if not listing:
        return jsonify({"error": f"Listing '{listing_id}' not found"}), 404

    locale_instruction = ""
    if locale == "sn":
        locale_instruction = "Write the post primarily in Shona (Zimbabwean), with English hashtags."
    elif locale == "nd":
        locale_instruction = "Write the post primarily in Ndebele (Zimbabwean), with English hashtags."

    user_prompt = (
        f"Write a {platform} post for this Mercers Kensington listing:\n\n"
        f"Title: {listing['title']}\n"
        f"Location: {listing['location']}\n"
        f"Type: {listing['type']} — {listing['listingType']}\n"
        f"Price: {listing['priceDisplay']}\n"
        f"Size: {listing['size']}\n"
        f"Description: {listing['description']}\n\n"
        f"Platform guidance: {PLATFORM_GUIDANCE[platform]}\n"
        f"{locale_instruction}\n\n"
        f"Include a mention of Mercers Kensington and encourage enquiries."
    )

    try:
        client = _get_client()
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            system=SOCIAL_SYSTEM,
            messages=[{"role": "user", "content": user_prompt}],
        )
        content = response.content[0].text.strip()

        log.info("Social post generated for listing %s on %s", listing_id, platform)
        return jsonify({
            "content": content,
            "platform": platform,
            "locale": locale,
            "listingId": listing_id,
            "listingTitle": listing["title"],
        })

    except Exception as e:
        log.exception("Social media API error")
        return jsonify({"error": "Social media service unavailable", "detail": str(e)}), 503
