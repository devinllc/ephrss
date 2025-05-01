# EmpowerHR API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Employee Management](#employee-management)
3. [Attendance Management](#attendance-management)
4. [Leave Management](#leave-management)
5. [Payroll Management](#payroll-management)
6. [Field Employee Tracking](#field-employee-tracking)
7. [Data Models](#data-models)
8. [Error Handling](#error-handling)
Backend API is hosted at: https://ephrssbackend.vercel.app
## Authentication

### Admin Authentication

#### 1. Admin Signup
```http
POST /admin/signup
```
**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "companyName": "Acme Inc",
  "contactNumber": "+1234567890",
  "gstin": "22AAAAA0000A1Z5"
}
```
**Response Success (201):**
```json
{
  "message": "Admin created successfully",
  "admin": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "companyName": "Acme Inc",
    "_id": "60d21b4667d0d8992e610c85"
  }
}
```

#### 2. Admin Login
```http
POST /admin/login
```
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123",
}
```
**Response Success (200):**
```json
{
  "message": "Login successful",
  "token": "jwt-token-string",
  "admin": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

#### 3. Admin Logout
```http
GET /admin/logout
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response Success (200):**
```json
{
  "message": "Logged out successfully"
}
```

#### 4. Reset Device ID
```http
PATCH /admin/:id/reset-device
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response Success (200):**
```json
{
  "message": "Device ID reset successfully",
  "admin": {
    "deviceId": null
  }
}
```

## Employee Management

### 1. Create Employee only restrected to admin so it will be part of admin dashbord only not of user 
```http
POST /employee/create
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securePassword123",
  "phone": "+1234567890",
  "role": "employee",
  "dob": "1990-01-01",
  "gender": "female",
  "department": "Engineering",
  "employmentType": "full-time",
  "address": "123 Main St, City",
  "emergencyContact": "+1987654321",
  "salary": 50000,
  "bankDetails": {
    "accountNumber": "1234567890",
    "ifsc": "ABCD0123456"
  }
}
```
**Response Success (201):**
```json
{
  "message": "User created successful",
  "token": "jwt-token-string"
}
```

### 2. Employee Login
```http
POST /employee/login
```
**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "securePassword123",
  "deviceId": "unique-device-identifier"
}
```
**Response Success (201):**
```json
{
  "message": "User login successfully",
  "token": "jwt-token-string"
}
```

### 3. Employee Logout
```http
GET /employee/logout
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response Success (200):**
```json
{
  "message": "Logout successful"
}
```

### 4. Get All Employees only restrected to admin so it will be part of admin dashbord only not of user 
```http
GET /employee/all
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response Success (200):**
```json
{
  "employees": [
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "department": "Engineering",
      "status": "active",
      "employmentType": "full-time",
      "_id": "60d21b4667d0d8992e610c85"
    }
  ]
}
```

## Attendance Management

### Employee Attendance

#### 1. Punch In
```http
POST /attendance/punch-in
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "lat": 12.9716,
  "lng": 77.5946,
  "photoUrl": "https://example.com/selfie.jpg",
  "deviceId": "unique-device-identifier"
}
```
**Response Success (201):**
```json
{
  "message": "Punch in successful",
  "attendance": {
    "date": "2023-08-31T00:00:00.000Z",
    "punchIn": {
      "time": "2023-08-31T09:00:00.000Z",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946
      },
      "photoUrl": "https://example.com/selfie.jpg"
    },
    "status": "present"
  }
}
```

#### 2. Punch Out
```http
POST /attendance/punch-out
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "lat": 12.9716,
  "lng": 77.5946,
  "photoUrl": "https://example.com/selfie-out.jpg"
}
```
**Response Success (200):**
```json
{
  "message": "Punch out successful",
  "attendance": {
    "date": "2023-08-31T00:00:00.000Z",
    "punchIn": {
      "time": "2023-08-31T09:00:00.000Z",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946
      }
    },
    "punchOut": {
      "time": "2023-08-31T18:00:00.000Z",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946
      }
    },
    "totalHours": 9,
    "status": "present"
  }
}
```

#### 3. Get Attendance Status
```http
GET /attendance/status
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response Success (200):**
```json
{
  "message": "Attendance details fetched successfully",
  "attendance": {
    "date": "2023-08-31T00:00:00.000Z",
    "punchIn": {
      "time": "2023-08-31T09:00:00.000Z",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946
      }
    },
    "punchOut": {
      "time": "2023-08-31T18:00:00.000Z",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946
      }
    },
    "totalHours": 9,
    "status": "present",
    "verified": false,
    "subscriptionFeatures": {
      "locationTracking": true,
      "photoRequired": true
    }
  }
}
```

### Admin Attendance Management

#### 1. Verify Attendance
```http
PATCH /attendance/:id/verify
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "status": "present"
}
```
**Response Success (200):**
```json
{
  "message": "Attendance verified successfully",
  "attendance": {
    "date": "2023-08-31T00:00:00.000Z",
    "status": "present",
    "verified": true
  }
}
```

## Leave Management

### Employee Leave Management

#### 1. Apply for Leave
```http
POST /leave/apply
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "fromDate": "2023-09-10T00:00:00.000Z",
  "toDate": "2023-09-12T00:00:00.000Z",
  "reason": "Family vacation",
  "type": "casual"
}
```
**Response Success (201):**
```json
{
  "message": "Leave application submitted successfully",
  "leave": {
    "employee": "60d21b4667d0d8992e610c85",
    "fromDate": "2023-09-10T00:00:00.000Z",
    "toDate": "2023-09-12T00:00:00.000Z",
    "reason": "Family vacation",
    "type": "casual",
    "status": "pending",
    "appliedAt": "2023-08-31T10:00:00.000Z"
  }
}
```

#### 2. View Leave Requests (Employee)
```http
GET /leave/requests
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response Success (200):**
```json
{
  "message": "Leave requests fetched successfully",
  "leaveRequests": [
    {
      "employee": {
        "fullName": "Jane Smith",
        "email": "jane@example.com"
      },
      "fromDate": "2023-09-10T00:00:00.000Z",
      "toDate": "2023-09-12T00:00:00.000Z",
      "reason": "Family vacation",
      "type": "casual",
      "status": "pending",
      "appliedAt": "2023-08-31T10:00:00.000Z"
    }
  ]
}
```

