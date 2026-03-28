const Performance = require("../models/Performance");
const User = require("../models/User");
const Streak = require("../models/Streak");
const QuizResult = require("../models/QuizResult");
const XLSX = require("xlsx");
const fs = require("fs");
const axios = require("axios");
const bcrypt = require("bcryptjs");

const ML_API_URL = "http://localhost:5001";

// Find or create user
async function findOrCreateUser(studentId, fullName, email, grade, defaultPassword = "Default@123") {
    try {
        let user = await User.findOne({ studentId });
        
        if (!user) {
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            
            user = new User({
                fullName: fullName || `Student ${studentId}`,
                email: email || `${studentId}@learnx.local`,
                password: hashedPassword,
                role: "student",
                studentId,
                gradeClass: grade,
            });
            
            await user.save();
        }
        
        return user;
    } catch (error) {
        console.error("Error finding/creating user:", error);
        throw error;
    }
}

// Parse Excel file
function parseExcelFile(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Parse with explicit range to get all rows
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        console.log(`✅ Excel Parsing: Found ${data.length} rows in sheet "${sheetName}"`);
        
        return data;
    } catch (error) {
        console.error("❌ Error parsing Excel:", error);
        throw new Error("Failed to parse Excel file");
    }
}

// Calculate weak topics
function getWeakTopics(excelTests, threshold = 50) {
    const topicScores = {};
    
    excelTests.forEach(test => {
        if (test.topics && Array.isArray(test.topics)) {
            const scorePercentage = (test.marksObtained / test.totalMarks) * 100;
            
            test.topics.forEach(topic => {
                if (!topicScores[topic]) {
                    topicScores[topic] = [];
                }
                topicScores[topic].push(scorePercentage);
            });
        }
    });
    
    const weakTopics = [];
    const strongTopics = [];
    
    Object.entries(topicScores).forEach(([topic, scores]) => {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        if (avgScore < threshold) {
            weakTopics.push(topic);
        } else {
            strongTopics.push(topic);
        }
    });
    
    return { weakTopics, strongTopics };
}

// Calculate performance metrics
function calculateMetrics(excelTests, quizMarks, streakDays, attendance) {
    let totalMarks = 0;
    let obtainedMarks = 0;
    
    excelTests.forEach(test => {
        totalMarks += test.totalMarks || 0;
        obtainedMarks += test.marksObtained || 0;
    });
    
    const excelPercentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    
    let quizPercentage = 0;
    if (quizMarks.length > 0) {
        quizPercentage = quizMarks.reduce((sum, q) => sum + q.percentage, 0) / quizMarks.length;
    }
    
    const performanceScore = (excelPercentage * 0.5) + (quizPercentage * 0.5);
    
    return {
        excelPercentage,
        quizPercentage,
        performanceScore,
        testCount: excelTests.length,
        quizCount: quizMarks.length,
    };
}

// Get prediction
async function getPrediction(performanceData) {
    try {
        const score = performanceData.performanceScore || 0;
        
        // Immediate threshold logic
        if (score < 40) return "At Risk";
        if (score < 60) return "Warning";
        return "Safe";
        
    } catch (error) {
        console.error("Error in prediction logic:", error.message);
        // Final fallback
        const score = performanceData.performanceScore || 0;
        if (score < 40) return "At Risk";
        if (score < 60) return "Warning";
        return "Safe";
    }
}

