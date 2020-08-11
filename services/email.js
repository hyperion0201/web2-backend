const nodemailer = require('nodemailer');

console.log('email : ', process.env.EMAIL_USERNAME);
console.log('pass : ', process.env.EMAIL_PASSWORD);
async function send(to, subject, content){
    console.log('')
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        }
    });

    return transporter.sendMail({
        from: process.env.EMAIL_USERNAME,
        to,
        subject,
        text: content,
    });
}

module.exports = send;


//ltweb353@gmail.com
//abcd1234$%