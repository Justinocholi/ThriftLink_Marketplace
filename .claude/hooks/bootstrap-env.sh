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
  JWT_SECRET JWT_EXPIRES_IN \
  PAYMENT_BANK_NAME PAYMENT_ACCOUNT_NUMBER PAYMENT_ACCOUNT_NAME \
  SMTP_HOST SMTP_PORT SMTP_SECURE SMTP_USER SMTP_PASSWORD EMAIL_FROM \
  FRONTEND_URL
do
  write_var "$VAR"
done

# Default the data backend to Supabase (the migration target). A container
# env var of the same name still wins via the loop above if explicitly set.
if ! grep -q "^DATA_BACKEND=" "$ENV_FILE" 2>/dev/null; then
  echo "DATA_BACKEND=${DATA_BACKEND:-supabase}" >> "$ENV_FILE"
fi

echo "[bootstrap-env] backend/.env hydrated from container environment."
