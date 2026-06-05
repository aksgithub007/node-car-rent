const nodemailer = require("nodemailer")
const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{ 
        user:"aksgithub@gmail.com",
        pass:"wlxb cgie pijr aaxc"
      }
})  


module.exports = transporter;