# Smart Business Management & Inventory System — Production Deployment Guide

This document provides end-to-end instructions for deploying the **Smart Business Management & Inventory System** to production environments.

---

## 1. Architecture Overview

- **Frontend:** React 18 + Vite SPA compiled into static assets (`dist/`), styled with luxury Dark Gold Tailwind & CSS.
- **Backend API:** Django REST Framework + SimpleJWT running on Python 3.11+, served via Gunicorn (Linux/Docker) or WSGI.
- **Static Assets:** Managed with WhiteNoise (`CompressedManifestStaticFilesStorage`) with automatic cache-busting and gzip/brotli compression.
- **Database:** MariaDB 10.4+ or MySQL 8.0+ on port 3306 (with SQLite fallback for isolated testing).
- **Reverse Proxy:** Nginx handling SSL termination, static/media proxying, and routing `/api/` & `/admin/` requests to the backend.

---

## 2. Pre-Deployment Readiness Verification

Run the following checks from the project root to ensure complete build integrity:

```bash
# 1. Verify backend configuration and models
cd backend
python manage.py check

# 2. Verify production deployment security settings (0 errors when configured)
python manage.py check --deploy

# 3. Verify and apply all database migrations
python manage.py migrate

# 4. Collect and post-process static files with WhiteNoise
python manage.py collectstatic --noinput

# 5. Compile the frontend production bundle
cd ../frontend
npm run build
```

---

## 3. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `DEBUG` | `False` | Disables debug mode and sensitive stack traces |
| `SECRET_KEY` | *(50+ char random string)* | Cryptographic signing key |
| `ALLOWED_HOSTS` | `yourdomain.com,www.yourdomain.com` | Allowed HTTP host headers |
| `DB_ENGINE` | `mysql` | `mysql` or `sqlite` |
| `DB_NAME` | `smart_inventory_db` | Database schema name |
| `DB_USER` | `inventory_user` | MySQL database user |
| `DB_PASSWORD` | *(Strong password)* | Database user password |
| `DB_HOST` | `127.0.0.1` (or `db`) | Database hostname or IP |
| `DB_PORT` | `3306` | Database listening port |
| `CORS_ALLOWED_ORIGINS` | `https://yourdomain.com` | Allowed frontend origins |
| `CSRF_TRUSTED_ORIGINS` | `https://yourdomain.com` | Trusted origins for CSRF POST requests |
| `SECURE_SSL_REDIRECT` | `True` | Redirects all HTTP requests to HTTPS |
| `SECURE_HSTS_SECONDS` | `31536000` | HTTP Strict Transport Security (1 year) |
| `SESSION_COOKIE_SECURE` | `True` | Enforces HTTPS-only session cookies |
| `CSRF_COOKIE_SECURE` | `True` | Enforces HTTPS-only CSRF cookies |

### Frontend (`frontend/.env` / build-time)

| Variable | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `/api` (or empty) | In production, defaults to `/api` relative to domain |

---

## 4. Deployment Option A: Docker Compose (Recommended)

The simplest, fully reproducible production deployment uses Docker Compose.

### Prerequisites
- Docker Engine 24+ & Docker Compose v2+

### Step-by-Step
1. Clone the repository to your production server:
   ```bash
   git clone <repo-url> /opt/smart-inventory
   cd /opt/smart-inventory
   ```

2. Create production `.env` in root:
   ```bash
   cat << 'EOF' > .env
   SECRET_KEY=generate-a-strong-random-50-character-secret-key-here
   DB_ROOT_PASSWORD=StrongRootPassword987!
   DB_NAME=smart_inventory_db
   DB_USER=inventory_app
   DB_PASSWORD=StrongUserPassword456!
   ALLOWED_HOSTS=yourdomain.com,localhost
   CORS_ALLOWED_ORIGINS=https://yourdomain.com
   CSRF_TRUSTED_ORIGINS=https://yourdomain.com
   EOF
   ```

3. Launch the container cluster:
   ```bash
   docker compose up -d --build
   ```

4. Apply migrations and initialize default admin in container:
   ```bash
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py createsuperuser
   ```

5. Verify health:
   ```bash
   curl -I http://localhost/api/health/
   # Returns: HTTP/1.1 200 OK
   ```

---

## 5. Deployment Option B: Ubuntu / Debian Linux (Systemd + Nginx + Gunicorn)

### 1. System Dependencies & Database Setup
```bash
sudo apt update && sudo apt install -y python3-venv python3-pip python3-dev \
    default-libmysqlclient-dev pkg-config nginx certbot python3-certbot-nginx mariadb-server

# Create production database and user
sudo mysql -u root -p << 'EOF'
CREATE DATABASE smart_inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'inventory_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON smart_inventory_db.* TO 'inventory_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### 2. Backend Setup
```bash
cd /var/www/smart-inventory/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Configure .env file with DEBUG=False, SECRET_KEY, DB credentials
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 3. Gunicorn Systemd Service
Create `/etc/systemd/system/smart-inventory.service`:
```ini
[Unit]
Description=Smart Inventory Django Backend Daemon
After=network.target mariadb.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/smart-inventory/backend
ExecStart=/var/www/smart-inventory/backend/venv/bin/gunicorn \
    --access-logfile /var/log/gunicorn-access.log \
    --error-logfile /var/log/gunicorn-error.log \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    config.wsgi:application
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now smart-inventory.service
sudo systemctl status smart-inventory.service
```

### 4. Frontend Build
```bash
cd /var/www/smart-inventory/frontend
npm ci
npm run build
# Compiled assets are in /var/www/smart-inventory/frontend/dist
```

### 5. Nginx Server Block
Create `/etc/nginx/sites-available/smart-inventory`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend Single Page App
    location / {
        root /var/www/smart-inventory/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend REST API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Administration
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static Assets (WhiteNoise cache)
    location /static/ {
        alias /var/www/smart-inventory/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    # Uploaded Media
    location /media/ {
        alias /var/www/smart-inventory/backend/media/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }
}
```

Enable site and obtain free SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/smart-inventory /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 6. Health Monitoring & Maintenance

- **API Healthcheck:** `GET /api/health/` returns:
  ```json
  {"status": "healthy", "database": "connected", "service": "smart-inventory-system"}
  ```
- **Database Backup Cron (Nightly):**
  ```bash
  mysqldump -u inventory_user -p'StrongPassword' smart_inventory_db | gzip > /backups/inventory_backup.sql.gz
  ```
