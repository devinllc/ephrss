const admin_model = require("../model/admin_model");
const bcrypt = require('bcrypt');
const { generateToken } = require("../utils/generate_token");

module.exports.adminSignup = async (req, res) => {
    console.log(process.env.NODE_ENV);
    if (process.env.NODE_ENV === "development") {

        let admin = await admin_model.find();
        if (admin.length > 1) { return res.status(401).send("Dont have permission Policy Voilates"); }
        let { fullName, companyName, email, password } = req.body;
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) { return res.send(err.message) }
                else {
                    let createAdmin = await admin_model.create({
                        fullName,
                        email,
                        companyName,
                        password: hash,

                    });
                    let token = generateToken(createAdmin);

                    res.cookie("token", token)
                    res.status(201).send("User Create Successful");
                    console.log("admin create succesful");
                }
            });
        });
    }
};
module.exports.adminLogin=async(req,res)=>{
    let { email, password } = req.body;
    let admin = await admin_model.findOne({ email: email });
    if (!admin) return res.status(200).send("SOMETHING IS INCORRECT");
    bcrypt.compare(password, admin.password, (err, result) => {
        if (result) {
            let token = generateToken(admin);
            res.cookie('token', token);
            res.send("U Can Login")
        }
        else {
            return res.status(200).send("SOMETHING IS INCORRECT");
        }
    });
};

module.exports.adminLogout=async(req,res)=>{
    res.cookie("token", "");
    res.send("logout succesful");
}