# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Install gettext for envsubst utility
RUN apk add --no-cache gettext

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Expose the port Cloud Run provides (default 8080)
EXPOSE ${PORT:-8080}

# 1. Create config.js using runtime env var
# 2. Substitute PORT in nginx config
# 3. Start nginx
CMD /bin/sh -c " \
    echo \"window.runtimeConfig = { backendUrl: '\$REACT_APP_BACKEND_URL' };\" > /usr/share/nginx/html/config.js && \
    envsubst '\$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && \
    nginx -g 'daemon off;' \
    " 