import httpStatus from "http-status";
import { User } from "../models/usermodel.js";
import { Meeting } from "../models/meetingmodel.js";
import bcrypt, { hash }  from "bcrypt";
import crypto from "crypto";

    const login = async (req, res) => {
    const { username, password} = req.body;
       if(!username || !password) {
        return res.status(400).json({message: " Please Provide"})
       }
    try {
             const user = await User.findOne({username});
             if(!user) {
                return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
}

   let isPasswordCorrect = await bcrypt.compare(password, user.password);



if(isPasswordCorrect) {

       let token = crypto.randomBytes(20).toString("hex");

       user.token = token;
       await user.save();
       const userObj = user.toObject();
       delete userObj.password;
       return res.status(httpStatus.OK).json({ token: token, user: userObj });
    } else {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid credentials" });
    }
}catch (e) {
      return res.status(500).json({message: `Something went wrong ${e}`})
    }
}

    const register = async (req, res) => {
  const { name, username, password } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(httpStatus.FOUND).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      username,
      password: hashedPassword,
    });
    await newUser.save();
    res.status(httpStatus.CREATED).json({ message: "User Registered" });
  } catch (e) {
    console.error("Registration error:", e);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};


const getUserHistory = async (req, res) => {
    const {token} = req.query;

    try {
      const user = await User.findOne({token: token});
      if (!user) {
        return res.status(401).json({message: "Invalid token"});
      }
      const meetings = await Meeting.find({user_id: user.username});
      res.json(meetings);
    } catch (e) {
      res.status(500).json({message: `Something went wrong: ${e}`});
    }
}

const addToHistory = async (req, res) => {
   const { token, meeting_code } = req.body;

    try {
      const user = await User.findOne({token: token});
      if (!user) {
        return res.status(401).json({message: "Invalid token"});
      }

      const newMeeting = new Meeting({
        user_id: user.username,
        meetingCode: meeting_code
      });
      await newMeeting.save();
      res.status(httpStatus.CREATED).json({message: "Added to history"});
    } catch (e) {
        res.status(500).json({message: `Something went wrong: ${e}`});
    }
}

export { login, register, getUserHistory, addToHistory}
