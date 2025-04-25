const mongoose = require("mongoose");
const config = require("config");
const dbgr = require("debug")("development:mongoose");

const mongoUri = `${config.get("MONGODB_URI")}/${config.get("DB_NAME")}`;

console.log("Connecting to:", mongoUri);

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    dbgr("MongoDB connected successfully.");
})
.catch((err) => {
    dbgr("MongoDB connection error:", err);
});

module.exports = mongoose.connection;
