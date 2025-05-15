// dependencies
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const path = require("path");
const expressSession = require("express-session");
const adminRouter = require("./routes/admin_router");
const employessRouter = require("./routes/employee_router");
const attendanceRouter = require("./routes/attendence_router");
const leaveRouter = require("./routes/leave_router");
const payroleRouter = require("./routes/payrole_router");
const taskRouter = require("./routes/task_routes");
const cors = require('cors');
const db = require("./config/mongoose_connection");
const admin_model = require("./model/admin_model");

require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// app.use(expressSession({
//     resave: false,
//     saveUninitialized: false,
//     secret: process.env.EXPRESS_SESSION_SECRET,
// }));



// Configure CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001','https://servs.ufdevs.me', 'http://localhost:5174', 'http://localhost:5173','https://servs.ufdevs.me/login','https://ufdevs.me'],
    credentials: true,  
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
}));

app.get("/", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "API is healthy",
        timestamp: new Date().toISOString(),
        project: {
            name: "EMPOWER HR",
            version: "1.0.0",
            description: "PRODUCTION READY SCALABLE EMPLOYEE MANAGEMENT SYSTEM HIGLY SECURE",
            by: "Ramesh Vishwakarma"
        },
        company: {
            name: "UNFILTER DEVELOPERS (ufdevs.me)",
            frontend: "https://servs.ufdevs.me",
            contact: "7666893227"
        }
    });
});

app.use("/employees", employessRouter);
app.use("/admin", adminRouter);
app.use("/attendence", attendanceRouter);
app.use("/leave", leaveRouter);
app.use("/payrole", payroleRouter);
app.use("/task", taskRouter);

// app.listen(3000);// ✅ Only start server if not on Vercel
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  }
module.exports = app;
