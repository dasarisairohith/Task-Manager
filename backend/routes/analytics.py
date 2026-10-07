from flask import Blueprint, jsonify
from services.supabase_service import supabase_service

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("", methods=["GET"])
def get_analytics():
    """Retrieve task analytics and metric counts"""
    stats = supabase_service.get_task_analytics()
    return jsonify({"stats": stats}), 200
