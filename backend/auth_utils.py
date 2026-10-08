from functools import wraps
from flask import request, jsonify, g
from services.supabase_service import supabase_service


def require_auth(fn):
    """Require a valid Supabase access token and expose the user on flask.g."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authentication required"}), 401
        token = auth_header.split(" ", 1)[1].strip()
        user = supabase_service.get_authenticated_user(token) if token else None
        if not user:
            return jsonify({"error": "Invalid or expired access token"}), 401
        g.current_user = user
        return fn(*args, **kwargs)
    return wrapper


def current_user_id():
    user = getattr(g, "current_user", None)
    return getattr(user, "id", None) if user else None
