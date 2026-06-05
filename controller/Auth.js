const User = require("../model/User")
const Car = require("../model/Cars")
const bcrypt = require("bcrypt")
const crypto = require('crypto');
const transporter = require('../util/mailes');
const UserEmailId = "aksgithub@gmail.com";


const randomBytes = require('util').promisify(crypto.randomBytes);


     

exports.getSignIn = (req, res, next) => {
    res.render("signin",{
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: req.session.user && req.session.user.role === 'admin',
        csrfToken: req.csrfToken(),
       
    })
}

exports.getSignUp = (req, res, next) => {
    res.render("signup",{
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: req.session.user && req.session.user.role === 'admin',
        csrfToken: req.csrfToken(),
        
    })
}

exports.getResetPassword = (req, res, next) => {
    res.render("forgot-password",{
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: req.session.user && req.session.user.role === 'admin',
        csrfToken: req.csrfToken(),
    })
}

exports.getAddCar = (req, res, next) => {
    res.render("addcar",{
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: req.session.user && req.session.user.role === 'admin',
        isEdit:false,
        csrfToken: req.csrfToken(),
      
    })
}

exports.postSignIn = async(req, res, next) => {
 try {
        const email = req.body.email
    const password = req.body.password

    const user = await User.findOne({email:email}).lean()
    if(!user){
        req.flash("error", "User is not yet created please create one")
        throw new Error("User is not yet created please create one")
    }
    const validPassword = await bcrypt.compare(password, user.password)
     if(!validPassword){
        req.flash("error", "Password is not valid please check it")
        throw new Error("Password is not valid please check it")
     }     
        req.session.isLoggedIn = true
        req.session.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }
        req.session.save((err) => {
                if (err) {
                   next(err)
                }  
                req.flash("success", "You have successfully logged in")
                res.redirect("/")
        }) 
        
 } catch (error) {
    next(error)
 }
}
exports.postSignUp = async(req, res, next) => {
   try {
    const name = req.body.name
   const role = req.body.role
   const email = req.body.email
   const password = req.body.password

   const existingUser = await User.findOne({email:email})

   if(existingUser){
    req.flash("error", "User already exist with this email id")
    throw new Error("User Already Exist")
   }
   
   const salt = await bcrypt.genSalt(10)
   const hashedPassword = await bcrypt.hash(password, salt)
   const result = await User.create({name:name, email:email, password:hashedPassword, role:role})
   if(result){
    req.flash("success", "User created successfully")
    res.redirect("/admin/signin")
   }
   } catch (error) {
    next(error)
   }
}

exports.postResetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error", "User is not registered with this email id");
      throw new Error("User is not registered with this email id");
    }
    const buffer = await randomBytes(32);
    const token = buffer.toString('hex');

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();
    await transporter.emails.send({
         from: 'DriveElite <onboarding@resend.dev>',
        to:email,
        subject:"Reset Password Link",
        html:
        `
          <h2>Password Reset</h2>
          <p>Click the link below to reset your password.</p>
          <p>This link expires in <strong>1 hour</strong>.</p>
          <a href="http://localhost:3000/admin/reset/${token}">
            Reset Password
          </a>
          <p>If you didn't request this, ignore this email.</p>
        `
    })
    req.flash("success", "Password reset link has been sent to your email")
    res.redirect("/admin/signin")

  } catch (error) {
   
    next(error);
  }
} 

exports.getResetNewPassword = async(req, res, next) => {
   try{
     const tokenId = req.params.tokenId
     const user = await User.findOne({resetToken:tokenId,  resetTokenExpiry:{$gt:Date.now()}})
     if(!user){
        req.flash("error", "Invalid or expired token")
        throw new Error("Invalid or expired token")
     }
    res.render('new-password', { userId: user._id.toString(), token: tokenId, csrfToken: req.csrfToken() });
   }catch(error){
    next(error)
   }

}

exports.updatePassword = async (req, res, next) => {
  try {
    console.log(req.body)
    const { newPassword, token, userId, confirmPassword } = req.body;

    // Validate passwords
    if (newPassword !== confirmPassword) {
      req.flash("error", "Passwords do not match")
      throw new Error("Passwords do not match");
    }

    // Find valid user with token and expiry
    const user = await User.findOne({
      _id: userId,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Invalid or expired reset token")
      throw new Error("Invalid or expired reset token");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;

    // Clear reset fields
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();
    req.flash("success", "Password updated successfully");
    res.redirect("/admin/signin");

  } catch (error) {
    
    next(error);
  }
};

exports.postSignOut = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
           next(err)
        } else {
            res.redirect("/admin/signin")
        }         
    })
} 

exports.postAddCar = async(req, res, next) => {
  try {
     const category = req.body.category
     const name = req.body.carName
     const brand = req.body.brandName
     const seatCapacity = Number(req.body.seatCapacity)
     const transmission = req.body.transmission
     const fuelType = req.body.fuelType
     const rentalPrice = Number(req.body.rentPerDay)
     const imageUrl = req.body.imageUrl
     
     
     const user = await User.findById(req.session.user._id)
    //  console.log(user)
     if(!user){
        req.flash("error", "User not valid to add new car")
      throw new Error("User not valid to add new car")
     }
     const userId = req.session.user._id
     
    await Car.create({category:category, name:name, brand:brand, seatCapacity:seatCapacity,transmission:transmission,fuelType:fuelType, rentalPrice:rentalPrice, imageUrl:imageUrl,userId:userId })
     
    req.flash("success", "Car added successfully")
    res.redirect("/admin/cars")
     
      

  } catch (error) {
   next(error)
  }
}

exports.getAdminCars = async(req, res, next) => {
  try {
    const cars = await Car.find().lean()    
    res.render('adminCars', {
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: req.session.user && req.session.user.role === 'admin',
        cars: cars,
       
    })
  } catch (error) {
   next(error)
  }     
}

exports.postDeleteCar = async(req, res, next) => {
  try {
    const carId = req.params.carId
    // console.log(carId)
    await Car.findByIdAndDelete(carId)
    res.redirect("/admin/cars")
  } catch (error) {
    next(error)
  }
}

exports.postEditCar = async(req, res, next) => {
try {
  const carId = req.body.carId
  const car = await Car.findById(carId).lean()
  res.render('addcar', {
    isLoggedIn:req.session.isLoggedIn,
    isAdmin:req.session.user && req.session.user.role === "admin",
    isEdit:true,
    car:car,
    csrfToken: req.csrfToken(),
   
  })
} catch (error) {
  next(error)
}
}

exports.updateEditCar = async(req, res, next) => {
  try {
    const carId = req.body.carId
    const car = await Car.findById(carId)
    if(!car){
      throw new Error("Car not exist")
    }
     const category = req.body.category
     const name = req.body.carName
     const brand = req.body.brandName
     const seatCapacity = Number(req.body.seatCapacity)
     const transmission = req.body.transmission
     const fuelType = req.body.fuelType
     const rentalPrice = Number(req.body.rentPerDay)
     const imageUrl = req.body.imageUrl
     await Car.findByIdAndUpdate(carId, {category:category, name:name, brand:brand, seatCapacity:seatCapacity,transmission:transmission,fuelType:fuelType, rentalPrice:rentalPrice, imageUrl:imageUrl})
     req.flash("success", "Car updated successfully")
     res.redirect("/admin/cars")
  } catch (error) {
    next(error)
  }
}