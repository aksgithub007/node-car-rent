const path = require("path")
const express = require('express');
const mongoose  = require("mongoose");
const bodyParser = require("body-parser")
const User = require("./model/User")
const Session = require("express-session")
const csrf = require('csurf');
const flash = require('connect-flash');
const MongoDBStore = require("connect-mongodb-session")(Session)
require('dotenv').config() 
const displayRouter = require("./routes/display")
const errorController = require("./controller/Error");
const authRouter = require("./routes/auth");
const transporter = require("./util/mailer")




const app = express();

const MongoDBUri = process.env.MONGODB_URI 

const store = new MongoDBStore({ uri: MongoDBUri, collection: 'sessions', expires:1000 * 60 * 60 * 1  });

app.set('trust proxy', 1) 


app.set('view engine', 'ejs');
app.set('views','views');


app.use(bodyParser.urlencoded({extended:false}))
app.use(express.static(path.join(__dirname, "public")))

app.use(Session({secret:"akshayshejwaltrupti", resave:false, saveUninitialized:false, store:store, cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
  }}))

app.use(async(req, res, next) => {
 try {
     if (req.session.isLoggedIn && req.session.user?._id){
        const user = await User.findById(req.session.user?._id)
        if(user){
            req.user = user
        }
     }else{
        req.session.isLoggedIn=false
        req.session.user = null
     }
 
 } catch (error) {
   console.log(error)
      
 }
    next()
})

app.use(csrf());
app.use(flash());

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.flashError = req.flash('error')[0] || null;
  res.locals.flashSuccess = req.flash('success')[0] || null;
  res.locals.path = req.path;
  next();
});


app.use("/", displayRouter)
app.use("/admin", authRouter)

app.use(errorController.get404Page)

app.use((err, req, res, next) => {
    let token = '';
  try { token = req.csrfToken(); } catch (_) {} 

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('500', {
      isLoggedIn: req.session?.isLoggedIn || false,
      isAdmin: req.session?.user?.role === 'admin' || false,
      statusCode: 403,
      message: 'Invalid form token. Please refresh and try again.',
      csrfToken: token
    })
  }
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  console.error(`[ERROR ${statusCode}]:`, message);

  res.status(statusCode).render("500", {
    isLoggedIn: req.session?.isLoggedIn || false,
    isAdmin: req.session?.user?.role === "admin" || false,
    statusCode,
    message,
    csrfToken: req.csrfToken(),
    path:"/500"
  });
});


mongoose.connect(MongoDBUri).then((result) => {
transporter.verify((error, success) => {
    if (error) console.error('Mailer error:', error)
    else console.log('Mailer ready')
  })
    app.listen(3000)
 
    console.log("Database connected successfully")
}).catch((err) => console.log(err))