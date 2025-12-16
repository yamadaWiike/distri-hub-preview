module.exports = {
  apps: [
    {
      name: "baskit-distributor-hub",
      script: "./node_modules/.bin/tsx",
      args: "server.ts",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 8081,
        HOST: "0.0.0.0",
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 8081,
        HOST: "localhost",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8081,
        HOST: "0.0.0.0",
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true,
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Restart settings
      min_uptime: "10s",
      max_restarts: 10,
      // Kill timeout
      kill_timeout: 3000,
      // Wait before restart
      wait_ready: true,
      listen_timeout: 3000,
    },
  ],
};