// Upload Excel and process performance data
exports.uploadPerformanceData = async (req, res) => {
    try {
        const { grade, subject } = req.body;
        
        if (!req.file || !grade || !subject) {
            return res.status(400).json({ error: "File, grade, and subject required" });
        }
        
        if (!req.file.path) {
            return res.status(400).json({ error: "File upload failed" });
        }
        
        // Parse Excel
        const excelData = parseExcelFile(req.file.path);
        
        if (!Array.isArray(excelData) || excelData.length === 0) {
            return res.status(400).json({ error: "No valid data found in Excel" });
        }
        
        // Group data by studentId to handle both formats
        const studentDataMap = {};
        const studentInfoMap = {};
        
        console.log(`📊 Processing ${excelData.length} rows from Excel...`);
        
        for (const row of excelData) {
            const studentId = String(row.studentId || row["Student ID"] || row.Student || "").trim();
            if (!studentId) continue;
            
            if (!studentDataMap[studentId]) {
                studentDataMap[studentId] = [];
                studentInfoMap[studentId] = {
                    studentId,
                    fullName: row.fullName || row["Full Name"] || row.Name || `Student ${studentId}`,
                    email: row.email || row["Email"] || `${studentId}@learnx.local`,
                    attendance: parseInt(row.attendance || row["Attendance"] || 0) || 0,
                    income: row.income || row["Income"] || "",
                    feePaid: parseInt(row.feePaid || row["Fee Paid"] || 0) || 0,
                };
            }
            
            // Try Format 2: One test per row (most common)
            const testName = row.testName || row["Test Name"] || row["test_name"];
            const marksStr = row.marks || row["Marks"] || row.marksObtained || row["Marks Obtained"];
            const totalStr = row.totalMarks || row["Total Marks"] || row["total_marks"];
            const topicsStr = row.topics || row["Topics"] || row.topic || "";
            
            if (testName && marksStr && totalStr) {
                const marks = parseInt(marksStr);
                const total = parseInt(totalStr);
                
                if (!isNaN(marks) && !isNaN(total) && total > 0) {
                    const topicArray = typeof topicsStr === "string" 
                        ? topicsStr.split(/[,;]/).map(t => t.trim()).filter(t => t)
                        : [];
                    
                    studentDataMap[studentId].push({
                        testName,
                        marksObtained: marks,
                        totalMarks: total,
                        percentage: (marks / total) * 100,
                        topics: topicArray,
                        date: new Date(),
                    });
                } else {
                    // Try Format 1: Multiple tests per row
                    for (let i = 1; i <= 5; i++) {
                        const testNameKey = `test${i}_name`;
                        const testMarksKey = `test${i}_marks`;
                        const testTotalKey = `test${i}_total`;
                        const testTopicsKey = `test${i}_topics`;
                        
                        const name = row[testNameKey] || row[`Test${i} Name`];
                        const mrks = parseInt(row[testMarksKey] || row[`Test${i} Marks`]);
                        const tot = parseInt(row[testTotalKey] || row[`Test${i} Total`]);
                        const topicStr = row[testTopicsKey] || row[`Test${i} Topics`];
                        
                        if (name && !isNaN(mrks) && !isNaN(tot)) {
                            const topArray = typeof topicStr === "string" 
                                ? topicStr.split(/[,;]/).map(t => t.trim()).filter(t => t)
                                : [];
                            
                            studentDataMap[studentId].push({
                                testName: name,
                                marksObtained: mrks,
                                totalMarks: tot,
                                percentage: (mrks / tot) * 100,
                                topics: topArray,
                                date: new Date(),
                            });
                        }
                    }
                }
            } else {
                // Try Format 1: Multiple tests per row
                for (let i = 1; i <= 5; i++) {
                    const testNameKey = `test${i}_name`;
                    const testMarksKey = `test${i}_marks`;
                    const testTotalKey = `test${i}_total`;
                    const testTopicsKey = `test${i}_topics`;
                    
                    const name = row[testNameKey] || row[`Test${i} Name`];
                    const marks = parseInt(row[testMarksKey] || row[`Test${i} Marks`]);
                    const total = parseInt(row[testTotalKey] || row[`Test${i} Total`]);
                    const topicsStr = row[testTopicsKey] || row[`Test${i} Topics`];
                    
                    if (name && !isNaN(marks) && !isNaN(total)) {
                        const topicArray = typeof topicsStr === "string" 
                            ? topicsStr.split(/[,;]/).map(t => t.trim()).filter(t => t)
                            : [];
                        
                        studentDataMap[studentId].push({
                            testName: name,
                            marksObtained: marks,
                            totalMarks: total,
                            percentage: (marks / total) * 100,
                            topics: topicArray,
                            date: new Date(),
                        });
                    }
                }
            }
        }
        
        const processedStudents = [];
        
        console.log(`👥 Found ${Object.keys(studentDataMap).length} unique students to process`);
        
        // Process each student
        for (const studentId of Object.keys(studentDataMap)) {
            try {
                const excelTests = studentDataMap[studentId];
                const studentInfo = studentInfoMap[studentId];
                
                if (excelTests.length === 0) continue;
                
                console.log(`⚙️  Processing: ${studentInfo.fullName} (${studentId})`);
                
                // Create or find user
                const user = await findOrCreateUser(
                    studentInfo.studentId,
                    studentInfo.fullName,
                    studentInfo.email,
                    grade
                );
                
                // Get app data (quiz marks and streak)
                const quizResults = await QuizResult.find({ user: user._id }).lean() || [];
                const quizMarks = quizResults.map(q => ({
                    quizId: q._id,
                    score: q.score || 0,
                    totalMarks: q.total || 100,
                    percentage: ((q.score || 0) / (q.total || 100)) * 100,
                    date: q.submittedAt,
                }));
                
                console.log(`📝 Found ${quizMarks.length} quiz records for ${user.fullName}`);
                
                const streakData = await Streak.findOne({ userId: user._id }).lean();
                const streakDays = streakData?.currentStreak || 0;
                
                // Calculate metrics
                const metrics = calculateMetrics(excelTests, quizMarks, streakDays, studentInfo.attendance);
                const { weakTopics, strongTopics } = getWeakTopics(excelTests);
                const prediction = await getPrediction(metrics);
                
                // Calculate topic performance
                const topicPerformance = {};
                excelTests.forEach(test => {
                    test.topics?.forEach(topic => {
                        if (!topicPerformance[topic]) {
                            topicPerformance[topic] = { scores: [], count: 0 };
                        }
                        topicPerformance[topic].scores.push(test.percentage);
                        topicPerformance[topic].count++;
                    });
                });
                
                const topicPerformanceArray = Object.entries(topicPerformance).map(([topic, data]) => ({
                    topic,
                    averageScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
                    testCount: data.count,
                    lastAttempt: new Date(),
                }));
                
                // Update or create performance record
                let performance = await Performance.findOne({
                    userId: user._id,
                    grade,
                    subject,
                });
                
                if (performance) {
                    // Append new tests
                    performance.excelTests.push(...excelTests);
                    performance.quizMarks = quizMarks;
                    performance.streakDays = streakDays;
                } else {
                    performance = new Performance({
                        userId: user._id,
                        studentId: user.studentId,
                        fullName: user.fullName,
                        email: user.email,
                        grade,
                        subject,
                        excelTests,
                        quizMarks,
                        streakDays,
                    });
                }
                
                // Recalculate metrics based on ALL tests (old + new)
                const allExcelTests = performance.excelTests;
                const metricsRecalc = calculateMetrics(allExcelTests, quizMarks, streakDays, studentInfo.attendance);
                
                // Recalculate weak and strong topics from ALL tests
                const { weakTopics: allWeakTopics, strongTopics: allStrongTopics } = getWeakTopics(allExcelTests);
                
                // Recalculate topic performance from ALL tests
                const allTopicPerformance = {};
                allExcelTests.forEach(test => {
                    test.topics?.forEach(topic => {
                        if (!allTopicPerformance[topic]) {
                            allTopicPerformance[topic] = { scores: [], count: 0 };
                        }
                        allTopicPerformance[topic].scores.push(test.percentage);
                        allTopicPerformance[topic].count++;
                    });
                });
                
                const allTopicPerformanceArray = Object.entries(allTopicPerformance).map(([topic, data]) => ({
                    topic,
                    averageScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
                    testCount: data.count,
                    lastAttempt: new Date(),
                }));
                
                // Get prediction based on ALL data
                const predictionRecalc = await getPrediction({
                    ...metricsRecalc,
                    attendance: studentInfo.attendance,
                    income: studentInfo.income,
                    feePaid: studentInfo.feePaid,
                    weakTopics: allWeakTopics,
                });
                
                performance.attendance = studentInfo.attendance;
                performance.income = studentInfo.income;
                performance.feePaid = studentInfo.feePaid;
                performance.weakTopics = allWeakTopics;
                performance.strongTopics = allStrongTopics;
                performance.prediction = predictionRecalc;
                performance.performanceScore = metricsRecalc.performanceScore;
                performance.topicPerformance = allTopicPerformanceArray;
                performance.updatedAt = new Date();
                
                await performance.save();
                
                console.log(`✅ Saved: ${user.fullName} with score ${metricsRecalc.performanceScore.toFixed(1)}%`);
                
                processedStudents.push({
                    studentId: user.studentId,
                    fullName: user.fullName,
                    prediction,
                    performanceScore: metrics.performanceScore,
                    weakTopics,
                });
                
            } catch (error) {
                console.error(`❌ Error processing student ${studentId}:`, error.message);
                // Continue processing other students
            }
        }
        
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.json({
            success: true,
            message: `Processed ${processedStudents.length} students`,
            students: processedStudents,
        });
        
    } catch (error) {
        console.error("Error uploading performance data:", error);
        
        // Clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            error: "Failed to upload performance data",
            details: error.message,
        });
    }
};

