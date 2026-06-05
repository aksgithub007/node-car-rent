const Car = require('../model/Cars')
const User = require('../model/User')
const crypto   = require("crypto");
const razorpay = require("../util/razorpay");
// const transporter = require("../util/mailer")

exports.getAllCars = (req, res, next) => {
    res.render('index', {
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: req.session.user && req.session.user.role === 'admin',
    })
}
exports.getAbout = (req, res, next) => {
    res.render('about', {
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: req.session.user && req.session.user.role === 'admin',
    })
}

exports.getAllCars = async(req, res, next) => {
 try {
    const cars = await Car.find().lean()    
    res.render('cars', {
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: req.session.user && req.session.user.role === 'admin',
        cars: cars,
       
    })
  } catch (error) {
   next(error)
  } 
}

exports.getCarDetails = async(req, res, next) => {
  try {
    const carId = req.params.carId  
    const car = await Car.findById(carId).lean()
    if(!car){
      throw new Error("Car not found")
    }   
    res.render('bookcar', {
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: req.session.user && req.session.user.role === 'admin',
        car: car,   
    }) 
} catch (error) {
   next(error)
  }     
}

// exports.createBooking = async(req, res, next) => {
//   try {
//     const carId = req.body.carId    
//     const pickupDate = new Date(req.body.pickupDate)
//     const dropoffDate = new Date(req.body.dropoffDate)
//     const totalDays = Math.ceil((dropoffDate - pickupDate) / (1000 * 60 * 60 * 24))
//     const car = await Car.findById(carId).lean()
//     if(!car){
//         req.flash("error", "Car not found")
//     //   throw new Error("Car not found")
//     }       
//     const totalPrice = totalDays * car.rentalPrice
//      //Need to check if user already has a booking and if the new booking overlaps with existing one
//     const user = req.session.user
//     const userDetail = await User.findById(user._id)       
//     const existingBooking = userDetail.bookingDetails
//     if(existingBooking && existingBooking.status === "confirmed" && existingBooking.carId.toString() === carId ){
//       const existingPickup = new Date(existingBooking.pickupDate)
//       const existingDropoff = new Date(existingBooking.dropoffDate)
//       if((pickupDate >= existingPickup && pickupDate < existingDropoff) || (dropoffDate > existingPickup && dropoffDate <= existingDropoff)){
//         req.flash("error", "You already have a booking that overlaps with the selected dates.")
//         // throw new Error("You already have a booking that overlaps with the selected dates.")
//       }
//     }
//     userDetail.bookingDetails.push({
//       carId: car._id,
//       pickupDate: pickupDate,       
//         dropoffDate: dropoffDate,
//         totalDays: totalDays,
//         totalPrice: totalPrice,
//         status: "confirmed"
//     })
//     await userDetail.save()
//      req.flash("success", "Booking successful!")
//         res.redirect("/cars")
// } catch (error) {
//    next(error)
//   } 
// }

