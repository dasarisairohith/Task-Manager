from flask import Blueprint, jsonify
from services.supabase_service import supabase_service

users_bp = Blueprint("users", __name__)

@users_bp.route("", methods=["GET"])
def list_users():
    """Fetch all users to populate task assignee dropdowns"""
    users = supabase_service.get_all_users()
    return jsonify({"users": users}), 200
