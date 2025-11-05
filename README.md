# ResolveIt - Professional Complaint Management System

## Overview
ResolveIt is a full-stack web application for managing complaints and grievances. The system allows citizens to submit complaints, administrators to manage them, and officers to work on resolving them.

## Tech Stack

### Backend
- **Framework**: Spring Boot 3.5.6
- **Language**: Java 17
- **Database**: MySQL
- **Security**: Spring Security with JWT authentication
- **Build Tool**: Maven

### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.12
- **UI**: Tailwind CSS
- **Routing**: React Router 7.9.4

## Project Structure

```
resolveit/
├── src/main/java/com/example/resolveit/    # Backend Java source code
│   ├── config/                              # Security configuration
│   ├── controller/                          # REST API endpoints
│   ├── model/                               # JPA entities
│   ├── repository/                          # Data access layer
│   ├── security/                            # JWT authentication
│   └── service/                             # Business logic
├── frontend/                                # React frontend
│   ├── src/
│   │   ├── components/ui/                   # Reusable UI components
│   │   ├── pages/                           # Page components
│   │   ├── services/                        # API service layer
│   │   └── styles/                          # CSS styles
│   └── package.json
├── pom.xml                                  # Maven dependencies
└── start.sh                                 # Startup script

```

## Features

1. **User Authentication**: JWT-based authentication with role-based access control
2. **Complaint Management**: Create, update, track, and resolve complaints
3. **Role-Based Access**:
   - Citizens: Submit and track complaints
   - Officers: Work on assigned complaints
   - Admins: Manage all complaints and users
4. **Anonymous Submissions**: Submit complaints without creating an account
5. **Status Tracking**: Track complaint status from submission to resolution
6. **Internal Notes**: Officers can add internal notes on complaints
7. **Public Updates**: Share updates with complaint submitters

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login

### Complaints
- `GET /api/complaints` - List all complaints
- `POST /api/complaints` - Create new complaint
- `GET /api/complaints/{id}` - Get complaint details
- `PUT /api/complaints/{id}` - Update complaint
- `POST /api/complaints/{id}/status` - Update status
- `POST /api/complaints/{id}/assign` - Assign to officer
- `POST /api/complaints/{id}/withdraw` - Withdraw complaint

### Notes & Updates
- `GET/POST /api/complaints/{id}/internal-notes` - Internal notes (staff only)
- `GET/POST /api/complaints/{id}/public-updates` - Public updates

## User Roles

1. **CITIZEN**: Submit and track own complaints
2. **OFFICER**: View assigned complaints, add updates and notes
3. **ADMIN**: Full access to all complaints and user management
