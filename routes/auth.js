const express = require("express")

const router = express.Router()

const authController = require("../controller/Auth")
const {isAuth} = require("../middleware")

router.get('/signin', authController.getSignIn)
router.get('/signup', authController.getSignUp)
router.get('/reset-password', authController.getResetPassword)
router.get('/reset/:tokenId', authController.getResetNewPassword)
router.post("/signin", authController.postSignIn)
router.post("/signup", authController.postSignUp)
router.post("/reset-password", authController.postResetPassword)
router.post("/update-password", authController.updatePassword)
router.post("/signout", authController.postSignOut)
router.get("/add-car",isAuth, authController.getAddCar)
router.post("/add-car",isAuth, authController.postAddCar)
router.get("/cars",isAuth, authController.getAdminCars)
router.post("/cars/edit",isAuth, authController.postEditCar)
router.get("/cars/:carId/delete",isAuth, authController.postDeleteCar)
router.post("/edit-car",isAuth, authController.updateEditCar)

// router.get('/reset-password')

module.exports = router