import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application Configuration Settings"""
    PORT = int(os.getenv("PORT", 5000))
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    
    # Supabase Configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")  # Service Role Key or Anon Key
    
    # Gmail SMTP Configuration for Notifications
    GMAIL_USER = os.getenv("GMAIL_USER", "")
    GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    
    # CORS Settings
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
