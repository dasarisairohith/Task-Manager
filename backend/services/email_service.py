import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config

class EmailService:
    """Gmail SMTP Service for sending Task Notifications"""
    def __init__(self):
        self.user = Config.GMAIL_USER
        self.password = Config.GMAIL_APP_PASSWORD
        self.server = Config.SMTP_SERVER
        self.port = Config.SMTP_PORT

    def _send_email_sync(self, to_email: str, subject: str, html_body: str):
        """Synchronous internal method to send HTML emails via Gmail SMTP"""
        if not self.user or not self.password:
            print(f"[EmailService Warning]: GMAIL_USER or GMAIL_APP_PASSWORD not set. Skipping email to {to_email}.")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"Task Manager Notifications <{self.user}>"
            msg["To"] = to_email

            html_part = MIMEText(html_body, "html")
            msg.attach(html_part)

            with smtplib.SMTP(self.server, self.port) as server:
                server.starttls()
                server.login(self.user, self.password)
                server.sendmail(self.user, to_email, msg.as_string())
            
            print(f"[EmailService Success]: Email sent to {to_email} with subject: '{subject}'")
            return True
        except Exception as e:
            print(f"[EmailService Error]: Failed to send email to {to_email}. Error: {e}")
            return False

    def _send_async(self, to_email: str, subject: str, html_body: str):
        """Execute email dispatch in background thread so HTTP response is not delayed"""
        thread = threading.Thread(target=self._send_email_sync, args=(to_email, subject, html_body))
        thread.daemon = True
        thread.start()

    def send_task_created_notification(self, recipient_email: str, recipient_name: str, task_title: str, task_description: str, creator_name: str, due_date: str = None, priority: str = "medium"):
        """Send notification when a task is created and assigned to a user"""
        subject = f"📋 New Task Assigned: {task_title}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; color: #333; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-left: 6px solid #4f46e5; }}
            .header {{ font-size: 22px; font-weight: bold; color: #1e1b4b; margin-bottom: 20px; }}
            .badge {{ display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: #e0e7ff; color: #3730a3; }}
            .content {{ line-height: 1.6; font-size: 15px; color: #4b5563; margin-bottom: 25px; }}
            .task-card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 15px 0; }}
            .footer {{ font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">📋 New Task Assigned To You</div>
            <div class="content">
              <p>Hi <strong>{recipient_name}</strong>,</p>
              <p><strong>{creator_name}</strong> has assigned a new task to you in Task Manager.</p>
              
              <div class="task-card">
                <h3 style="margin-top:0; color:#1f2937;">{task_title}</h3>
                <p><strong>Description:</strong> {task_description or 'No description provided.'}</p>
                <p><strong>Priority:</strong> <span class="badge">{priority.upper()}</span></p>
                {"<p><strong>Due Date:</strong> " + str(due_date) + "</p>" if due_date else ""}
              </div>

              <p>Please log in to your dashboard to review and update the task progress.</p>
            </div>
            <div class="footer">
              This is an automated notification from Task Manager System.
            </div>
          </div>
        </body>
        </html>
        """
        self._send_async(recipient_email, subject, html_content)

    def send_task_completed_notification(self, recipient_email: str, recipient_name: str, task_title: str, completed_by_name: str):
        """Send notification when a task status is changed to Completed"""
        subject = f"✅ Task Completed: {task_title}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; color: #333; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-left: 6px solid #10b981; }}
            .header {{ font-size: 22px; font-weight: bold; color: #065f46; margin-bottom: 20px; }}
            .content {{ line-height: 1.6; font-size: 15px; color: #4b5563; margin-bottom: 25px; }}
            .task-card {{ background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 15px; margin: 15px 0; }}
            .footer {{ font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">✅ Task Marked as Completed</div>
            <div class="content">
              <p>Hi <strong>{recipient_name}</strong>,</p>
              <p>Great news! The task <strong>"{task_title}"</strong> has been completed by <strong>{completed_by_name}</strong>.</p>
              
              <div class="task-card">
                <h3 style="margin-top:0; color:#065f46; text-decoration: line-through;">{task_title}</h3>
                <p style="color:#047857; font-weight: 600;">Status: COMPLETED</p>
              </div>

              <p>You can check your dashboard for full activity history.</p>
            </div>
            <div class="footer">
              This is an automated notification from Task Manager System.
            </div>
          </div>
        </body>
        </html>
        """
        self._send_async(recipient_email, subject, html_content)

email_service = EmailService()
