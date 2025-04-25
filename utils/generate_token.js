const jwt =require("jsonwebtoken");
const generateToken=(createAdmin)=>{
    return  token= jwt.sign({email:createAdmin,id:createAdmin._id}, process.env.JWT_KEY);
}


module.exports.generateToken=generateToken;
