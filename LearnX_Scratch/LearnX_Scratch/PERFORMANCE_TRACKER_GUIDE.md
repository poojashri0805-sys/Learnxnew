# Performance Tracker System - Setup Guide

## 📦 Installation

Before using the Performance Tracker, ensure all dependencies are installed:

```bash
# Navigate to project root
cd e:\Learnxnew\LearnX_Scratch\LearnX_Scratch

# Install dependencies
npm install
```

### Required Packages
The following packages should already be in your `package.json`:
- ✅ `xlsx` - For Excel file parsing
- ✅ `bcryptjs` - For password hashing
- ✅ `axios` - For ML API calls
- ✅ `recharts` - For charts in frontend

## 🚀 Starting the Application

1. **Start ML Server** (Python)
   ```bash
   cd backend\ml
   python app.py
   ```
   Server will run on `http://localhost:5001`

2. **Start Backend Server**
   ```bash
   npm run dev
   # or
   npm start
   ```
   Server will run on `http://localhost:5000`

3. **Start Frontend Server** (in another terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

## 📊 Excel File Format

Teachers should upload Excel files with the following structure:

### Required Columns:
| Column | Example | Type | Required |
|--------|---------|------|----------|
| studentId | ST001 | String | ✅ Yes |
| fullName | John Doe | String | Optional |
| email | john@school.com | String | Optional |
| test1_name | Mid-Term Test | String | For each test |
| test1_marks | 75 | Number | For each test |
| test1_total | 100 | Number | For each test |
| test1_topics | Algebra,Trigonometry | String (comma-separated) | For each test |
| test2_name | Final Test | String | Optional (up to 5 tests) |
| test2_marks | 82 | Number | |
| test2_total | 100 | Number | |
| test2_topics | Calculus,Statistics | String | |
| attendance | 85 | Number | Optional (0-100) |
| income | Middle | String | Optional |
| feePaid | Yes | Yes/No | Optional |

### Example Excel Data:
```
studentId | fullName      | email          | test1_name | test1_marks | test1_total | test1_topics              | test2_name | test2_marks | test2_total | test2_topics      | attendance | income | feePaid
ST001     | Rajesh Kumar  | rajesh@s.com   | Quiz 1     | 18          | 20          | Functions,Vectors         | Quiz 2     | 16          | 20          | Limits,Continuity | 90         | Middle | Yes
ST002     | Priya Sharma  | priya@s.com    | Quiz 1     | 12          | 20          | Functions,Vectors         | Quiz 2     | 14          | 20          | Limits,Continuity | 75         | High   | Yes
ST003     | Arun Patel    | arun@s.com     | Quiz 1     | 8           | 20          | Functions,Vectors         | Quiz 2     | 10          | 20          | Limits,Continuity | 60         | Low    | No
```

## 🎯 How It Works

### 1. Upload Process
- Teacher clicks "Upload Excel" on Performance Tracker page
- System parses Excel file
- For each student:
  - Creates account with default password if doesn't exist
  - Fetches quiz marks and streaks from app database
  - Combines Excel + App data
  - Calculates weak/strong topics
  - Gets AI prediction for risk status

### 2. Data Combination Flow
```
Excel Data (Test Scores) 
         ↓
    By Student ID
         ↓
    Merged with App Data (Quiz Marks, Streaks)
         ↓
    Calculate Metrics (Performance Score)
         ↓
    Identify Weak Topics (< 50% average)
         ↓
    Send to ML API (with attendance, income, fee paid)
         ↓
    Get Risk Prediction (At Risk, Warning, Safe)
```

### 3. Performance Score Calculation
```
Performance Score = 
  (Excel Percentage × 0.60) +     // Exam weight: 60%
  (Quiz Percentage × 0.30) +      // Quiz weight: 30%
  (Streak Days (max 30) × 0.10)   // Streak weight: 10%
```

### 4. Weak Topics Detection
- Topics where student scored < 50% average are marked as weak
- Topics > 50% are marked as strong
- Used for targeted intervention recommendations

## 🔧 API Endpoints

### Upload Performance Data
```
POST /api/performance/upload
Headers: Content-Type: multipart/form-data
Body: grade, subject, file (Excel)

Response: { success: true, students: [...], message: "..." }
```

### Get Performance Dashboard
```
GET /api/performance/dashboard/:grade/:subject

Response: {
  stats: { totalStudents, avgScore, atRiskCount, avgAttendance },
  students: [...],
  topicWiseStats: [...]
}
```

### Get Student Profile
```
GET /api/performance/student/:studentId/:grade/:subject

Response: { Full performance data with all metrics }
```

### Add Test Marks
```
POST /api/performance/student/:studentId/:grade/:subject/test
Body: { testName, marksObtained, totalMarks, topics }

Response: { success: true, prediction updated }
```

### Get All Grades
```
GET /api/performance/grades

Response: [
  { grade: "Grade 10", subjects: ["Math", "Physics"] },
  ...
]
```

## 📋 Dashboard Features

### Key Metrics
- **Total Students**: Count of students in the class
- **Avg Score**: Average performance score (0-100)
- **At Risk Count**: Number of at-risk students
- **Attendance**: Average attendance percentage

### Topic-wise Performance
- Bar chart showing average score per topic
- Identifies weak areas for class-wide intervention
- Topics sorted by performance (worst first)

### Student Status Distribution
- Pie chart showing breakdown of At Risk / Warning / Safe students
- Quick visual assessment of class health

### Student Performance Table
- All students with scores, streaks, attendance, status
- One-click access to detailed student profile

### Student Profile Modal
- Individual student metrics and charts
- Weak and strong topics list
- Topic-wise performance bar chart (sorted by performance)
- Recommended interventions
- Add test marks button

## ⚙️ Backend Models

### Performance Schema
```javascript
{
  userId: ObjectId,
  studentId: String,
  fullName: String,
  email: String,
  grade: String,
  subject: String,
  excelTests: [{ testName, topics, marksObtained, totalMarks, percentage, date }],
  quizMarks: [{ quizId, score, totalMarks, percentage, date }],
  streakDays: Number,
  attendance: Number,
  income: String,
  feePaid: Number,
  weakTopics: [String],
  strongTopics: [String],
  prediction: String (At Risk/Safe/Warning),
  performanceScore: Number (0-100),
  topicPerformance: [{ topic, averageScore, testCount, lastAttempt }],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Auto-User Creation

When uploading Excel with new students:
- If student doesn't exist in database: **Account created automatically**
- Default password: `Default@123`
- Student can update password on first login
- Role: `student`
- Email: Generated from studentId if not provided

## 🧠 ML Prediction Model

The system sends the following features to the ML model:
- `avgPercentage`: Performance score
- `attendance`: Student attendance percentage
- `testCount`: Number of tests taken
- `trend`: Performance trend (0-1)
- `weakTopics`: Count of weak topics
- `income`: Income indicator (0-3)
- `feePaid`: Fee status (0-1)

Model predicts: **"At Risk" | "Safe" | "Warning"**

If ML API unavailable:
- At Risk: Score < 40%
- Warning: Score 40-60%
- Safe: Score > 60%

## 🎓 Workflow Example

### Teacher Journey:
1. Login → Teacher Dashboard → Performance Tracker
2. Select Grade 10
3. Input Subject: "Mathematics"
4. Upload Excel with test marks
5. System shows dashboard with:
   - 30 students total
   - 62% average score
   - 8 at-risk students
   - Topic-wise performance chart
6. Click on "Rajesh Kumar" (at-risk)
7. See weak topics: "Calculus", "Limits"
8. Add new Quiz marks
9. Prediction updates automatically
10. See recommended interventions

## 🐛 Troubleshooting

### Excel not uploading
- Ensure file is .xlsx or .csv
- Check all required columns present
- Verify studentId column has values

### Students not auto-created
- Check MongoDB connection
- Verify User model migration
- Check backend logs

### ML predictions not working
- Ensure Flask server running on port 5001
- Check ML model file exists
- Review backend logs for API errors

### Performance not updating after adding test
- Check database connection
- Verify student performance record exists
- Check browser console for API errors
