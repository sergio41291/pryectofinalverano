#!/bin/bash

# =============================================================================
# SSL Certificate Setup with Let's Encrypt
# Domain: learnmind-ai.jkhoster.com
# =============================================================================

set -e

DOMAIN="learnmind-ai.jkhoster.com"
EMAIL="admin@jkhoster.com"  # Change this to your email

echo "=========================================="
echo "SSL Certificate Setup"
echo "Domain: $DOMAIN"
echo "=========================================="
echo ""

# Check if certificate already exists
if [ -d "nginx/ssl/live/$DOMAIN" ]; then
    echo "SSL certificate already exists for $DOMAIN"
    echo "Checking expiration..."
    docker-compose -f docker-compose.prod.yml run --rm certbot certificates
    exit 0
fi

echo "Step 1: Starting Nginx in HTTP-only mode..."
# Temporarily use HTTP-only configuration
cat > nginx/nginx.conf.temp << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name learnmind-ai.jkhoster.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 200 "Server ready for SSL\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Backup original nginx config
cp nginx/nginx.conf nginx/nginx.conf.backup

# Use temp config
cp nginx/nginx.conf.temp nginx/nginx.conf

# Restart nginx with temp config
docker-compose -f docker-compose.prod.yml restart nginx

echo "Step 2: Waiting for Nginx to be ready..."
sleep 10

echo "Step 3: Obtaining SSL certificate from Let's Encrypt..."
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo "Step 4: SSL certificate obtained successfully!"
    
    # Restore original nginx config
    cp nginx/nginx.conf.backup nginx/nginx.conf
    
    # Restart nginx with SSL config
    docker-compose -f docker-compose.prod.yml restart nginx
    
    echo ""
    echo "=========================================="
    echo "SSL Setup completed!"
    echo "=========================================="
    echo ""
    echo "Certificate location: nginx/ssl/live/$DOMAIN/"
    echo "Certificate will auto-renew every 12 hours via certbot container"
    echo ""
else
    echo "ERROR: Failed to obtain SSL certificate!"
    echo "Restoring original configuration..."
    cp nginx/nginx.conf.backup nginx/nginx.conf
    docker-compose -f docker-compose.prod.yml restart nginx
    exit 1
fi
