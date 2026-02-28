// ABOUTME: PM2 ecosystem configuration for production deployment on Vultr VPS
// Optimized for 964Mi memory VPS with proper error handling and logging

module.exports = {
  apps: [
    {
      name: 'idaromme-website',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/idaromme.dk',
      instances: 1, // Single instance - VPS has limited memory
      exec_mode: 'fork', // Fork mode (not cluster) for Next.js standalone

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // NEXT_PUBLIC_* vars should be in .env.production.local on VPS
      },

      // Memory management (VPS has 964Mi total, leave headroom)
      max_memory_restart: '400M', // Restart if memory exceeds 400MB
      node_args: '--max-old-space-size=512', // Node heap limit: 512MB

      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10, // Max restarts in min_uptime window
      min_uptime: '10s', // Minimum uptime before restart count resets
      restart_delay: 4000, // Wait 4s before restart after crash

      // Logging
      error_file: '/home/max/.pm2/logs/idaromme-website-error.log',
      out_file: '/home/max/.pm2/logs/idaromme-website-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Process management
      kill_timeout: 5000, // Wait 5s for graceful shutdown
      listen_timeout: 10000, // Wait 10s for app to be ready
      shutdown_with_message: false,

      // Health monitoring
      watch: false, // Don't watch files in production
      ignore_watch: ['node_modules', '.next', 'logs'],


      // Environment-specific settings
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
