module.exports = {
  apps: [{
    name: 'baskit-distributor-hub',
    script: 'npm',
    args: 'run dev',
    cwd: '/Users/rudysetyoh/distrihub_v2/baskit-distributor-hub-25',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
