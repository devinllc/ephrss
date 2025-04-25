const mongoose=require("mongoose");
const config = require("config");
const dbgr = require("debug")("development:mongoose");
console.log("Connecting to:", `${config.get("MONGODB_URI")}/${config.get("COLLECTION")}`);
mongoose.connect(`${config.get("MONGODB_URI")}/${config.get("COLLECTION")}`)
.then(()=>{
    dbgr("connected");
})
.catch((err)=>{
    dbgr(err);
});

module.exports=mongoose.connection;