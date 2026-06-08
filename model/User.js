const mongoose = require("mongoose")

const Schema = mongoose.Schema

const userSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
        default:null
    },
    role:{
        type:String,
        required:true
    },
    bookingDetails:[{
        carId:{
            type:Schema.Types.ObjectId,
            ref:"Car"
        },
        pickupDate:{
            type: Date,
            default: null
        },
        dropoffDate:{
            type: Date,
            default: null
        },
        totalDays:{
            type: Number,
            default: null
        },
        totalPrice:{
            type: Number,
            default: null
        },
        status:{
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'paid'],
            default: 'pending'
        },
         paymentId:       String,   
  razorpayOrderId: String,
    }],
       resetToken:{
        type: String,
        default: null
    },
    resetTokenExpiry:{
        type: Date,
        default: null
    },
    oauthId:       { type: String },
oauthProvider: { type: String },
},{timestamps:true})


module.exports = mongoose.model("User", userSchema)