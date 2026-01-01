# Use Node.js 20
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (build doesn't need Supabase vars)
RUN npm ci

# Copy all files
COPY . .

# Build the application (Supabase vars not needed here)
RUN npm run build

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application (Supabase vars injected at runtime by Railway)
CMD ["npm", "start"]
