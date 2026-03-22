const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
    await mongoose.connect(process.env.MONGODB_URI + process.env.DB_NAME);
    const Admin = require('./model/admin_model');
    try {
        await Admin.collection.dropIndex('phone_1');
        console.log("Successfully dropped phone_1 index.");
    } catch (e) {
        console.log("Error dropping phone_1 index:", e.message);
    }
    const admins = await Admin.find({});
    console.log("Current admins in DB:", admins.length, admins.map(a => a.email));
    
    // Also drop phone_1 index on employees if exists
    const Employee = require('./model/employee_model');
    try {
        await Employee.collection.dropIndex('phone_1');
    } catch (e) {}
    
    mongoose.disconnect();
}
main();
