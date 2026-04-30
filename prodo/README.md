# NeuactPM Production Deployment

Auto-generated deployment on 2026-04-25.

## Quick Start

```bash
# Check services
systemctl --user status neuact-pm-{backend,frontend}.service

# View logs
journalctl --user -u neuact-pm-frontend.service -f
journalctl --user -u neuact-pm-backend.service -f

# Restart services
systemctl --user restart neuact-pm-backend.service
systemctl --user restart neuact-pm-frontend.service
```

## Services

### Backend (Django + Gunicorn)
- **Port**: 9017
- **Process**: `neuact-pm-backend.service`
- **Address**: http://0.0.0.0:9017
- **Logs**: `prodo/logs/backend-error.log`

### Frontend (Next.js)
- **Port**: 3420
- **Process**: `neuact-pm-frontend.service`
- **Address**: http://0.0.0.0:3420
- **Logs**: `prodo/logs/frontend.log`

## Access URLs

| Interface | HTTP | HTTPS |
|-----------|------|-------|
| localhost | http://localhost:3420 | N/A |
| Tailscale VPN | http://100.90.185.31:3420 | https://100.90.185.31:3420 |
| LAN Ethernet | http://192.168.1.20:3420 | https://192.168.1.20:3420 |
| LAN Wi-Fi | http://192.168.1.14:3420 | https://192.168.1.14:3420 |

## Architecture

```
prodo/
├── backend/          # Django project
│   ├── venv/         # Python virtual environment
│   ├── neuact_pm/    # Django app
│   └── start.sh      # Startup script for gunicorn
├── frontend/         # Next.js build
│   ├── .next/        # Production build
│   ├── public/       # Static assets
│   └── node_modules/ # Dependencies
├── config/
│   ├── ports.env     # Port configuration
│   └── deployment.env # Django environment variables
├── logs/             # Service logs
│   ├── backend.log
│   ├── backend-error.log
│   ├── frontend.log
│   └── frontend-error.log
└── README.md         # This file
```

## Configuration

### Environment Variables

**Backend** (`config/deployment.env`):
- `DEBUG=False`
- `ALLOWED_HOSTS=*`
- `CORS_ALLOWED_ORIGINS=*`
- `DATABASE_URL=sqlite:///db.sqlite3`

**Frontend** (`frontend/.env.production.local`):
- `NEXT_PUBLIC_API_URL=http://100.90.185.31:9017`
- `NEXT_PUBLIC_API_PORT=9017`

## Health Checks

```bash
# Backend
curl http://localhost:9017/
# Response: 404 Not Found (Django loaded, no root endpoint)

# Frontend
curl http://localhost:3420/
# Response: 200 OK (Next.js loaded)

# Page test
curl http://localhost:3420/test-layouts
# Should return HTML with /test-layouts content
```

## Maintenance

### View Service Status
```bash
systemctl --user status neuact-pm-backend.service
systemctl --user status neuact-pm-frontend.service
```

### View Real-Time Logs
```bash
# Backend errors
tail -f prodo/logs/backend-error.log

# Frontend logs
journalctl --user -u neuact-pm-frontend.service -f
```

### Restart Services
```bash
systemctl --user restart neuact-pm-backend.service
systemctl --user restart neuact-pm-frontend.service
```

### Stop Services
```bash
systemctl --user stop neuact-pm-backend.service
systemctl --user stop neuact-pm-frontend.service
```

### Start Services
```bash
systemctl --user start neuact-pm-backend.service
systemctl --user start neuact-pm-frontend.service
```

## Database

Currently using SQLite at `backend/db.sqlite3`.

To backup:
```bash
cp prodo/backend/db.sqlite3 prodo/backend/db.sqlite3.backup
```

## Troubleshooting

### Services not starting

1. Check systemd status:
   ```bash
   systemctl --user status neuact-pm-backend.service
   systemctl --user status neuact-pm-frontend.service
   ```

2. Check logs:
   ```bash
   journalctl --user -u neuact-pm-backend.service -n 50
   journalctl --user -u neuact-pm-frontend.service -n 50
   ```

3. Restart daemon and services:
   ```bash
   systemctl --user daemon-reload
   systemctl --user restart neuact-pm-backend.service neuact-pm-frontend.service
   ```

### Port conflicts

If port 9017 or 3420 is in use:
```bash
# Find process using port
lsof -i :9017
lsof -i :3420

# Kill process
kill -9 <PID>

# Restart service
systemctl --user restart neuact-pm-{backend,frontend}.service
```

### Django errors (jazzmin)

jazzmin admin package was disabled due to missing dependency. To re-enable later, add back to `neuact_pm/settings.py` after installing jazzmin:

```bash
cd prodo/backend
source venv/bin/activate
pip install jazzmin
```

Then update settings and restart service.

## Keycloak Integration

Authentication requires Keycloak running at http://localhost:8080/keycloak

**Config in** `config/deployment.env`:
- `OIDC_RP_CLIENT_ID=neuact-pm`
- `OIDC_RP_SERVER_URL=http://localhost:8080/keycloak`

Keycloak must be running and reachable for authentication to work.

## Rebuild & Redeploy

To rebuild frontend:
```bash
cd /home/rohith/desktop/NeuactProjectManagement/frontend
npm run build
cp -r .next/ /path/to/prodo/frontend/
```

To reinstall backend dependencies:
```bash
cd prodo/backend
source venv/bin/activate
pip install -r requirements.txt
systemctl --user restart neuact-pm-backend.service
```

## Uninstall

To remove the deployment:

```bash
# Stop services
systemctl --user stop neuact-pm-backend.service neuact-pm-frontend.service
systemctl --user disable neuact-pm-backend.service neuact-pm-frontend.service

# Remove service files
rm ~/.config/systemd/user/neuact-pm-*.service

# Reload daemon
systemctl --user daemon-reload

# Remove prodo directory
rm -rf /home/rohith/desktop/NeuactProjectManagement/prodo
```

---

**Generated**: 2026-04-25
**Services**: gunicorn (backend), next-server (frontend)
**Database**: SQLite
**Auth**: Keycloak/OIDC