// Get performance dashboard
exports.getPerformanceDashboard = async (req, res) => {
    try {
        const { grade, subject } = req.params;
        
        const performances = await Performance.find({
            grade,
            subject,
        }).lean();
        
        if (performances.length === 0) {
            return res.json({
                stats: {
                    totalStudents: 0,
                    avgScore: 0,
                    atRiskCount: 0,
                    avgAttendance: 0,
                },
                students: [],
                topicWiseStats: [],
            });
        }
        
        const totalStudents = performances.length;
        const avgScore = performances.reduce((sum, p) => sum + (p.performanceScore || 0), 0) / totalStudents;
        const atRiskCount = performances.filter(p => p.prediction === "At Risk").length;
        const avgAttendance = performances.reduce((sum, p) => sum + (p.attendance || 0), 0) / totalStudents;
        
        // Topic-wise statistics
        const topicStats = {};
        performances.forEach(p => {
            p.topicPerformance?.forEach(tp => {
                if (!topicStats[tp.topic]) {
                    topicStats[tp.topic] = { scores: [], count: 0 };
                }
                topicStats[tp.topic].scores.push(tp.averageScore);
                topicStats[tp.topic].count++;
            });
        });
        
        const topicWiseStats = Object.entries(topicStats).map(([topic, data]) => ({
            topic,
            averageScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
            studentCount: data.count,
        })).sort((a, b) => a.averageScore - b.averageScore);
        
        // Student grades
        const grades = performances.map(p => ({
            studentId: p.studentId,
            fullName: p.fullName,
            email: p.email,
            performanceScore: p.performanceScore,
            prediction: p.prediction,
            attendance: p.attendance,
            quizCount: p.quizMarks?.length || 0,
            weakTopics: p.weakTopics,
            strongTopics: p.strongTopics,
            topicPerformance: p.topicPerformance || [],
            testCount: p.excelTests?.length || 0,
        }));
        
        res.json({
            stats: {
                totalStudents,
                avgScore: Math.round(avgScore * 100) / 100,
                atRiskCount,
                avgAttendance: Math.round(avgAttendance),
            },
            students: grades,
            topicWiseStats,
        });
        
    } catch (error) {
        console.error("Error fetching performance dashboard:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
};

// Get student profile
exports.getStudentProfile = async (req, res) => {
    try {
        const { studentId, grade, subject } = req.params;
        
        const performance = await Performance.findOne({
            studentId,
            grade,
            subject,
        }).lean();
        
        if (!performance) {
            return res.status(404).json({ error: "Student performance record not found" });
        }
        
        res.json(performance);
        
    } catch (error) {
        console.error("Error fetching student profile:", error);
        res.status(500).json({ error: "Failed to fetch student profile" });
    }
};

// Debug: Get database statistics
exports.getDbStats = async (req, res) => {
    try {
        const totalRecords = await Performance.countDocuments();
        const grades = await Performance.distinct("grade");
        const subjects = await Performance.distinct("subject");
        const atRisk = await Performance.countDocuments({ prediction: "At Risk" });
        const warning = await Performance.countDocuments({ prediction: "Warning" });
        const safe = await Performance.countDocuments({ prediction: "Safe" });
        
        res.json({
            totalRecords,
            grades,
            subjects,
            predictions: { atRisk, warning, safe },
        });
    } catch (error) {
        console.error("Error fetching DB stats:", error);
        res.status(500).json({ error: "Failed to fetch statistics" });
    }
};

// Get all grades with subjects
exports.getAllGrades = async (req, res) => {
    try {
        const performances = await Performance.find().select("grade subject").lean();
        
        const gradeMap = {};
        performances.forEach(p => {
            if (!gradeMap[p.grade]) {
                gradeMap[p.grade] = new Set();
            }
            gradeMap[p.grade].add(p.subject);
        });
        
        const result = Object.entries(gradeMap).map(([grade, subjects]) => ({
            grade,
            subjects: Array.from(subjects),
        }));
        
        res.json(result);
    } catch (error) {
        console.error("Error fetching grades:", error);
        res.status(500).json({ error: "Failed to fetch grades" });
    }
};

// Add test marks
exports.addTestMarks = async (req, res) => {
    try {
        const { studentId, grade, subject } = req.params;
        const { testName, marksObtained, totalMarks, topics } = req.body;
        
        if (!testName || !marksObtained || !totalMarks) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        
        const performance = await Performance.findOne({
            studentId,
            grade,
            subject,
        });
        
        if (!performance) {
            return res.status(404).json({ error: "Student performance record not found" });
        }
        
        const newTest = {
            testName,
            marksObtained: parseInt(marksObtained),
            totalMarks: parseInt(totalMarks),
            percentage: (marksObtained / totalMarks) * 100,
            topics: Array.isArray(topics) ? topics : [],
            date: new Date(),
        };
        
        performance.excelTests.push(newTest);
        
        // Recalculate metrics
        const quizMarks = performance.quizMarks || [];
        const metricsRecalc = calculateMetrics(performance.excelTests, quizMarks, performance.streakDays, performance.attendance);
        const { weakTopics, strongTopics } = getWeakTopics(performance.excelTests);
        
        performance.performanceScore = metricsRecalc.performanceScore;
        performance.weakTopics = weakTopics;
        performance.strongTopics = strongTopics;
        performance.prediction = await getPrediction(metricsRecalc);
        
        await performance.save();
        
        res.json({
            success: true,
            message: "Test marks added successfully",
            performance,
        });
        
    } catch (error) {
        console.error("Error adding test marks:", error);
        res.status(500).json({ error: "Failed to add test marks", details: error.message });
    }
};
