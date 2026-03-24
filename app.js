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
const projectRouter = require("./routes/project_router");
const deviceLoginRouter = require("./routes/device_login_router");
const performanceRouter = require("./routes/performance_router");
const subscriptionRouter = require("./routes/subscription_router");
const insightsRouter = require("./routes/insights_router");
const cors = require('cors');
const db = require("./config/mongoose_connection");
const admin_model = require("./model/admin_model");

require("dotenv").config();
// Initialize Agenda jobs
const { generatePerformanceJob } = require("./jobs/performance_job");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serverless Cron Endpoint
app.get("/api/cron/performance", async (req, res) => {
    try {
        await generatePerformanceJob();
        res.status(200).json({ status: "success", message: "Daily performance successfully executed." });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});
app.use(express.static(path.join(__dirname, "public")));
// app.use(expressSession({
//     resave: false,
//     saveUninitialized: false,
//     secret: process.env.EXPRESS_SESSION_SECRET,
// }));



// Configure CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://servs.ufdevs.me', 'http://localhost:5174', 'http://localhost:5173', 'https://servs.ufdevs.me/login', 'https://ufdevs.me', 'https://ephrssfrontend.vercel.app'],
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
app.use("/projects", projectRouter);
app.use("/task", taskRouter);
app.use("/saved-logins", deviceLoginRouter);
app.use("/performance", performanceRouter);
const fieldRouter = require("./routes/field_router");
app.use("/field", fieldRouter);
app.use("/subscription", subscriptionRouter);
// 🔗 NEW: SaaS & AI Modules Expansion
app.use("/alerts", require("./routes/alert_router"));
app.use("/manager", require("./routes/manager_router"));
app.use("/actions", require("./routes/ai_action_router"));
app.use("/activity", require("./routes/activity_audit_router")); // Handles Live Events + Audits
app.use("/system", require("./routes/system_router")); // Handles System Integrations, AI, Billing, Privacy
app.use("/insights", insightsRouter); // Restored: auto-performance + task insights

// app.listen(3000);// ✅ Only start server if not on Vercel
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}
module.exports = app;
