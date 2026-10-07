from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service
from services.email_service import email_service

tasks_bp = Blueprint("tasks", __name__)

@tasks_bp.route("", methods=["GET"])
def get_tasks():
    """Retrieve tasks with optional filters"""
    status = request.args.get("status")
    priority = request.args.get("priority")
    assigned_to = request.args.get("assigned_to")
    created_by = request.args.get("created_by")
    search = request.args.get("search")

    tasks = supabase_service.get_tasks(
        status=status,
        priority=priority,
        assigned_to=assigned_to,
        created_by=created_by,
        search=search
    )
    return jsonify({"tasks": tasks}), 200

@tasks_bp.route("/<task_id>", methods=["GET"])
def get_task(task_id):
    """Retrieve a single task by ID"""
    task = supabase_service.get_task_by_id(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    return jsonify({"task": task}), 200

@tasks_bp.route("", methods=["POST"])
def create_task():
    """Create a new task and send Gmail notification if assigned to another user"""
    data = request.get_json() or {}
    title = data.get("title")
    description = data.get("description", "")
    created_by = data.get("created_by")
    assigned_to = data.get("assigned_to")
    priority = data.get("priority", "medium")
    due_date = data.get("due_date")

    if not title or not created_by:
        return jsonify({"error": "Title and created_by are required fields"}), 400

    task = supabase_service.create_task(
        title=title,
        description=description,
        created_by=created_by,
        assigned_to=assigned_to,
        priority=priority,
        due_date=due_date
    )

    if not task:
        return jsonify({"error": "Failed to create task in Supabase"}), 500

    # Fetch full details including assignee and creator email info for notification
    full_task = supabase_service.get_task_by_id(task["id"])
    
    # TRIGGER EMAIL NOTIFICATION #1: When a new task is created and assigned to a user
    if full_task and full_task.get("assignee") and full_task["assignee"].get("email"):
        assignee_email = full_task["assignee"]["email"]
        assignee_name = full_task["assignee"].get("full_name", assignee_email)
        creator_name = full_task.get("creator", {}).get("full_name", "A collaborator")

        email_service.send_task_created_notification(
            recipient_email=assignee_email,
            recipient_name=assignee_name,
            task_title=title,
            task_description=description,
            creator_name=creator_name,
            due_date=due_date,
            priority=priority
        )

    return jsonify({"success": True, "task": full_task or task}), 201

@tasks_bp.route("/<task_id>", methods=["PUT"])
def update_task(task_id):
    """Update task details. Sends email notification when task status is set to 'completed'."""
    existing_task = supabase_service.get_task_by_id(task_id)
    if not existing_task:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json() or {}
    updated = supabase_service.update_task(task_id, data)
    
    if not updated:
        return jsonify({"error": "Failed to update task"}), 500

    updated_task = supabase_service.get_task_by_id(task_id)

    # TRIGGER EMAIL NOTIFICATION #2: When task status changes to 'completed'
    new_status = data.get("status")
    old_status = existing_task.get("status")
    
    if new_status == "completed" and old_status != "completed":
        updater_id = data.get("updated_by")
        updater_profile = supabase_service.get_user_profile(updater_id) if updater_id else None
        completed_by_name = updater_profile.get("full_name") if updater_profile else "A team member"

        # Notify creator
        creator = updated_task.get("creator")
        if creator and creator.get("email"):
            email_service.send_task_completed_notification(
                recipient_email=creator["email"],
                recipient_name=creator.get("full_name", creator["email"]),
                task_title=updated_task.get("title", ""),
                completed_by_name=completed_by_name
            )

        # Notify assignee if different from creator
        assignee = updated_task.get("assignee")
        if assignee and assignee.get("email") and assignee.get("id") != (creator.get("id") if creator else None):
            email_service.send_task_completed_notification(
                recipient_email=assignee["email"],
                recipient_name=assignee.get("full_name", assignee["email"]),
                task_title=updated_task.get("title", ""),
                completed_by_name=completed_by_name
            )

    return jsonify({"success": True, "task": updated_task}), 200

@tasks_bp.route("/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    """Delete task by ID"""
    success = supabase_service.delete_task(task_id)
    if not success:
        return jsonify({"error": "Failed to delete task"}), 500
    return jsonify({"success": True, "message": "Task deleted successfully"}), 200
