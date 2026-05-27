// PM2 Ecosystem — manages both Operator OS (Next.js) and Hermes (FastAPI)
// Usage: pm2 start pm2.ecosystem.config.js

module.exports = {
  apps: [
    {
      name: "operator-os",
      cwd: "/root/mygithubpage/operator-os",
      script: "npm",
      args: "run dev -- --port 3737",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "5s",
      env: {
        NODE_ENV: "development",
        PORT: "3737",
      },
    },
    {
      name: "hermes",
      cwd: "/root/mygithubpage/hermes-server",
      script: "python",
      args: "main.py",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "5s",
      interpreter: "none",
      env_file: "/root/mygithubpage/hermes-server/.env",
    },
  ],
};
