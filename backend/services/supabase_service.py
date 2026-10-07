import os
from supabase import create_client, Client
from config import Config

class SupabaseService:
    """Service wrapper for interacting with Supabase Database and Auth"""
    def __init__ (self):
        self.url = Config.SUPABASE_URL
        self.key = Config.SUPABASE_KEY
        self.client: Client = None
        if self.url and self.key:
            try:
                self.client = create_client(self.url, self.key)
            except Exception as e:
                print(f"[SupabaseService Init Error]: {e}")

    def is_configured(self) -> bool:
        return self.client is not None

    # --- USER / PROFILE OPERATIONS ---
    def get_user_profile(self, user_id: str):
        """Fetch user profile by user UUID"""
        if not self.client:
            return None
        res = self.client.table("profiles").select("*").eq("id", user_id).execute()
        return res.data[0] if res.data else None

    def upsert_profile(self, user_id: str, email: str, full_name: str = None, avatar_url: str = None):
        """Sync user profile data upon Google OAuth sign-in"""
        if not self.client:
            return None
        data = {
            "id": user_id,
            "email": email,
            "full_name": full_name or email.split("@")[0],
            "avatar_url": avatar_url or ""
        }
        res = self.client.table("profiles").upsert(data).execute()
        return res.data[0] if res.data else None

    def get_all_users(self):
        """Fetch all registered profiles for task assignment dropdown"""
        if not self.client:
            return []
        res = self.client.table("profiles").select("id, email, full_name, avatar_url").execute()
        return res.data or []

    # --- TASK OPERATIONS ---
    def get_tasks(self, status=None, priority=None, assigned_to=None, created_by=None, search=None):
        """Fetch tasks with optional filter parameters and join assigner/creator details"""
        if not self.client:
            return []
        
        # Select task fields along with profiles for creator and assignee
        query = self.client.table("tasks").select(
            "*, creator:profiles!created_by(id, full_name, email, avatar_url), assignee:profiles!assigned_to(id, full_name, email, avatar_url)"
        )

        if status:
            query = query.eq("status", status)
        if priority:
            query = query.eq("priority", priority)
        if assigned_to:
            query = query.eq("assigned_to", assigned_to)
        if created_by:
            query = query.eq("created_by", created_by)
        if search:
            query = query.ilike("title", f"%{search}%")

        res = query.order("created_at", desc=True).execute()
        return res.data or []

    def get_task_by_id(self, task_id: str):
        """Fetch single task by ID"""
        if not self.client:
            return None
        res = self.client.table("tasks").select(
            "*, creator:profiles!created_by(id, full_name, email, avatar_url), assignee:profiles!assigned_to(id, full_name, email, avatar_url)"
        ).eq("id", task_id).execute()
        return res.data[0] if res.data else None

    def create_task(self, title: str, description: str, created_by: str, assigned_to: str = None, priority: str = "medium", due_date: str = None):
        """Create new task"""
        if not self.client:
            return None
        payload = {
            "title": title,
            "description": description,
            "created_by": created_by,
            "assigned_to": assigned_to if assigned_to else None,
            "priority": priority,
            "status": "todo",
            "due_date": due_date if due_date else None
        }
        res = self.client.table("tasks").insert(payload).execute()
        return res.data[0] if res.data else None

    def update_task(self, task_id: str, updates: dict):
        """Update existing task fields"""
        if not self.client:
            return None
        res = self.client.table("tasks").update(updates).eq("id", task_id).execute()
        return res.data[0] if res.data else None

    def delete_task(self, task_id: str):
        """Delete task by ID"""
        if not self.client:
            return False
        res = self.client.table("tasks").delete().eq("id", task_id).execute()
        return True

    # --- TASK COMMENTS OPERATIONS ---
    def get_comments(self, task_id: str):
        """Get comments for a specific task"""
        if not self.client:
            return []
        res = self.client.table("task_comments").select(
            "*, author:profiles!user_id(id, full_name, email, avatar_url)"
        ).eq("task_id", task_id).order("created_at", asc=True).execute()
        return res.data or []

    def add_comment(self, task_id: str, user_id: str, content: str):
        """Add comment to task"""
        if not self.client:
            return None
        payload = {
            "task_id": task_id,
            "user_id": user_id,
            "content": content
        }
        res = self.client.table("task_comments").insert(payload).execute()
        return res.data[0] if res.data else None

    # --- ANALYTICS ---
    def get_task_analytics(self, user_id: str = None):
        """Calculate task statistics (Total, Completed, Pending, Overdue)"""
        tasks = self.get_tasks()
        total = len(tasks)
        completed = sum(1 for t in tasks if t.get("status") == "completed")
        in_progress = sum(1 for t in tasks if t.get("status") == "in_progress")
        todo = sum(1 for t in tasks if t.get("status") == "todo")
        
        return {
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "todo": todo,
            "pending": todo + in_progress
        }

supabase_service = SupabaseService()
