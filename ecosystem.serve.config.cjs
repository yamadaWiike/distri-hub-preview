/**
 * PM2 Ecosystem Configuration for Serve
 * Alternative configuration using 'serve' package instead of 'vite preview'
 * 
 * Usage:
 *   pm2 start ecosystem.serve.config.cjs --env production
 *   pm2 restart baskit-distributor-hub-serve
 *   pm2 stop baskit-distributor-hub-serve
 *   pm2 delete baskit-distributor-hub-serve
 * 
 * Install serve globally first:
 *   npm install -g serve
 */

module.exports = {
  apps: [
    {
      name: 'baskit-distributor-hub-serve',
      script: 'serve',
      args: 'dist -l 8081 --no-clipboard',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      
      // Environment variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 8081
      },
      
      // Logging
      error_file: './logs/serve-error.log',
      out_file: './logs/serve-out.log',
      log_file: './logs/serve-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Restart settings
      min_uptime: '10s',
      max_restarts: 10,
      kill_timeout: 3000,
      
      // Process settings
      wait_ready: false,
      listen_timeout: 3000,
      
      // Advanced settings
      merge_logs: true,
      autorestart: true,
      vizion: false,
      post_update: ['npm install', 'npm run build']
    }
  ]
};
