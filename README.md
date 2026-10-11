Create a professional root README.md for the TaskFlow GitHub repository.

IMPORTANT:
Base the README ONLY on the actual current repository.
Inspect the backend, frontend, docker-compose.yml, env examples, tests, and project structure before writing.

Do NOT invent features, technologies, endpoints, statistics, or deployment links that do not exist.

Project:
TaskFlow — collaborative project and task management platform.

Current stack includes:
- Java 21
- Spring Boot 4.1.x
- Spring Security
- JWT access + refresh authentication
- Spring Data JPA / Hibernate
- PostgreSQL
- Flyway
- MapStruct
- Maven
- Next.js 16
- React
- TypeScript
- Tailwind CSS v4
- Docker Compose
- JUnit / Mockito / Testcontainers

The README should look polished and portfolio-quality.

Use this structure:

# TaskFlow

Short professional description.

Add a centered TaskFlow TF logo at the top using:

frontend/public/image/logo.png

Then include badges for:
- Java
- Spring Boot
- Next.js
- TypeScript
- PostgreSQL
- Docker

## Overview
Explain what TaskFlow is and what problem it solves.

## Features
Include only implemented features such as:
- JWT authentication
- refresh tokens
- role-based access
- Admin / Manager / Member
- project management
- project membership
- task creation and assignment
- task status workflow
- priorities and deadlines
- comments
- activity feed
- dashboard statistics
- admin user management
- profile/password management

## Roles & Permissions
Clearly explain:
ADMIN
MANAGER
MEMBER

## Screenshots
Create a clean section with placeholders for:
- Login
- Dashboard
- Projects
- Project Details
- My Tasks
- Admin Users

Do not invent screenshot files.
Just leave clear placeholder comments telling me where to add them later.

## Tech Stack
Use a clear table divided into:
Backend
Frontend
Database
Security
Testing
DevOps/Tooling

## Architecture
Explain the current modular monolith / layered architecture:

Controller
Service
Repository
DTO
Mapper
Entity
Security
Exception

Explain that the frontend communicates with the Spring Boot REST API.

## Authentication Flow
Briefly explain:
login
access token
refresh token
httpOnly cookie
401 refresh/retry
logout/revocation

Do not expose any secret values.

## Database Model
Summarize:
User
Project
Task
Comment
ActivityLog
RefreshToken

Explain key relationships without inventing fields.

## API Overview
Give the main endpoint groups:
- /api/auth
- /api/users
- /api/projects
- /api/tasks
- comments/activity/dashboard endpoints

Do not list endpoints that don't actually exist.
Inspect controllers first.

## Project Structure
Show an accurate tree similar to:

taskflow/
├── backend/
├── frontend/
├── docker-compose.yml
└── README.md

Expand important backend/frontend folders, but keep it readable.

## Getting Started

### Prerequisites
Include:
- Java 21
- Docker Desktop
- Node.js/npm

Do not require global Maven because the project uses Maven Wrapper.

### 1. Clone
Use:

git clone https://github.com/zaydkassimi/TaskFlow.git
cd TaskFlow

### 2. Start PostgreSQL
docker compose up -d

### 3. Backend
Use Maven Wrapper commands suitable for Windows and also show Unix equivalent if helpful.

Document required environment variables from backend/.env.example.

### 4. Frontend
npm install
npm run dev

Document variables from frontend/.env.example.

Explain default local URLs:
frontend :3000
backend :8080

Only include values confirmed from the repository.

## Development Seed Accounts
Document the existing development-only seed accounts.

Clearly label them:
DEVELOPMENT ONLY

Explain that seed data can be disabled with the existing configuration.

## Testing

Backend:
./mvnw test
or
.\mvnw.cmd test

Mention the existing JUnit / Mockito / Testcontainers approach.

Frontend:
npm run lint
npm run build

Do not claim frontend automated tests exist if they do not.

## Engineering Decisions
Explain professionally:
- why modular monolith instead of microservices
- why DTO boundaries
- why MapStruct
- why PostgreSQL
- why Flyway
- why JWT access + revocable refresh tokens
- why server-side authorization is required
- why Testcontainers is used

## Security Notes
Mention:
- BCrypt
- role/ownership checks
- server-side authorization
- httpOnly refresh cookie
- environment variables for secrets
- dev defaults must be replaced in production
- seed data must be disabled in production

## Future Improvements
Keep this modest and clearly marked as future work, for example:
- deployment
- CI/CD
- notifications
- richer analytics

Do not present future ideas as implemented.

## Author

Zayd Kassimi

Portfolio:
https://zaydkassimi.me/

LinkedIn:
https://www.linkedin.com/in/zayd-kassimi/

GitHub:
https://github.com/zaydkassimi

Do not include personal email or phone number.

## License
Do NOT invent a license.
If there is no LICENSE file, simply omit this section.

STYLE:
- professional
- concise
- readable
- portfolio-quality
- no excessive emojis
- no exaggerated marketing claims
- clean markdown tables
- avoid giant walls of text

After creating README.md:

1. Run no persistent processes.
2. Check markdown content for accuracy against the repository.
3. git status
4. git diff -- README.md
5. Commit with:

docs: add comprehensive TaskFlow README

6. Push normally to origin main.

Do NOT force push.
Do NOT modify application code.
