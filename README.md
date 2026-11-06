# TaskFlow 🗂️

A fullstack **Personal Task Manager** — add, complete, and delete tasks. Designed to demonstrate a production-grade DevOps pipeline.

---

## Architecture

```
Browser → Nginx (React SPA) → Express API → MongoDB
                ↓
         Prometheus (scrape /metrics)
                ↓
           Grafana (dashboards)
```

## Tech Stack

| Layer        | Technology                    |
|--------------|-------------------------------|
| Frontend     | React 18 + Vite + Nginx       |
| Backend      | Node.js + Express             |
| Database     | MongoDB 7                     |
| Monitoring   | Prometheus + Grafana          |
| CI/CD        | Jenkins (Declarative Pipeline)|
| Container    | Docker + Docker Compose       |
| Orchestration| Kubernetes                    |
| VCS          | Git                           |

---

## Quick Start (Local — Docker Compose)

```bash
# Clone repo
git clone <your-repo-url>
cd taskflow

# Start all services
docker-compose up --build -d

# Wait ~30 seconds, then open:
# App      → http://localhost:3000
# API      → http://localhost:5000/api/tasks
# Metrics  → http://localhost:5000/metrics
# Prometheus → http://localhost:9090
# Grafana  → http://localhost:3001  (admin / admin)
```

---

## API Endpoints

| Method   | Route                | Description         |
|----------|----------------------|---------------------|
| `GET`    | `/api/tasks`         | List all tasks      |
| `POST`   | `/api/tasks`         | Create a task       |
| `PATCH`  | `/api/tasks/:id`     | Toggle complete     |
| `DELETE` | `/api/tasks/:id`     | Delete a task       |
| `GET`    | `/metrics`           | Prometheus metrics  |
| `GET`    | `/health`            | Health check        |

---

## Jenkins CI/CD Pipeline

Stages:
1. **Checkout** — pulls source from Git
2. **Install & Lint** — `npm ci` for backend and frontend (parallel)
3. **Docker Build** — builds both images (parallel)
4. **Docker Push** — pushes to registry
5. **Deploy to K8s** — applies all manifests, waits for rollout

### Setup Jenkins credentials:
| ID                  | Type          | What to store             |
|---------------------|---------------|---------------------------|
| `DOCKER_REGISTRY`   | Secret text   | e.g. `docker.io/username` |
| `docker-hub-creds`  | Username/Pass | Docker Hub credentials    |
| `kubeconfig`        | Secret file   | Your cluster kubeconfig   |

---

## Kubernetes Deploy

```bash
# Substitute your registry & tag, then:
kubectl apply -f k8s/
kubectl rollout status deployment/backend
kubectl rollout status deployment/frontend
```

---

## Grafana Dashboard

Open `http://localhost:3001` → login with `admin / admin`.

The **TaskFlow Dashboard** auto-loads and shows:
- 📊 Tasks created / completed / deleted (stat panels)
- 📈 HTTP request rate (req/s)
- ⏱️ API latency — p50 & p95 percentiles
- 🖥️ Node.js memory usage

---

## Project Structure

```
taskflow/
├── backend/          Node.js + Express API
├── frontend/         React + Vite app
├── monitoring/       Prometheus config + Grafana provisioning
├── k8s/              Kubernetes manifests
├── Jenkinsfile       CI/CD pipeline
└── docker-compose.yml
```

---

Made with ❤️ — fullstack + DevOps demo project.
