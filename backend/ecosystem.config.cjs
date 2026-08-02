/** PM2 config for production EC2 — resists memory spikes on small instances */
module.exports = {
  apps: [
    {
      name: 'cafe-api',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '350M',
      watch: false,
      time: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
