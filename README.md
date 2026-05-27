# NIHUB Attendance System

<div align="center">
  A comprehensive, multi-client platform for managing events and tracking attendee attendance using QR code scanning.
</div>

---

## 📖 Overview

The NIHUB Attendance System provides a robust solution for tracking user attendance at various events or courses. It utilizes a central API and database, with dedicated frontends for both web (dashboard/management) and mobile (on-site QR scanning and attendance logging).

## 🏗️ System Architecture

This project is built using a modern, scalable stack, separated into distinct functional components:

- **[Server (Backend)](./server/README.md):** A FastAPI application powered by Python. It handles business logic, authentication, database interactions (PostgreSQL), and automated emails (SMTP).
- **[Mobile Application](./mobile/README.md):** Built with React Native and Expo. It serves as the primary tool for instructors and staff to scan attendee QR codes on-site and log attendance.
- **[Frontend Web App](./frontend/README.md):** A React application built with Vite and TypeScript. It provides a web-based dashboard for administration, event creation, and analytics.

*For detailed documentation and local development guides for each component, please follow the links above to their respective `README.md` files.*

## ⚙️ Prerequisites

To run the entire system locally, ensure you have the following installed:

- **Docker** & **Docker Compose** (for full-stack containerized running)
- **Node.js** (v20+) & **pnpm** (for local UI/Mobile development)
- **Python 3.11+** (for local backend development)
- **Android Studio** / **Xcode** (for mobile emulation/simulation)

## 🚀 Quick Start (Docker)

The fastest way to get the entire system up and running is via Docker Compose. This will spin up the PostgreSQL database, the FastAPI backend, and the React frontend.

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd nihub-attendance-system
   ```

2. **Configure Environment Variables:**
   Copy the example environment files for the server and frontend (if applicable) and fill in the necessary values.
   ```bash
   cp server/.env.example server/.env
   ```

3. **Start the stack:**
   ```bash
   docker compose up -d --build
   ```

4. **Access the services:**
   - **Frontend Dashboard:** `http://localhost:8080`
   - **Backend API:** `http://localhost:8000`
   - **Database (PostgreSQL):** `localhost:5432`

5. **Stop the stack:**
   ```bash
   docker compose down
   ```
   *Note: To reset the database and wipe all data, use `docker compose down -v`.*

## ☁️ Deployment

The system is containerized for easy deployment to cloud providers (e.g., AWS, DigitalOcean, Render, or a custom VPS).

1. **Backend & Frontend (Web):**
   - Ensure your production `.env` files are securely loaded into your environment.
   - You can deploy the `compose.yml` stack directly to a Docker Swarm or use a tool like Portainer.
   - Alternatively, build the images using the `Containerfile` provided in the `server` and `frontend` directories and push them to a container registry.

2. **Mobile Application:**
   - The mobile application is deployed via **Expo Application Services (EAS)**.
   - Ensure you are logged into your Expo account.
   - Run `eas build` from the `mobile` directory to generate Android (`.apk`/`.aab`) or iOS builds.
   - Detailed instructions are in the [Mobile README](./mobile/README.md).

## 📝 License

This project is licensed under the MIT License.