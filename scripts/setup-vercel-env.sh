#!/bin/bash
# Carga todas las variables de .env.local a Vercel (production + preview)
# Uso: bash scripts/setup-vercel-env.sh

set -e
cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "❌ No se encontró .env.local"
  exit 1
fi

# Leer vars del archivo
eval $(grep -v '^#' .env.local | grep '=' | sed 's/^/export /')

add_env() {
  local key=$1
  local val=$2
  local sensitive=${3:-false}

  if [ -z "$val" ]; then
    echo "  — $key (vacío, omitido)"
    return
  fi

  for env in production preview; do
    if [ "$sensitive" = "true" ]; then
      printf '%s' "$val" | vercel env add "$key" "$env" --force --sensitive 2>&1 | grep -E "Added|Error|already" || true
    else
      printf '%s' "$val" | vercel env add "$key" "$env" --force 2>&1 | grep -E "Added|Error|already" || true
    fi
  done
  echo "  ✓ $key → production + preview"
}

echo ""
echo "🔐 Configurando variables de entorno en Vercel..."
echo ""

echo "── Base de datos ──────────────────────────────────────"
add_env DATABASE_URL          "$DATABASE_URL"           true
add_env DIRECT_URL            "$DIRECT_URL"             true

echo ""
echo "── Supabase ───────────────────────────────────────────"
add_env NEXT_PUBLIC_SUPABASE_URL      "$NEXT_PUBLIC_SUPABASE_URL"
add_env NEXT_PUBLIC_SUPABASE_ANON_KEY "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
add_env SUPABASE_SERVICE_ROLE_KEY     "$SUPABASE_SERVICE_ROLE_KEY"    true

echo ""
echo "── Cloudflare R2 (Storage) ────────────────────────────"
add_env R2_ACCOUNT_ID         "$R2_ACCOUNT_ID"
add_env R2_ACCESS_KEY_ID      "$R2_ACCESS_KEY_ID"       true
add_env R2_SECRET_ACCESS_KEY  "$R2_SECRET_ACCESS_KEY"   true
add_env R2_BUCKET_NAME        "$R2_BUCKET_NAME"
add_env R2_PUBLIC_URL         "$R2_PUBLIC_URL"

echo ""
echo "── Email / Resend ─────────────────────────────────────"
add_env RESEND_API_KEY        "$RESEND_API_KEY"          true

echo ""
echo "── Pagos / Flow.cl ────────────────────────────────────"
add_env FLOW_API_KEY          "$FLOW_API_KEY"            true
add_env FLOW_SECRET           "$FLOW_SECRET"             true
add_env FLOW_WEBHOOK_SECRET   "$FLOW_WEBHOOK_SECRET"     true

echo ""
echo "── PDF / Browserless ──────────────────────────────────"
add_env BROWSERLESS_TOKEN     "$BROWSERLESS_TOKEN"       true

echo ""
echo "── App ────────────────────────────────────────────────"
add_env CRON_SECRET           "$CRON_SECRET"             true
add_env NEXTAUTH_SECRET       "$NEXTAUTH_SECRET"         true
# NEXT_PUBLIC_APP_URL se actualiza manualmente con la URL de producción de Vercel

echo ""
echo "✅ Variables cargadas. Falta configurar manualmente:"
echo "   NEXT_PUBLIC_APP_URL → URL de producción de Vercel (ej: https://nucleo.vercel.app)"
echo ""
echo "Puedes hacerlo con:"
echo "  echo 'https://TU-URL.vercel.app' | vercel env add NEXT_PUBLIC_APP_URL production --force"
echo "  echo 'https://TU-URL.vercel.app' | vercel env add NEXT_PUBLIC_APP_URL preview --force"
