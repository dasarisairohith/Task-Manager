from supabase import create_client, Client
from config import Config


class SupabaseService:
    def __init__(self):
        self.url = Config.SUPABASE_URL
        self.key = Config.SUPABASE_KEY
        self.client: Client = None
        if self.url and self.key:
            try:
                self.client = create_client(self.url, self.key)
            except Exception as e:
                print(f"[SupabaseService Init Error]: {e}")

    def is_configured(self):
        return self.client is not None

    def get_authenticated_user(self, access_token):
        if not self.client:
            return None
        try:
            return getattr(self.client.auth.get_user(access_token), "user", None)
        except Exception as e:
            print(f"[Supabase Auth Error]: {e}")
            return None

    def get_user_profile(self, user_id):
        if not self.client:
            return None
        res = self.client.table("profiles").select("*").eq("id", user_id).execute()
        return res.data[0] if res.data else None

    def upsert_profile(self, user_id, email, full_name=None, avatar_url=None):
        if not self.client:
            return None
        data = {"id": user_id, "email": email,
                "full_name": full_name or email.split("@")[0],
                "avatar_url": avatar_url or ""}
        res = self.client.table("profiles").upsert(data).execute()
        return res.data[0] if res.data else None

    def get_all_users(self):
        if not self.client:
            return []
        res = self.client.table("profiles").select("id,email,full_name,avatar_url").execute()
        return res.data or []

    def get_tasks(self, status=None, priority=None, assigned_to=None, created_by=None, search=None, user_id=None):
        if not self.client:
            return []
        query = self.client.table("tasks").select(
            "*, creator:profiles!created_by(id, full_name, email, avatar_url), "
            "assignee:profiles!assigned_to(id, full_name, email, avatar_url)"
        )
        # Keep visibility restricted in the database query. A second .or_()
        # for search could replace the access-control OR expression.
        if user_id:
            query = query.or_(f"created_by.eq.{user_id},assigned_to.eq.{user_id}")
        if status:
            query = query.eq("status", status)
        if priority:
            query = query.eq("priority", priority)
        if assigned_to:
            query = query.eq("assigned_to", assigned_to)
        if created_by:
            query = query.eq("created_by", created_by)
        res = query.order("created_at", desc=True).execute()
        tasks = res.data or []
        # Search only within the already-authorized task set.
        term = (search or "").strip().casefold()
        if term:
            tasks = [task for task in tasks
                     if term in (task.get("title") or "").casefold()
                     or term in (task.get("description") or "").casefold()]
        return tasks

    def get_task_by_id(self, task_id):
        if not self.client:
            return None
        res = self.client.table("tasks").select(
            "*, creator:profiles!created_by(id, full_name, email, avatar_url), "
            "assignee:profiles!assigned_to(id, full_name, email, avatar_url)"
        ).eq("id", task_id).execute()
        return res.data[0] if res.data else None

    def create_task(self, title, description, created_by, assigned_to=None, priority="medium", due_date=None):
        if not self.client:
            return None
        payload = {"title": title.strip(),
                   "description": description.strip() if description else "",
                   "created_by": created_by, "assigned_to": assigned_to or None,
                   "priority": priority, "status": "todo", "due_date": due_date or None}
        try:
            res = self.client.table("tasks").insert(payload).select("*").execute()
            if not res.data:
                print("[SupabaseService Error]: Task insert returned no row.")
                return None
            print(f"[SupabaseService Success]: Created task id={res.data[0].get('id')}")
            return res.data[0]
        except Exception as e:
            print(f"[SupabaseService Error]: Task insert failed: {e}")
            raise

    def update_task(self, task_id, updates):
        if not self.client:
            return None
        allowed = {"title", "description", "status", "priority", "due_date", "assigned_to"}
        safe = {k: v for k, v in updates.items() if k in allowed}
        if not safe:
            return None
        res = self.client.table("tasks").update(safe).eq("id", task_id).execute()
        return res.data[0] if res.data else None

    def delete_task(self, task_id):
        if not self.client:
            return False
        res = self.client.table("tasks").delete().eq("id", task_id).execute()
        return bool(res.data is not None)

    def get_comments(self, task_id):
        if not self.client:
            return []
        res = self.client.table("task_comments").select(
            "*, author:profiles!user_id(id, full_name, email, avatar_url)"
        ).eq("task_id", task_id).order("created_at", asc=True).execute()
        return res.data or []

    def add_comment(self, task_id, user_id, content):
        if not self.client:
            return None
        res = self.client.table("task_comments").insert(
            {"task_id": task_id, "user_id": user_id, "content": content.strip()}
        ).execute()
        return res.data[0] if res.data else None

    def get_task_analytics(self, user_id):
        from datetime import datetime, timezone
        tasks = self.get_tasks(user_id=user_id)
        now = datetime.now(timezone.utc)
        completed = sum(1 for task in tasks if task.get("status") == "completed")
        in_progress = sum(1 for task in tasks if task.get("status") == "in_progress")
        todo = sum(1 for task in tasks if task.get("status") == "todo")
        overdue = 0
        for task in tasks:
            due_date = task.get("due_date")
            if due_date and task.get("status") != "completed":
                try:
                    if datetime.fromisoformat(due_date.replace("Z", "+00:00")) < now:
                        overdue += 1
                except ValueError:
                    pass
        return {"total": len(tasks), "completed": completed, "in_progress": in_progress,
                "todo": todo, "pending": todo + in_progress, "overdue": overdue}


supabase_service = SupabaseService()
