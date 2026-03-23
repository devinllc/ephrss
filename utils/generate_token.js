const jwt =require("jsonwebtoken");
const generateToken=(create)=>{
    return jwt.sign({email:create.email,id:create._id,role:create.role}, process.env.JWT_KEY);
}
module.exports.generateToken=generateToken;
