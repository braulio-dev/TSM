FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Create database directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"] 