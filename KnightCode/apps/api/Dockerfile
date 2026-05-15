# Use a Node.js base image
FROM node:20-slim

# Install C++ compiler and Python
RUN apt-get update && \
    apt-get install -y g++ python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Set environment variable to use direct execution (no Docker-in-Docker)
ENV USE_DOCKER=false
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]
