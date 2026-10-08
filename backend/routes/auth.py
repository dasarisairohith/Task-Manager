from flask import Blueprint, request, jsonify, g
from services.supabase_service import supabase_service
from auth_utils import require_auth

auth_bp=Blueprint("auth",__name__)

@auth_bp.route("/sync-profile",methods=["POST"])
@require_auth
def sync_profile():
    data=request.get_json() or {}
    user=g.current_user
    email=getattr(user,"email",None) or data.get("email")
    if not email: return jsonify({"error":"Authenticated user has no email"}),400
    metadata=getattr(user,"user_metadata",{}) or {}
    full_name=data.get("full_name") or metadata.get("full_name") or metadata.get("name")
    avatar_url=data.get("avatar_url") or metadata.get("avatar_url") or metadata.get("picture")
    profile=supabase_service.upsert_profile(user.id,email,full_name,avatar_url)
    return jsonify({"success":True,"profile":profile}),200

@auth_bp.route("/profile/<user_id>",methods=["GET"])
@require_auth
def get_profile(user_id):
    if user_id != g.current_user.id: return jsonify({"error":"Forbidden"}),403
    profile=supabase_service.get_user_profile(user_id)
    if not profile: return jsonify({"error":"Profile not found"}),404
    return jsonify({"profile":profile}),200