### Admin Leave Management

#### 1. Approve or Reject Leave
```http
POST /leave/approve-reject
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "leaveId": "60d21b4667d0d8992e610c85",
  "status": "approved"
}
```
**Response Success (200):**
```json
{
  "message": "Leave approved successfully",
  "leave": {
    "employee": "60d21b4667d0d8992e610c85",
    "fromDate": "2023-09-10T00:00:00.000Z",
    "toDate": "2023-09-12T00:00:00.000Z",
    "reason": "Family vacation",
    "type": "casual",
    "status": "approved",
    "approvedBy": "60d21b4667d0d8992e610c86",
    "appliedAt": "2023-08-31T10:00:00.000Z"
  }
}
```

#### 2. Cancel Leave
```http
POST /leave/cancel
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "leaveId": "60d21b4667d0d8992e610c85"
}
```
**Response Success (200):**
```json
{
  "message": "Leave request cancelled successfully",
  "leave": {
    "employee": "60d21b4667d0d8992e610c85",
    "fromDate": "2023-09-10T00:00:00.000Z",
    "toDate": "2023-09-12T00:00:00.000Z",
    "reason": "Family vacation",
    "type": "casual",
    "status": "cancelled",
    "approvedBy": "60d21b4667d0d8992e610c86",
    "appliedAt": "2023-08-31T10:00:00.000Z"
  }
}
```

## Payroll Management

### Admin Payroll Management

#### 1. Generate Payroll
```http
POST /payroll/generate
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "employeeId": "60d21b4667d0d8992e610c85",
  "month": 8,
  "year": 2023,
  "totalWorkingDays": 22,
  "basicSalary": 50000,
  "allowances": [
    {
      "type": "HRA",
      "amount": 5000
    },
    {
      "type": "Transport",
      "amount": 3000
    }
  ],
  "deductions": [
    {
      "type": "PF",
      "amount": 1800
    },
    {
      "type": "Tax",
      "amount": 2500
    }
  ]
}
```
**Response Success (201):**
```json
{
  "message": "Payroll generated successfully",
  "payroll": {
    "employee": "60d21b4667d0d8992e610c85",
    "month": 8,
    "year": 2023,
    "totalWorkingDays": 22,
    "daysPresent": 20,
    "daysLeaveApproved": 1,
    "basicSalary": 50000,
    "allowances": [
      {
        "type": "HRA",
        "amount": 5000
      },
      {
        "type": "Transport",
        "amount": 3000
      }
    ],
    "deductions": [
      {
        "type": "PF",
        "amount": 1800
      },
      {
        "type": "Tax",
        "amount": 2500
      }
    ],
    "grossSalary": 57500,
    "totalDeductions": 4300,
    "netSalary": 53200,
    "status": "pending"
  }
}
```

