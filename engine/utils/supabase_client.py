import jwt
import time
from supabase import create_client, Client, ClientOptions
from config.settings import settings

# Since SUPABASE_SERVICE_ROLE_KEY is actually the JWT secret, we sign a custom service_role token
payload = {
    "role": "service_role",
    "iss": "supabase",
    "ref": "dihlowrqpbwibupxkgds",
    "iat": int(time.time()) - 10,
    "exp": int(time.time()) + 3600
}
service_role_token = jwt.encode(payload, settings.supabase_service_role_key, algorithm="HS256")

# Initialize client using anon key for routing/gateway and the signed token for DB service_role bypass
options = ClientOptions(headers={"Authorization": f"Bearer {service_role_token}"})
supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key, options=options)
