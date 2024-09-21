import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: { type: String, required: true },
  resetToken: String,
  resetTokenExpiration: Date,
  chores: [{ type: Schema.Types.ObjectId, ref: "Chore" }],
});

export default mongoose.model("User", userSchema);
