from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/sync-profile", methods=["POST"])
def sync_profile():
    """Sync Google OAuth user details into profiles table"""
    data = request.get_json() or {}
    user_id = data.get("id")
    email = data.get("email")
    full_name = data.get("full_name")
    avatar_url = data.get("avatar_url")

    if not user_id or not email:
        return jsonify({"error": "Missing required fields: id, email"}), 400

    profile = supabase_service.upsert_profile(user_id, email, full_name, avatar_url)
    return jsonify({"success": True, "profile": profile}), 200

@auth_bp.route("/profile/<user_id>", methods=["GET"])
def get_profile(user_id):
    """Fetch profile by ID"""
    profile = supabase_service.get_user_profile(user_id)
    if not profile:
        return jsonify({"error": "Profile not found"}), 404
    return jsonify({"profile": profile}), 200