exports.createBooking = async (req, res, next) => {
  try {
    const carId       = req.body.carId
    const pickupDate  = new Date(req.body.pickupDate)
    const dropoffDate = new Date(req.body.dropoffDate)


    if (pickupDate >= dropoffDate) {
      req.flash('error', 'Drop-off date must be after pick-up date.')
      return res.redirect('/cars')
    }

    const car = await Car.findById(carId).lean()
    if (!car) {
      req.flash('error', 'Car not found.')
      return res.redirect('/cars')
    }

    
    const conflictingUser = await User.findOne({
      'bookingDetails': {
        $elemMatch: {
          carId:       car._id,
          status:      { $in: ['confirmed','paid'] },
          pickupDate:  { $lt: dropoffDate },   
          dropoffDate: { $gt: pickupDate },    
        }
      }
    })

    if (conflictingUser) {
      req.flash('error', 'Sorry, this car is already booked for the selected dates. Please choose different dates.')
      return res.redirect('/cars')
    }


    const totalDays  = Math.ceil((dropoffDate - pickupDate) / (1000 * 60 * 60 * 24))
    const totalPrice = totalDays * car.rentalPrice

    const userDetail = await User.findById(req.session.user._id)

    userDetail.bookingDetails.push({
      carId:       car._id,
      pickupDate:  pickupDate,
      dropoffDate: dropoffDate,
      totalDays:   totalDays,
      totalPrice:  totalPrice,
      status:      'confirmed',
    })

    await userDetail.save()
    // await transporter.sendMail({
    //   from:    '"DriveElite" <aksgithub@gmail.com>',
    //   to:      userDetail.email,         
    //   subject: 'Booking Confirmation',
    //   html: `
    //     <h2>Booking Confirmed!</h2>
    //     <p>Hi <strong>${userDetail.name}</strong>,</p>
    //     <p>Your booking has been successfully confirmed. Here are your details:</p>
    //     <table border="1" cellpadding="8" cellspacing="0">
    //       <tr><td><strong>Car</strong></td><td>${car.name}</td></tr>
    //       <tr><td><strong>Pick-up Date</strong></td><td>${pickupDate.toDateString()}</td></tr>
    //       <tr><td><strong>Drop-off Date</strong></td><td>${dropoffDate.toDateString()}</td></tr>
    //       <tr><td><strong>Total Days</strong></td><td>${totalDays}</td></tr>
    //       <tr><td><strong>Total Price</strong></td><td>₹${totalPrice}</td></tr>
    //       <tr><td><strong>Status</strong></td><td>Confirmed</td></tr>
    //     </table>
    //     <p>Thank you for choosing us!</p>
    //   `
    // })

    req.flash('success', 'Booking successful!')
    res.redirect('/cars')

  } catch (error) {
    next(error)
  }
}


exports.getUserBookings = async(req, res, next) => {
  try {
    const user = req.session.user   
    const userDetail = await User.findById(user._id).lean()
    const bookings = userDetail.bookingDetails || []
    let car = []
    if(bookings.length > 0){
        const carId = bookings.map(booking => booking.carId)
        cars = await Car.find({_id: carId}).lean()
        car.push(cars)
    }
    res.render('bookings', {
        isLoggedIn: req.session.isLoggedIn,         
        isAdmin: req.session.user && req.session.user.role === 'admin',
        bookings: bookings,
        car: car
    }) 
} catch (error) {
   next(error)
  }     
}

exports.cancelBooking = async(req, res, next) => {
  try {
    const bookingId = req.params.bookingId              
    const user = req.session.user
    const userDetail = await User.findById(user._id)    
    const bookingIndex = userDetail.bookingDetails.findIndex(booking => booking._id.toString() === bookingId)   
    if(bookingIndex === -1){
      req.flash("error", "Booking not found")
    //   throw new Error("Booking not found")
    }   
    userDetail.bookingDetails[bookingIndex].status = "cancelled"
    await userDetail.save()
    await transporter.sendMail({
      from:    '"DriveElite" <aksgithub@gmail.com>',
      to:      userDetail.email,
      subject: 'Booking Cancelled',
      html: `
        <h2>Booking Cancelled</h2>
        <p>Hi <strong>${userDetail.name}</strong>,</p>
        <p>Your booking has been cancelled. Here's a summary:</p>
        <table border="1" cellpadding="8" cellspacing="0">
          <tr><td><strong>Car</strong></td><td>${car?.name || 'N/A'}</td></tr>
          <tr><td><strong>Pick-up Date</strong></td><td>${new Date(booking.pickupDate).toDateString()}</td></tr>
          <tr><td><strong>Drop-off Date</strong></td><td>${new Date(booking.dropoffDate).toDateString()}</td></tr>
          <tr><td><strong>Total Days</strong></td><td>${booking.totalDays}</td></tr>
          <tr><td><strong>Total Price</strong></td><td>₹${booking.totalPrice}</td></tr>
          <tr><td><strong>Status</strong></td><td>Cancelled</td></tr>
        </table>
        <p>We hope to serve you again soon!</p>
      `
    })
     req.flash("success", "Booking cancelled successfully")
        res.redirect("/bookings")
} catch (error) {
   next(error)
  } 
}





