const mongoose=require("mongoose")

mongoose.connect("mongodb://localhost:8181/cps")
.then(()=>{
    console.log("mongodb connected")
})

.catch(()=>{
    console.log("failed not connected")
})

const LoginSchema= new mongoose.Schema({
    nama:{
        type:String,
        required:true
    },
    alamat:{
        type:String,
        required:true
    },
    tlp:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})


const collection = new mongoose.model("user",LoginSchema)

module.exports= collection
