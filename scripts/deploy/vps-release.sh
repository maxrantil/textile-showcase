#!/usr/bin/env bash
# ABOUTME: Promotes the rsync'd build (.next.incoming) on the VPS and restarts PM2, with rollback
# ABOUTME: Reinstalls production dependencies only when package-lock.json or the Node version changed

# Run by the "Deploy on VPS" step of production-deploy.yml from the site
# directory, after it checks out the commit the run built (Issues #467, #493).

APP=idaromme-website
# Kept inside node_modules so that removing node_modules also removes the stamp
STAMP=node_modules/.deploy-lock-hash
# The installed tree, set aside until the new one runs (Issue #494)
PREVIOUS_MODULES=node_modules.previous

restore_previous_modules() {
  if [ -d "$PREVIOUS_MODULES" ]; then
    rm -rf node_modules
    mv "$PREVIOUS_MODULES" node_modules
    echo "↩️ Restored the previous node_modules"
  fi
}

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
  # Set the installed tree aside rather than deleting it, so a failed
  # install can put it back (Issue #494)
  echo "📦 Installing production dependencies..."
  # An interrupted deploy may have left only the set-aside tree; keep it
  if [ ! -d node_modules ] && [ -d "$PREVIOUS_MODULES" ]; then
    mv "$PREVIOUS_MODULES" node_modules
  fi
  rm -rf "$PREVIOUS_MODULES"
  if [ -d node_modules ]; then
    mv node_modules "$PREVIOUS_MODULES"
  fi
  if ! npm ci --omit=dev; then
    echo "❌ npm ci failed, restarting the current build..."
    restore_previous_modules
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

# Recreate the process from ecosystem.config.js on every deploy: `pm2 restart`
# keeps the options a process was first started with, so ecosystem changes
# (memory limits, node_args) would never apply (Issue #467)
start_app() {
  pm2 delete "$APP" >/dev/null 2>&1 || echo "ℹ️ No PM2 process to replace"
  pm2 start ecosystem.config.js --only "$APP"
}

echo "🔄 Starting application..."
if ! start_app; then
  echo "❌ PM2 start failed, rolling back..."
  rm -rf .next
  if [ "$HAS_BACKUP" = true ]; then
    mv .next.backup .next
  else
    echo "⚠️ No backup to restore"
  fi
  restore_previous_modules
  start_app || echo "⚠️ Could not restore PM2 process"
  exit 1
fi
# Persist the process list for `pm2 resurrect` after a reboot
pm2 save

rm -rf .next.backup "$PREVIOUS_MODULES"
echo "🎉 Deployment completed successfully!"
