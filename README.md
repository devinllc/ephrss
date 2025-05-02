# EmpowerHR Backend API

## Overview
EmpowerHR is a complete HR management system backend API that provides employee management, attendance tracking, leave management, and payroll processing capabilities. This backend is built with Node.js, Express, and MongoDB with comprehensive role-based access control and subscription plans.
## Backend API is hosted at: https://ephrssbackend.vercel.app/  https://ephrssbackend.vercel.app
## Frontend is hosted at: clone the repo --
### Steps
#### open in code editor then 
``` cd frontend ```
#### again
``` cd empowerhr ```
#### install packages and dependencies
``` npm install ``` 
#### Run the Project
``` npm run dev ```
#### Access the Page and do Testing 
#### Email and Password same for user and admin i.e 
- email : ad@ts3.c 
- password : ad@ts3.c



## Development Setup

1. Clone the repository
```
git clone <repository-url>
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file with the following variables:
```
MONGODB_URI=<your-mongodb-uri>
DB_NAME=empowerhr
JWT_SECRET=<your-jwt-secret>
EXPRESS_SESSION_SECRET=<your-session-secret>
```

4. Start the development server
```
npm run test
```

5. Build for production
```
npm run build
```

## Frontend Integration

To build a frontend for this backend, you'll need to:

1. Use the API endpoints documented above
2. Handle JWT authentication tokens
3. Implement user interfaces for:
   - Login/Registration screens
   - Employee Dashboard
     - Attendance tracking (punch in/out)
     - Leave application
     - Payroll viewing
     - Profile management
   - Admin/HR Dashboard
     - Employee management
     - Attendance monitoring
     - Leave approval
     - Payroll processing
     - Subscription management
4. Implement location tracking for attendance
5. Add photo capture capability for attendance verification
6. Handle device detection and management for secure logins

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer
- Dayjs
- Cookie Parser
- Express-rate-limit
- Helmet
- Stripe
- cors
- config 
- dotenv
- Bcrypt for password hashing
- Socket.IO for real-time features
- Geolocation services for attendance
- Vite for React Frontend (Frontend has seperate Readme)

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Device locking for employees
- Role-based access control
- Rate limiting on API endpoints
- Secure cookie handling

## Deployment

The application is configured for deployment on Vercel with serverless functions and is optimized for MongoDB Atlas.

## Features

- **User Management**
  - Employee registration and management
  - Admin/HR roles and permissions
  - Authentication with JWT
  - Device-based login security (one device per employee)
  - Device reset capabilities for admins

- **Attendance Management**
  - Punch in/out system with timestamps
  - Geolocation tracking for attendance verification
  - Photo/selfie capture option for attendance verification
  - Attendance status tracking (present, half-day, absent, leave, etc.)
  - Working hours calculation

- **Leave Management**
  - Apply for different types of leaves
  - Approve/reject leave requests
  - Leave status tracking
  - Leave balance management

- **Payroll Management**
  - Automated salary calculation based on attendance and leaves
  - Support for allowances and deductions
  - Payroll approval workflow
  - Payment tracking

- **Role-based Access Control**
  - Admin, HR, and Employee role permissions
  - Different access levels for different roles
  - Plan-based feature restrictions (Basic, Pro, Enterprise)

- **Subscription Plans**
  - Basic plan: Limit of 10 employees
  - Pro plan: Limit of 25 employees
  - Enterprise plan: Unlimited employees
  - Feature restrictions based on plan type

## API Documentation (#API_Documentation.md)

## Author

Ramesh Vishwakarma (UFDevs)
