const mongoose = require("mongoose")

const Schema = mongoose.Schema

const carsSchema = new Schema({
    category:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true,
    },
    brand:{
        type:String,
        required:true,
    },
        seatCapacity:{
        type:Number,
        required:true,
    },
        transmission:{
        type:String,
        required:true,
    },
        fuelType:{
        type:String,
        required:true,
    },
        rentalPrice:{
        type:Number,
        required:true,
    },
        imageUrl:{
        type:String,
        required:true,
    },
        userId:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"User"
    }
}, {timestamps:true})

module.exports = mongoose.model("Car", carsSchema)