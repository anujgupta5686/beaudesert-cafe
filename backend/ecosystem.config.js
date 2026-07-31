module.exports = {
  apps: [
    {
      name: 'beaudesert-cafe-api',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      // Secrets come from `.env` via dotenv in index.js — keep .env on the host only
      env: {
        NODE_ENV: 'production',
        APP_ENV: 'production',
      },
      max_memory_restart: '500M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
    },
  ],
};

