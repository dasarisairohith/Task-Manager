from flask import Blueprint, request, jsonify, g
from services.supabase_service import supabase_service
from auth_utils import require_auth

comments_bp=Blueprint("comments",__name__)

def _can_access_task(task,user_id):
    return bool(task and (task.get("created_by")==user_id or task.get("assigned_to")==user_id))

@comments_bp.route("/<task_id>",methods=["GET"])
@require_auth
def get_comments(task_id):
    task=supabase_service.get_task_by_id(task_id)
    if not _can_access_task(task,g.current_user.id): return jsonify({"error":"Forbidden"}),403
    return jsonify({"comments":supabase_service.get_comments(task_id)}),200

@comments_bp.route("/<task_id>",methods=["POST"])
@require_auth
def add_comment(task_id):
    task=supabase_service.get_task_by_id(task_id)
    if not _can_access_task(task,g.current_user.id): return jsonify({"error":"Forbidden"}),403
    data=request.get_json() or {}
    content=(data.get("content") or "").strip()
    if not content: return jsonify({"error":"content is required"}),400
    if len(content)>5000: return jsonify({"error":"Comment is too long"}),400
    comment=supabase_service.add_comment(task_id,g.current_user.id,content)
    if not comment: return jsonify({"error":"Failed to post comment"}),500
    return jsonify({"success":True,"comment":comment}),201
