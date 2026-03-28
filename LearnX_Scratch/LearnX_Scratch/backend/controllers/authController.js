const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};


const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      gradeClass,
      schoolName,
      subject,
      experience,
      institutionName,
    } = req.body;

    // ✅ Common validation
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: "All required fields are missing" });
    }

    // ✅ Role-based validation
    if (role === "student") {
      if (!gradeClass || !schoolName) {
        return res.status(400).json({
          message: "Student must provide grade and school name",
        });
      }
    }

    if (role === "teacher") {
      if (!subject || !experience || !institutionName) {
        return res.status(400).json({
          message: "Teacher must provide subject, experience, and institution",
        });
      }
    }

    // ✅ Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const { studentId } = req.body;

if (role === "student") {
  if (!studentId) {
    return res.status(400).json({ message: "Student ID is required" });
  }

  let student = await User.findOne({ studentId });

  // ✅ CASE 1: Student exists → update
  if (student) {
    student.fullName = fullName;
    student.email = email;
    student.password = hashedPassword;

    await student.save();

    return res.status(200).json({
      message: "Account linked successfully",
      token: generateToken(student._id),
      user: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        role: student.role,
        studentId: student.studentId,
        gradeClass: student.gradeClass,
      },
    });
  }

  // ✅ CASE 2: Student NOT exists → CREATE
  student = await User.create({
    fullName,
    email,
    password: hashedPassword,
    role: "student",
    studentId,
    gradeClass,
    schoolName,
  });

  return res.status(201).json({
    message: "Student registered successfully",
    token: generateToken(student._id),
    user: {
      id: student._id,
      fullName: student.fullName,
      email: student.email,
      role: student.role,
      studentId: student.studentId,
      gradeClass: student.gradeClass,
      schoolName: student.schoolName,
    },
  });
}

    // ✅ Create user (IMPORTANT CHANGE)
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      studentId,

      // Student fields
      gradeClass: role === "student" ? gradeClass : "",
      schoolName: role === "student" ? schoolName : "",

      // Teacher fields ✅
      subject: role === "teacher" ? subject : "",
      experience: role === "teacher" ? Number(experience) : 0,
      institutionName: role === "teacher" ? institutionName : "",
    });

    res.status(201).json({
      message: "Account created successfully",
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        gradeClass: user.gradeClass,
        schoolName: user.schoolName,
      },
    });
  } catch (error) {
    console.error(error); // 👈 ADD THIS (VERY IMPORTANT FOR DEBUG)
    res.status(500).json({ message: "Registration failed" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password and role are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: `Please login as ${user.role}` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        gradeClass: user.gradeClass,
        schoolName: user.schoolName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};