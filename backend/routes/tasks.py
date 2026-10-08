from datetime import datetime
from flask import Blueprint, request, jsonify, g
from services.supabase_service import supabase_service
from services.email_service import email_service
from auth_utils import require_auth

tasks_bp=Blueprint("tasks",__name__)
VALID_STATUS={"todo","in_progress","completed"}
VALID_PRIORITY={"low","medium","high"}

def _can_access(task,user_id):
    return bool(task and (task.get("created_by")==user_id or task.get("assigned_to")==user_id))

@tasks_bp.route("",methods=["GET"])
@require_auth
def get_tasks():
    status=request.args.get("status")
    priority=request.args.get("priority")
    assigned_to=request.args.get("assigned_to")
    created_by=request.args.get("created_by")
    search=request.args.get("search")
    if status and status not in VALID_STATUS: return jsonify({"error":"Invalid status"}),400
    if priority and priority not in VALID_PRIORITY: return jsonify({"error":"Invalid priority"}),400
    # Do not allow query parameters to broaden visibility beyond the authenticated user.
    if assigned_to and assigned_to != g.current_user.id: assigned_to=None
    if created_by and created_by != g.current_user.id: created_by=None
    tasks=supabase_service.get_tasks(status,priority,assigned_to,created_by,search,g.current_user.id)
    return jsonify({"tasks":tasks}),200

@tasks_bp.route("/<task_id>",methods=["GET"])
@require_auth
def get_task(task_id):
    task=supabase_service.get_task_by_id(task_id)
    if not _can_access(task,g.current_user.id): return jsonify({"error":"Task not found"}),404
    return jsonify({"task":task}),200

@tasks_bp.route("",methods=["POST"])
@require_auth
def create_task():
    data=request.get_json() or {}
    title=(data.get("title") or "").strip()
    description=(data.get("description") or "").strip()
    assigned_to=data.get("assigned_to") or None
    priority=data.get("priority","medium")
    due_date=data.get("due_date") or None
    if not title: return jsonify({"error":"Title is required"}),400
    if len(title)>200: return jsonify({"error":"Title must be 200 characters or less"}),400
    if len(description)>10000: return jsonify({"error":"Description is too long"}),400
    if priority not in VALID_PRIORITY: return jsonify({"error":"Invalid priority"}),400
    if due_date:
        try: datetime.fromisoformat(due_date.replace("Z","+00:00"))
        except ValueError: return jsonify({"error":"Invalid due_date"}),400
    task=supabase_service.create_task(title,description,g.current_user.id,assigned_to,priority,due_date)
    if not task: return jsonify({"error":"Failed to create task in Supabase"}),500
    full_task=supabase_service.get_task_by_id(task["id"])
    if full_task and full_task.get("assignee",{}).get("email"):
        assignee=full_task["assignee"]
        email_service.send_task_created_notification(assignee["email"],assignee.get("full_name",assignee["email"]),title,description,full_task.get("creator",{}).get("full_name","A collaborator"),due_date,priority)
    return jsonify({"success":True,"task":full_task or task}),201

@tasks_bp.route("/<task_id>",methods=["PUT"])
@require_auth
def update_task(task_id):
    existing=supabase_service.get_task_by_id(task_id)
    if not _can_access(existing,g.current_user.id): return jsonify({"error":"Task not found"}),404
    data=request.get_json() or {}
    if "status" in data and data["status"] not in VALID_STATUS: return jsonify({"error":"Invalid status"}),400
    if "priority" in data and data["priority"] not in VALID_PRIORITY: return jsonify({"error":"Invalid priority"}),400
    if "title" in data and (not isinstance(data["title"],str) or not data["title"].strip() or len(data["title"].strip())>200): return jsonify({"error":"Invalid title"}),400
    if "description" in data and isinstance(data["description"],str) and len(data["description"])>10000: return jsonify({"error":"Description is too long"}),400
    if "due_date" in data and data["due_date"]:
        try: datetime.fromisoformat(data["due_date"].replace("Z","+00:00"))
        except ValueError: return jsonify({"error":"Invalid due_date"}),400
    updated=supabase_service.update_task(task_id,data)
    if not updated: return jsonify({"error":"No valid task fields supplied"}),400
    updated_task=supabase_service.get_task_by_id(task_id)
    if data.get("status")=="completed" and existing.get("status")!="completed":
        completed_by_name=getattr(g.current_user,"user_metadata",{}).get("full_name") or getattr(g.current_user,"email","A team member")
        creator=updated_task.get("creator")
        if creator and creator.get("email"):
            email_service.send_task_completed_notification(creator["email"],creator.get("full_name",creator["email"]),updated_task.get("title",""),completed_by_name)
        assignee=updated_task.get("assignee")
        if assignee and assignee.get("email") and assignee.get("id") != (creator.get("id") if creator else None):
            email_service.send_task_completed_notification(assignee["email"],assignee.get("full_name",assignee["email"]),updated_task.get("title",""),completed_by_name)
    return jsonify({"success":True,"task":updated_task}),200

@tasks_bp.route("/<task_id>",methods=["DELETE"])
@require_auth
def delete_task(task_id):
    task=supabase_service.get_task_by_id(task_id)
    if not task: return jsonify({"error":"Task not found"}),404
    if task.get("created_by") != g.current_user.id: return jsonify({"error":"Only the task creator can delete this task"}),403
    if not supabase_service.delete_task(task_id): return jsonify({"error":"Failed to delete task"}),500
    return jsonify({"success":True,"message":"Task deleted successfully"}),200
