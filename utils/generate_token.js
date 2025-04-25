const jwt =require("jsonwebtoken");
const generateToken=(create)=>{
    return  token= jwt.sign({email:create.email,id:create._id}, process.env.JWT_KEY);
}
module.exports.generateToken=generateToken;