#### 2. Approve Payroll
```http
PATCH /payroll/approve
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "payrollId": "60d21b4667d0d8992e610c85"
}
```
**Response Success (200):**
```json
{
  "message": "Payroll approved successfully",
  "payroll": {
    "employee": "60d21b4667d0d8992e610c85",
    "month": 8,
    "year": 2023,
    "status": "approved",
    "approvedBy": "60d21b4667d0d8992e610c86",
    "paymentDate": "2023-08-31T15:30:00.000Z"
  }
}
```

### Employee Payroll Access

#### 1. Get Payroll Status
```http
GET /payroll/status
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response Success (200):**
```json
{
  "payrolls": [
    {
      "employee": "60d21b4667d0d8992e610c85",
      "month": 8,
      "year": 2023,
      "totalWorkingDays": 22,
      "daysPresent": 20,
      "daysLeaveApproved": 1,
      "basicSalary": 50000,
      "allowances": [
        {
          "type": "HRA",
          "amount": 5000
        },
        {
          "type": "Transport",
          "amount": 3000
        }
      ],
      "deductions": [
        {
          "type": "PF",
          "amount": 1800
        },
        {
          "type": "Tax",
          "amount": 2500
        }
      ],
      "grossSalary": 57500,
      "totalDeductions": 4300,
      "netSalary": 53200,
      "status": "approved",
      "approvedBy": "60d21b4667d0d8992e610c86",
      "paymentDate": "2023-08-31T15:30:00.000Z"
    }
  ]
}
```

## Field Employee Tracking

### 1. Update Location (For Field Employees)
```http
POST /field/update-location
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "accuracy": 10,
  "speed": 5,
  "batteryLevel": 85,
  "isCharging": false
}
```
**Response Success (200):**
```json
{
  "message": "Location updated successfully",
  "isInsideAllowedZone": true
}
```

### 2. Get Employee Location History (Admin)
```http
GET /field/:employeeId/history
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Query Parameters:**
```
date=2023-08-31
```
**Response Success (200):**
```json
{
  "employeeLocation": {
    "employeeId": "60d21b4667d0d8992e610c85",
    "date": "2023-08-31",
    "latestLocation": {
      "latitude": 12.9716,
      "longitude": 77.5946,
      "timestamp": "2023-08-31T15:30:00.000Z",
      "accuracy": 10,
      "speed": 5,
      "batteryLevel": 85,
      "isCharging": false
    },
    "locationHistory": [
      {
        "latitude": 12.9716,
        "longitude": 77.5946,
        "timestamp": "2023-08-31T09:00:00.000Z"
      },
      {
        "latitude": 12.9746,
        "longitude": 77.5926,
        "timestamp": "2023-08-31T12:30:00.000Z"
      },
      {
        "latitude": 12.9716,
        "longitude": 77.5946,
        "timestamp": "2023-08-31T15:30:00.000Z"
      }
    ],
    "isInsideAllowedZone": true
  }
}
```

## Data Models

### Admin Model
```javascript
{
  fullName: String,       // Name of the admin
  email: String,          // Email address (unique)
  password: String,       // Hashed password
  plan: String,           // Subscription plan: "basic", "pro", "enterprise"
  role: String,           // Default: "admin"
  gstin: String,          // GST Identification Number
  companyName: String,    // Company name
  totalEmployees: Number, // Number of employees
  picture: String,        // Profile picture URL
  contactNumber: String,  // Contact phone number
  address: {              // Company address
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  isVerified: Boolean,    // Email verification status
  lastLogin: Date,        // Last login timestamp
  location: {             // Office location for geofencing
    latitude: Number,
    longitude: Number,
    radiusInMeters: Number // Default: 300
  },
  subscription: {         // Subscription details
    status: String,       // "active", "inactive", "cancelled", "trial"
    expiresAt: Date       // Subscription expiry date
  }
}
```

### Employee Model
```javascript
{
  name: String,           // Employee name
  password: String,       // Hashed password
  email: String,          // Email address (unique)
  phone: String,          // Contact phone number
  role: String,           // Default: "employee"
  dob: Date,              // Date of birth
  gender: String,         // "male", "female", "other"
  department: String,     // Department name
  employmentType: String, // "full-time", "part-time", "contract", "intern", "field"
  address: String,        // Residential address
  emergencyContact: String, // Emergency contact number
  joiningDate: Date,      // Date of joining
  salary: Number,         // Base salary
  bankDetails: {          // Bank account details
    accountNumber: String,
    ifsc: String
  },
  picture: String,        // Profile picture URL
  status: String,         // "active", "inactive", "terminated", "on-leave"
  deviceId: String,       // Device identifier for login security
  isLocked: Boolean,      // Account lock status
  adminId: ObjectId,      // Reference to admin who owns this employee
  createdBy: ObjectId     // Reference to admin who created this employee
}
```

