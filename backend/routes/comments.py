from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service

comments_bp = Blueprint("comments", __name__)

@comments_bp.route("/<task_id>", methods=["GET"])
def get_comments(task_id):
    """Get comments for task"""
    comments = supabase_service.get_comments(task_id)
    return jsonify({"comments": comments}), 200

@comments_bp.route("/<task_id>", methods=["POST"])
def add_comment(task_id):
    """Add a comment to task"""
    data = request.get_json() or {}
    user_id = data.get("user_id")
    content = data.get("content")

    if not user_id or not content:
        return jsonify({"error": "user_id and content are required"}), 400

    comment = supabase_service.add_comment(task_id, user_id, content)
    if not comment:
        return jsonify({"error": "Failed to post comment"}), 500

    return jsonify({"success": True, "comment": comment}), 201
