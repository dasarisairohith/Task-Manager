from flask import Flask, jsonify
from flask_cors import CORS
from config import Config

from routes.auth import auth_bp
from routes.tasks import tasks_bp
from routes.users import users_bp
from routes.comments import comments_bp
from routes.analytics import analytics_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all routes (Allow frontend cross-origin requests)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register API Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(comments_bp, url_prefix="/api/comments")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

    @app.route("/", methods=["GET"])
    def root():
        return jsonify({
            "service": "Task Management System API",
            "version": "1.0.0",
            "status": "healthy",
            "docs": "/api/health"
        }), 200

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "ok",
            "supabase_configured": bool(Config.SUPABASE_URL and Config.SUPABASE_KEY),
            "email_configured": bool(Config.GMAIL_USER and Config.GMAIL_APP_PASSWORD)
        }), 200

    return app

app = create_app()

if __name__ == "__main__":
    print(f"[INFO] Server starting on http://localhost:{Config.PORT}")
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
