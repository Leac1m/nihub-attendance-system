# NIHUB Frontend Dashboard

The web-based administration frontend for the NIHUB Attendance System. It provides a comprehensive dashboard for staff and admins to manage events, view attendance spreadsheets, and orchestrate course configurations.

## 🛠️ Tech Stack

- **Framework:** React
- **Build Tool:** Vite
- **Language:** TypeScript
- **Package Manager:** pnpm

## 🚀 Local Development Setup

### 1. Install Dependencies

Ensure you have Node.js and `pnpm` installed. From this directory, run:
```bash
pnpm install
```

### 2. Configure Environment

Create an environment file if necessary. During local development, Vite is configured in `vite.config.ts` to automatically proxy API requests starting with `/api/` to the backend server running at `http://localhost:8000`.

### 3. Start the Development Server

Start the local dev server with Hot Module Replacement (HMR):
```bash
pnpm run dev
```
The application will be available at `http://localhost:5173` (or the port specified by Vite).

## 📦 Building & Deployment

To create a production build:
```bash
pnpm run build
```
This command compiles the React application into static files in the `dist` directory.

### Docker Deployment

The frontend includes a `Containerfile` configured to serve the production build using an **Nginx** web server. This is orchestrated automatically via the root `compose.yml` file, which maps the frontend to port `8080`.

## 🧹 Code Quality

To run ESLint and check for code style issues:
```bash
pnpm run lint
```
