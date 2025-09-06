import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    proxy: {
      '/api/jira': {
        target: 'https://holded.atlassian.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/jira/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Add authentication headers for both REST and GraphQL API
            const authToken = req.headers['x-jira-token'];
            const authEmail = req.headers['x-jira-email'];
            
            if (authToken && authEmail) {
              const auth = Buffer.from(`${authEmail}:${authToken}`).toString('base64');
              proxyReq.setHeader('Authorization', `Basic ${auth}`);
            }
            
            // Add headers for GraphQL requests
            if (req.url?.includes('graphql')) {
              // Check if the request already has the experimental header
              const experimentalHeader = req.headers['x-experimentalapi'];
              if (experimentalHeader) {
                proxyReq.setHeader('X-ExperimentalApi', experimentalHeader);
              }
            }
          });
        }
      },
      '/gateway/api/graphql': {
        target: 'https://api.atlassian.com',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Add authentication headers for GraphQL API
            const authToken = req.headers['x-jira-token'];
            const authEmail = req.headers['x-jira-email'];
            const cloudId = req.headers['x-jira-cloudid'];
            
            if (authToken && authEmail) {
              const auth = Buffer.from(`${authEmail}:${authToken}`).toString('base64');
              proxyReq.setHeader('Authorization', `Basic ${auth}`);
            }
            
            // Forward the experimental header if present
            const experimentalHeader = req.headers['x-experimentalapi'];
            if (experimentalHeader) {
              proxyReq.setHeader('X-ExperimentalApi', experimentalHeader);
            }
            
            if (cloudId) {
              proxyReq.setHeader('Atlassian-Token', 'no-check');
            }
          });
        }
      }
    }
  }
});
