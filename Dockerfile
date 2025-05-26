# Build stage
FROM node:16-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine as production-stage

# Copy built Vue app
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY webapp.nginx.conf /etc/nginx/conf.d/default.conf

# Create directories for HLS data
RUN mkdir -p /opt/data/hls

EXPOSE 80 1935

CMD ["nginx", "-g", "daemon off;"] 