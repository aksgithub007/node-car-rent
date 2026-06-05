const nodemailer = require("nodemailer")
const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{ 
        user:"aksgithub@gmail.com",
        pass:process.env.GOOGLE_APP_PASSWORD
      }
})  


module.exports = transporter;