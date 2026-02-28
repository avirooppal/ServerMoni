# ServerMoni

A cross-platform server monitoring dashboard.

## Requirements
- Docker and Docker Compose
- (Optional) Go 1.24+ and Node.js 20+ for local development

## Running with Docker (Recommended)

To build and start the application in the background:

```bash
docker compose up --build -d
```

The services will be available at:
- Dashboard: http://localhost
- API: http://localhost:5001

To stop the application:

```bash
docker compose down
```

## Running Locally (Development)

1. **Start the Backend API (Port 5001)**
   ```bash
   cd backend
   go run ./cmd/api/...
   ```

2. **Start the Frontend Dashboard (Port 5173)**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