exports.createPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.params
    const user       = req.session.user
    
   
    const userDetail = await User.findById(user._id)
    if (!userDetail) {
      req.flash('error', 'User not found')
      return res.redirect('/bookings')
    }

    
    const booking = userDetail.bookingDetails.id(bookingId)
    if (!booking) {
      req.flash('error', 'Booking not found')
      return res.redirect('/bookings')
    }

    const options = {
      amount:   booking.totalPrice * 100,  
      currency: 'INR',
      receipt:  `receipt_${bookingId}`,
      notes: {
        bookingId: bookingId.toString(),
        userId:    user._id.toString(),
      },
    }

    const order = await razorpay.orders.create(options)

    res.render('payment', {
      isLoggedIn: req.session.isLoggedIn,
      isAdmin:    req.session.user?.role === 'admin',
      order,
      booking,
      keyId: "rzp_test_SxtlDyLGyLQX27",
    })

  } catch (error) {
    next(error)
  }
}

exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId               
    } = req.body

 
    const body     = razorpay_order_id + '|' + razorpay_payment_id
    const expected = crypto
      .createHmac('sha256', "KavkmqFHxZlWl86PRz7Pf4mx")
      .update(body)
      .digest('hex')

    if (expected !== razorpay_signature) {
      req.flash('error', 'Payment verification failed. Please contact support.')
      return res.redirect('/bookings')
    }

   
    const user       = req.session.user
    const userDetail = await User.findById(user._id)  
    if (!userDetail) {
      req.flash('error', 'User not found')
      return res.redirect('/bookings')
    }


   
    const booking = userDetail.bookingDetails.id(bookingId)
    if (!booking) {
      req.flash('error', 'Booking not found')
      return res.redirect('/bookings')
    }

    const car = await Car.findById(booking.carId).lean()
     
    booking.status          = 'paid'
    booking.paymentId       = razorpay_payment_id
    booking.razorpayOrderId = razorpay_order_id

    await userDetail.save()
    
    //  await transporter.sendMail({
    //   from:    '"DriveElite" <aksgithub@gmail.com>',
    //   to:      userDetail.email,
    //   subject: 'Payment Successful',
    //   html: `
    //     <h2>Payment Confirmed!</h2>
    //     <p>Hi <strong>${userDetail.name}</strong>,</p>
    //     <p>Your payment was successful. Here's your receipt:</p>
    //     <table border="1" cellpadding="8" cellspacing="0">
    //       <tr><td><strong>Car</strong></td><td>${car?.name || 'N/A'}</td></tr>
    //       <tr><td><strong>Pick-up Date</strong></td><td>${new Date(booking.pickupDate).toDateString()}</td></tr>
    //       <tr><td><strong>Drop-off Date</strong></td><td>${new Date(booking.dropoffDate).toDateString()}</td></tr>
    //       <tr><td><strong>Total Days</strong></td><td>${booking.totalDays}</td></tr>
    //       <tr><td><strong>Amount Paid</strong></td><td>₹${booking.totalPrice}</td></tr>
    //       <tr><td><strong>Payment ID</strong></td><td>${razorpay_payment_id}</td></tr>
    //       <tr><td><strong>Order ID</strong></td><td>${razorpay_order_id}</td></tr>
    //       <tr><td><strong>Status</strong></td><td>Paid</td></tr>
    //     </table>
    //     <p>Thank you for your payment. Enjoy your ride!</p>
    //   `
    // })

    req.flash('success', 'Payment successful!')
    res.redirect('/bookings')

  } catch (error) {
    next(error)
  }
}