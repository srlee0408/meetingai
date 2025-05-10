import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    ASSEMBLY_AI_API_KEY: process.env.ASSEMBLY_AI_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  },
};

export default nextConfig;
