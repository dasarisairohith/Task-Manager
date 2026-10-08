from flask import Blueprint, jsonify
from services.supabase_service import supabase_service
from auth_utils import require_auth

users_bp=Blueprint("users",__name__)

@users_bp.route("",methods=["GET"])
@require_auth
def list_users():
    return jsonify({"users":supabase_service.get_all_users()}),200
