module.exports = {
  apps: [
    {
      name: "easydiesel-api-3000",
      script: "node",
      args: "dist/index.js",
      env: {
        PORT: 3000,
        NODE_ENV: "development",
        RATE_LIMIT_GLOBAL: "500",
        RATE_LIMIT_AUTH: "20",
        RATE_LIMIT_PUBLIC: "120",
      },
    },
    {
      name: "easydiesel-api-3001",
      script: "node",
      args: "dist/index.js",
      env: {
        PORT: 3001,
        NODE_ENV: "development",
        RATE_LIMIT_GLOBAL: "500",
        RATE_LIMIT_AUTH: "20",
        RATE_LIMIT_PUBLIC: "120",
      },
    },
    {
      name: "easydiesel-api-3002",
      script: "node",
      args: "dist/index.js",
      env: {
        PORT: 3002,
        NODE_ENV: "development",
        RATE_LIMIT_GLOBAL: "500",
        RATE_LIMIT_AUTH: "20",
        RATE_LIMIT_PUBLIC: "120",
      },
    }
  ]
};
