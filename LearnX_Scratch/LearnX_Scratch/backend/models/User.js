const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["student", "teacher"],
      required: true,
    },

    // ✅ Student fields
    gradeClass: {
      type: String,
      default: "",
    },
    schoolName: {
      type: String,
      default: "",
    },

    // ✅ ADD THESE (IMPORTANT)
    subject: {
      type: String,
      default: "",
    },
    experience: {
      type: Number,
      default: 0,
    },
    institutionName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);