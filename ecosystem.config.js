module.exports = {
  apps: [
    {
      name: 'hedge-fund-backend',
      cwd: './',
      script: 'sh',
      args: '-c "cd backend && poetry run uvicorn api:app --host 0.0.0.0 --port 8000"',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '15s',
      kill_timeout: 5000
    },
    {
      name: 'hedge-fund-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        BROWSER: 'none',
        PORT: 3000
      },
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      log_file: '../logs/frontend-combined.log',
      time: true,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
