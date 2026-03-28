const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    
    studentId: {
        type: String,
        required: true,
    },
    
    fullName: String,
    email: String,

    grade: {
        type: String,
        required: true,
    },
    
    subject: {
        type: String,
        required: true,
    },

    // Excel Data
    excelTests: [
        {
            testName: String,           // Test1, Mid-Term, etc.
            topics: [String],           // Topics covered
            marksObtained: Number,
            totalMarks: Number,
            percentage: Number,
            date: Date,
        }
    ],

    // App Data (Auto-synced)
    quizMarks: [
        {
            quizId: String,
            score: Number,
            totalMarks: Number,
            percentage: Number,
            date: Date,
        }
    ],

    streakDays: {
        type: Number,
        default: 0,
    },

    attendance: {
        type: Number,
        default: 0,
    },

    // Metadata
    income: String,              // Optional: from Excel
    feePaid: {
        type: Number,
        default: 0,
    },
    
    // Weak Topics Detection
    weakTopics: [String],        // Topics where student scored poorly
    strongTopics: [String],      // Topics where student excelled
    
    // AI Prediction
    prediction: {
        type: String,
        enum: ["At Risk", "Safe", "Warning"],
        default: "Safe",
    },
    
    performanceScore: {           // Overall performance (0-100)
        type: Number,
        default: 0,
    },
    
    // Subject-wise metrics
    topicPerformance: [
        {
            topic: String,
            averageScore: Number,
            testCount: Number,
            lastAttempt: Date,
        }
    ],

    createdAt: {
        type: Date,
        default: Date.now,
    },
    
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model("Performance", performanceSchema);
