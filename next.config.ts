import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable styled-components support
  compiler: {
    styledComponents: true,
  },
  // Add SCSS support
  sassOptions: {
    includePaths: ['./app'],
  },
};

export default nextConfig;
