import cloudinary from "../lib/cloudinary.js"
import { generateToken } from "../lib/utils.js"
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"

export const signup = async(req,res) =>{
    const {fullName, email, password}= req.body
    try{
       if(!fullName || !email ||!password){
        return res.status(400).json({ message: "All firelds are required" })

       }

        if (password.length < 6){
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }

        const user = await User.findOne({email})

        if (user) return res.status(400).json({ message: "Email already exists"})

        // hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        })

        if (newUser){
            // generate jwt token
            generateToken(newUser._id, res)
            await newUser.save()

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            })


            console.log( "Registration successful")

        }else{
            return res.status(400).json({ message: "Invalid credentials"})
        }
    }catch(error){
        console.log("Error in signup controller", error.message)
        res.status(500).json({ message: "Internal Server Error"})
    }
}

export const login = async(req,res) =>{
    const {email, password} = req.body
    try{
        const user  = await User.findOne({email})

        if(!user){
            return res.status(400).json({message:"Invalid credentials"})
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if( !isPasswordCorrect ) {
            return res.status(400).json({message:"Invalid credentials"})
        }

        generateToken(user._id, res)
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        })
        console.log("Login successful")


    } catch(error){
        console.log("Error in signup controller", error.message)
        res.status(500).json({ message: "Internal Server Error"})
    }
}

export const logout = (req,res) =>{
    try{
        res.cookie("jwt", '', {maxAge:0})
        res.status(200).json({message:"Logged out successfully"})
    } catch(error){
        console.log("Error in logout controller", error.message)
        res.status(500).json({ message: "Internal Server Error"})
    }
}

// profile pic
export const updateProfile = async (req, res) => {
    try {
      const userId = req.user._id;
  
      if (!req.file) {
        return res.status(400).json({ message: "Profile pic is required" });
      }
  
      const uploadResponse = await cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({ message: "Image upload failed" });
          }
  
          const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: result.secure_url },
            { new: true }
          );
  
          res.status(200).json(updatedUser);
        }
      );
  
      uploadResponse.end(req.file.buffer);
    } catch (error) {
      console.log("error in update profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  

  export const checkAuth = async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error("Error in checkAuth:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  