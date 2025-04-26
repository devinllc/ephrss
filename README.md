# EmpowerHR Backend API

## Overview
EmpowerHR is a complete HR management system backend API that provides employee management, attendance tracking, leave management, and payroll processing capabilities. This backend is built with Node.js, Express, and MongoDB with comprehensive role-based access control and subscription plans.

Backend API is hosted at: https://ephrssbackend.vercel.app

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

## API Documentation

### Authentication

#### Admin Registration
```
POST /admin/register
```
Request body:
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "password",
  "phone": "1234567890"
}
```

#### Admin Login
```
POST /admin/login
```
Request body:
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

#### Employee Login
```
POST /employees/login
```
Request body:
```json
{
  "email": "employee@example.com",
  "password": "password",
  "deviceId": "unique-device-id"
}
```

#### Logout
```
GET /employees/logout
```

### Employee Management

#### Create Employee
```
POST /employees/create
```
Request body:
```json
{
  "name": "Employee Name",
  "email": "employee@example.com",
  "password": "password",
  "phone": "1234567890",
  "role": "employee",
  "department": "Engineering",
  "employmentType": "full-time",
  "address": "123 Main St",
  "salary": 50000
}
```

#### Get All Employees
```
GET /employees/all
```

#### Reset Employee Device
```
POST /admin/reset-device
```
Request body:
```json
{
  "employeeId": "employee-id"
}
```

### Attendance Management

#### Punch In
```
POST /attendence/punch-in
```
Request body:
```json
{
  "lat": 12.9716,
  "lng": 77.5946,
  "photoUrl": "optional-selfie-url",
  "deviceId": "device-id"
}
```

#### Punch Out
```
POST /attendence/punch-out
```
Request body:
```json
{
  "lat": 12.9716,
  "lng": 77.5946,
  "photoUrl": "optional-selfie-url"
}
```

#### Get Today's Attendance
```
GET /attendence/today
```

### Leave Management

#### Apply for Leave
```
POST /leave/apply
```
Request body:
```json
{
  "fromDate": "2023-07-01",
  "toDate": "2023-07-03",
  "reason": "Family function",
  "type": "casual"
}
```

#### Approve/Reject Leave
```
POST /leave/approve
```
Request body:
```json
{
  "leaveId": "leave-id",
  "status": "approved"
}
```

#### Cancel Leave
```
POST /leave/cancel
```
Request body:
```json
{
  "leaveId": "leave-id"
}
```

#### View Leave Requests
```
GET /leave/requests
```

### Payroll Management

#### Generate Payroll
```
POST /payrole/generate
```
Request body:
```json
{
  "employeeId": "employee-id",
  "month": 7,
  "year": 2023,
  "totalWorkingDays": 22,
  "basicSalary": 50000,
  "allowances": [
    {"type": "HRA", "amount": 5000},
    {"type": "Travel", "amount": 2000}
  ],
  "deductions": [
    {"type": "PF", "amount": 1800},
    {"type": "Tax", "amount": 2500}
  ]
}
```

#### Approve Payroll
```
POST /payrole/approve
```
Request body:
```json
{
  "payrollId": "payroll-id"
}
```

#### View Payroll
```
GET /payrole/view
```

## Data Models

### Admin
- Name
- Email
- Password
- Phone
- Subscription Plan
- Features Enabled

### Employee
- Name
- Email
- Password
- Phone
- Role (employee, hr)
- Department
- Employment Type (full-time, part-time, contract, intern, field)
- Address
- Emergency Contact
- Joining Date
- Salary
- Bank Details
- Picture
- Status (active, inactive, terminated, on-leave)
- Device Information
- Admin ID (relationship)

### Attendance
- Employee ID
- Date
- Punch-in Time
- Punch-in Location (lat/lng)
- Punch-in Photo URL
- Punch-out Time
- Punch-out Location (lat/lng)
- Punch-out Photo URL
- Total Hours
- Status (present, half-day, absent, leave, weekend, holiday)
- Verification Status

### Leave
- Employee ID
- From Date
- To Date
- Reason
- Type (casual, sick, personal, etc.)
- Status (pending, approved, rejected, cancelled)
- Approved By

### Payroll
- Employee ID
- Month/Year
- Total Working Days
- Days Present
- Days Leave Approved
- Basic Salary
- Allowances (array of type and amount)
- Deductions (array of type and amount)
- Gross Salary
- Total Deductions
- Net Salary
- Status (pending, approved, rejected)
- Approved By
- Payment Date

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
- Bcrypt for password hashing
- Socket.IO for real-time features
- Geolocation services for attendance

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Device locking for employees
- Role-based access control
- Rate limiting on API endpoints
- Secure cookie handling

## Deployment

The application is configured for deployment on Vercel with serverless functions and is optimized for MongoDB Atlas.

## Author

Ramesh Vishwakarma 