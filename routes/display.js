const express = require("express")

const carsController = require("../controller/Cars")
const {isAuth} = require("../middleware")

const router = express.Router();

router.get("/", isAuth, carsController.getAllCars)
router.get("/about", isAuth, carsController.getAbout)
router.get("/cars", isAuth, carsController.getAllCars)
router.get("/book/:carId", isAuth, carsController.getCarDetails)
router.post("/booking", isAuth, carsController.createBooking)
router.get('/bookings', isAuth, carsController.getUserBookings)
router.post('/bookings/:bookingId/cancel', isAuth, carsController.cancelBooking)
router.get( '/bookings/:bookingId/pay',    isAuth, carsController.createPayment  );
router.post('/bookings/verify-payment',    isAuth, carsController.verifyPayment  );


module.exports = router