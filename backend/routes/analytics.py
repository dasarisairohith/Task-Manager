from flask import Blueprint, jsonify, g
from services.supabase_service import supabase_service
from auth_utils import require_auth

analytics_bp=Blueprint("analytics",__name__)

@analytics_bp.route("",methods=["GET"])
@require_auth
def get_analytics():
    return jsonify({"stats":supabase_service.get_task_analytics(g.current_user.id)}),200