### Attendance Model
```javascript
{
  employee: ObjectId,     // Reference to employee
  date: Date,             // Date of attendance
  punchIn: {              // Punch-in details
    time: Date,           // Punch-in time
    location: {           // Location at punch-in
      lat: Number,
      lng: Number
    },
    photoUrl: String      // Selfie URL (optional)
  },
  punchOut: {             // Punch-out details
    time: Date,           // Punch-out time
    location: {           // Location at punch-out
      lat: Number,
      lng: Number
    },
    photoUrl: String      // Selfie URL (optional)
  },
  totalHours: Number,     // Total hours worked
  status: String,         // "present", "half-day", "absent", "leave", "weekend", "holiday"
  verified: Boolean,      // Verification status by HR/admin
  subscriptionFeatures: { // Features enabled based on subscription
    locationTracking: Boolean,
    photoRequired: Boolean
  }
}
```

### Leave Model
```javascript
{
  employee: ObjectId,     // Reference to employee
  fromDate: Date,         // Leave start date
  toDate: Date,           // Leave end date
  reason: String,         // Reason for leave
  type: String,           // "sick", "casual", "earned", "unpaid"
  status: String,         // "pending", "approved", "rejected", "cancelled"
  approvedBy: ObjectId,   // Reference to admin who processed the leave
  appliedAt: Date         // Application timestamp
}
```

### Payroll Model
```javascript
{
  employee: ObjectId,     // Reference to employee
  month: Number,          // Month (1-12)
  year: Number,           // Year
  totalWorkingDays: Number, // Total working days in month
  daysPresent: Number,    // Days employee was present
  daysLeaveApproved: Number, // Days of approved leave
  basicSalary: Number,    // Base salary
  allowances: [           // Additional allowances
    {
      type: String,       // Allowance type (e.g., HRA, Travel)
      amount: Number      // Allowance amount
    }
  ],
  deductions: [           // Salary deductions
    {
      type: String,       // Deduction type (e.g., PF, Tax)
      amount: Number      // Deduction amount
    }
  ],
  grossSalary: Number,    // Basic + Allowances
  totalDeductions: Number, // Sum of all deductions
  netSalary: Number,      // Gross - Deductions
  status: String,         // "pending", "approved", "rejected"
  approvedBy: ObjectId,   // Reference to admin who approved
  paymentDate: Date       // Date of payment
}
```

### Field Employee Location Model
```javascript
{
  employeeId: ObjectId,   // Reference to employee
  date: String,           // Date in YYYY-MM-DD format
  latestLocation: {       // Most recent location
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    accuracy: Number,
    speed: Number,
    batteryLevel: Number,
    isCharging: Boolean
  },
  locationHistory: [      // Location tracking throughout the day
    {
      latitude: Number,
      longitude: Number,
      timestamp: Date
    }
  ],
  isInsideAllowedZone: Boolean // Whether employee is within geofence
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 402: Payment Required
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

Each error response includes a message explaining the error:
```json
{
  "message": "Error description"
}
```

## Sample API Use Cases

### Complete Employee Workflow

1. **Admin creates employee account**
   ```http
   POST /employee/create
   ```

2. **Employee logs in with device ID**
   ```http
   POST /employee/login
   ```

3. **Employee punches in for the day**
   ```http
   POST /attendance/punch-in
   ```

4. **Employee applies for leave**
   ```http
   POST /leave/apply
   ```

5. **Admin approves leave request**
   ```http
   POST /leave/approve-reject
   ```

6. **Employee punches out at end of day**
   ```http
   POST /attendance/punch-out
   ```

7. **Admin generates monthly payroll**
   ```http
   POST /payroll/generate
   ```

8. **Admin approves payroll**
   ```http
   PATCH /payroll/approve
   ```

9. **Employee views their payroll details**
   ```http
   GET /payroll/status
   ```

### Field Employee Tracking

1. **Field employee logs in**
   ```http
   POST /employee/login
   ```

2. **Field employee updates location periodically**
   ```http
   POST /field/update-location
   ```

3. **Admin views field employee movement**
   ```http
   GET /field/:employeeId/history
   ```

4. **Field employee punches out**
   ```http
   POST /attendance/punch-out
   ``` 