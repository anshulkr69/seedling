from supabase import create_client, Client
from config.settings import settings

# Initialize client using the service role key to bypass RLS for backend operations
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
