#!/usr/bin/env bash
# Hydrates backend/.env from container environment variables on session start.
# Add the secrets in Claude Code web dashboard → Environment Settings → Env Vars,
# and they'll be written to backend/.env every time a new session starts.
set -u

ENV_FILE="$(dirname "$0")/../../backend/.env"
mkdir -p "$(dirname "$ENV_FILE")"

write_var() {
  local key="$1" val="${!1:-}"
  if [ -n "$val" ]; then
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
      # replace existing line
      sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
    else
      echo "${key}=${val}" >> "$ENV_FILE"
    fi
  fi
}

touch "$ENV_FILE"

for VAR in \
  SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY \
  CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET \
  TERMII_API_KEY TERMII_SECRET_KEY TERMII_SENDER_ID \
  JWT_SECRET JWT_EXPIRES_IN
do
  write_var "$VAR"
done

echo "[bootstrap-env] backend/.env hydrated from container environment."
