// dependencies
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const path = require("path");
const expressSession = require("express-session");
const adminRouter = require("./routes/admin_router");
const employessRouter=require("./routes/employee_router");
require("dotenv").config();
const db = require("./config/mongoose_connection");
const admin_model = require("./model/admin_model");

// express things
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET,
}));
app.use(express.static(path.join(__dirname, "public")));
app.get("/",(req,res)=>{
    res.send("test vercel");
});
app.use("/employees", employessRouter);
app.use("/admin", adminRouter);
app.listen(3000);
