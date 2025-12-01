import mongoose from "mongoose";

interface IUser {
  _id?: mongoose.Types.ObjectId ;
  name: string;
  role: "admin" | "user" | "deliveryBoy";
  email: string;
  mobile?: string;
  password?: string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      required: false,
      unique: true,
      
    },
    role: {
      type: String,
      enum: ["admin", "user", "deliveryBoy"],
      default:"user",
      required: true,
    },
    password: {
      type: String,
    },
    
  
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default User;
