from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("mercers")

app = Flask(__name__)
CORS(
    app,
    origins="*",
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
)


@app.errorhandler(Exception)
def handle_unexpected(e):
    log.exception("Unhandled exception")
    return jsonify({"error": "Internal server error", "detail": str(e)}), 500


from routes.listings import listings_bp
from routes.agents import agents_bp
from routes.chat import chat_bp
from routes.admin import admin_bp
from routes.seo import seo_bp
from routes.social import social_bp

app.register_blueprint(listings_bp, url_prefix="/api")
app.register_blueprint(agents_bp, url_prefix="/api")
app.register_blueprint(chat_bp, url_prefix="/api")
app.register_blueprint(admin_bp, url_prefix="/api")
app.register_blueprint(seo_bp, url_prefix="/api")
app.register_blueprint(social_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
