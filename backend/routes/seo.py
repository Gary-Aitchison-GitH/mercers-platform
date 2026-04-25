from flask import Blueprint, jsonify, request
import anthropic
import os
import logging

log = logging.getLogger("mercers.seo")
seo_bp = Blueprint("seo", __name__)

SEO_SYSTEM = """You are an expert SEO consultant for Mercers Kensington — a Zimbabwe estate agency.
You provide actionable, specific SEO recommendations tailored to the Zimbabwe property market.
Always return your response as valid JSON with the structure:
{
  "title": "Suggested page title (60 chars max)",
  "metaDescription": "Suggested meta description (155 chars max)",
  "keywords": ["array", "of", "10", "target", "keywords"],
  "h1Suggestions": ["Two or three H1 options"],
  "contentRecommendations": ["Three bullet points of content advice"],
  "localSeo": "One paragraph of local SEO advice for Zimbabwe",
  "score": 75
}
"""


def _get_client():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")
    return anthropic.Anthropic(api_key=api_key)


@seo_bp.route("/seo", methods=["POST"])
def get_seo():
    """Generate SEO recommendations for a given page."""
    data = request.get_json(silent=True) or {}
    page = data.get("page", "home").strip()
    locale = data.get("locale", "en").strip()

    user_prompt = (
        f"Analyse the SEO for the '{page}' page of the Mercers Kensington website "
        f"(locale: {locale}). The site targets property buyers, renters and investors in Zimbabwe "
        f"— commercial, industrial, agricultural and residential properties across Harare and Marondera. "
        f"Provide specific, actionable recommendations."
    )

    try:
        client = _get_client()
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=SEO_SYSTEM,
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw = response.content[0].text

        # Try to parse as JSON; return raw text as fallback
        import json
        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            # Extract JSON from markdown code fences if present
            import re
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
            result = json.loads(match.group(1)) if match else {"raw": raw}

        log.info("SEO recommendations generated for page: %s", page)
        return jsonify({"page": page, "locale": locale, "recommendations": result})

    except Exception as e:
        log.exception("SEO API error")
        return jsonify({"error": "SEO service unavailable", "detail": str(e)}), 503
