const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;
    let connectStr;
    if (uri.includes('?')) {
        const parts = uri.split('?');
        connectStr = `${parts[0]}${dbName}?${parts[1]}`;
    } else {
        connectStr = `${uri}/${dbName}`;
    }
    console.log("Connecting to:", connectStr);
    
    await mongoose.connect(connectStr);
    const Admin = require('./model/admin_model');
    const Employee = require('./model/employee_model');
    
    try {
        await mongoose.connection.collection('admins').dropIndex('phone_1');
        console.log("Successfully dropped phone_1 index from admins.");
    } catch (e) {
        console.log("Error dropping phone_1 index admins:", e.message);
    }
    
    try {
        await mongoose.connection.collection('employeesses').dropIndex('phone_1');
        console.log("Successfully dropped phone_1 index from employees.");
    } catch (e) {
        console.log("Error dropping phone_1 index employees:", e.message);
    }
    
    const admins = await Admin.find({});
    console.log("Admins in DB:", admins.length);
    admins.forEach(a => console.log(a.email));
    
    mongoose.disconnect();
}

main().catch(console.dir);
