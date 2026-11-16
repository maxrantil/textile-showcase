#!/usr/bin/env bash
# ABOUTME: Promotes the rsync'd build (.next.incoming) on the VPS and restarts PM2, with rollback
# ABOUTME: Reinstalls production dependencies only when package-lock.json or the Node version changed

# Run by the "Deploy on VPS" step of production-deploy.yml from the site
# directory, after `git reset --hard origin/master` (Issue #467).

APP=idaromme-website
# Kept inside node_modules so that removing node_modules also removes the stamp
STAMP=node_modules/.deploy-lock-hash

if [ ! -d .next.incoming ]; then
  echo "❌ Build artifact (.next.incoming) not found — aborting"
  exit 1
fi

# The Node version is part of the hash: native modules (sharp) are built for it
WANT_HASH=$( { sha256sum package-lock.json; node --version; } | sha256sum | cut -d' ' -f1)

if [ -d node_modules ] && [ -f "$STAMP" ] && [ "$(cat "$STAMP")" = "$WANT_HASH" ]; then
  echo "⏭️ package-lock.json and Node $(node --version) unchanged, keeping node_modules"
else
  # Stop PM2 before removing node_modules to release file locks (Issue #302)
  echo "⏹️ Stopping PM2 to release node_modules file locks..."
  pm2 stop "$APP" 2>/dev/null || echo "⚠️ PM2 process not running (ok for first deploy)"

  # Production dependencies only; the build happened on the GHA runner (Issue #320)
  echo "📦 Installing production dependencies..."
  rm -rf node_modules
  if ! npm ci --omit=dev; then
    echo "❌ npm ci failed, restarting the current build..."
    pm2 start "$APP" 2>/dev/null || echo "⚠️ Could not restore PM2 process"
    exit 1
  fi
  echo "$WANT_HASH" > "$STAMP"
  echo "✅ Production dependencies installed"
fi

# Swap builds with renames (instant) right before the restart
echo "🔁 Promoting build artifact..."
rm -rf .next.backup
HAS_BACKUP=false
if [ -d .next ]; then
  mv .next .next.backup
  HAS_BACKUP=true
fi
mv .next.incoming .next

echo "🔄 Starting application..."
if pm2 list | grep -q "$APP"; then
  echo "📋 PM2 process exists, restarting..."
  if ! pm2 restart "$APP"; then
    echo "❌ PM2 restart failed, rolling back..."
    rm -rf .next
    if [ "$HAS_BACKUP" = true ]; then
      mv .next.backup .next
    else
      echo "⚠️ No backup to restore"
    fi
    pm2 start "$APP" 2>/dev/null || echo "⚠️ Could not restore PM2 process"
    exit 1
  fi
else
  echo "🚀 PM2 process not found, starting new instance..."
  PORT=3001 pm2 start npm --name "$APP" -- start
  pm2 save
fi

rm -rf .next.backup
echo "🎉 Deployment completed successfully!"
