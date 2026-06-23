import jwt
import time
from supabase import create_client, Client, ClientOptions
from config.settings import settings

# Generate service_role token signed with JWT secret (which is settings.supabase_service_role_key)
# We omit 'exp' so the token does not expire, ensuring long-running FastAPI server stability.
payload = {
    "role": "service_role",
    "iss": "supabase",
    "ref": "dihlowrqpbwibupxkgds",
    "iat": int(time.time()) - 10
}
token = jwt.encode(payload, settings.supabase_service_role_key, algorithm="HS256")

# Initialize client using the anon key for the API gateway, passing the service_role JWT in headers
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_anon_key,
    options=ClientOptions(
        headers={"Authorization": f"Bearer {token}"}
    )
)
