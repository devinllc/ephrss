// dependencies
const express =require("express");
const app = express();
const cookieParser=require("cookie-parser");
const path = require("path");
const expressSession = require("express-session");
require("dotenv").config();


// express things
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(expressSession({
    resave:false,
    saveUninitialized:false,
    secret:process.env.EXPRESS_SESSION_SECRET,
}));
app.use(express.static(path.join(__dirname,"public")));

app.use("/user");
app.use("/admin");
app.listen(3000);

