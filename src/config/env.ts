const requiredEnvs = ['DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN'];

const validateEnv = () => {
  const missing = requiredEnvs.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};

export { validateEnv };
