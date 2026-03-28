# How to Create Performance Data Excel Files

## Quick Reference

### File Format
- **Type:** .xlsx, .xls, or .csv
- **Encoding:** UTF-8
- **First Row:** Column headers (exactly as shown below)

### Required Columns
Create an Excel file with these column headers in the first row:

| Header Name | Example | Notes |
|-------------|---------|-------|
| studentId | ST001 | REQUIRED - Must be unique |
| fullName | Rajesh Kumar | Optional - Auto-generated if missing |
| email | rajesh@school.com | Optional - Auto-generated if missing |
| test1_name | Quiz 1 | For first test |
| test1_marks | 18 | Marks obtained (optional if not applicable) |
| test1_total | 20 | Total marks (optional if not applicable) |
| test1_topics | Functions,Vectors | Topics covered (comma-separated) |
| test2_name | Mid-Term | For second test (optional) |
| test2_marks | 75 | For second test |
| test2_total | 100 | For second test |
| test2_topics | Algebra,Calculus,Trigonometry | For second test |
| ... | ... | Repeat pattern for test3-5 (up to 5 tests) |
| attendance | 85 | Optional - 0-100 percentage |
| income | Middle | Optional - Low/Middle/High |
| feePaid | Yes | Optional - Yes/No |

## Step-by-Step Instructions

### 1. Open Excel (or LibreOffice Calc)

### 2. Create Headers
In row 1, type the column headers:
```
A1: studentId
B1: fullName
C1: email
D1: test1_name
E1: test1_marks
F1: test1_total
G1: test1_topics
H1: test2_name
I1: test2_marks
J1: test2_total
K1: test2_topics
L1: attendance
M1: income
N1: feePaid
```

### 3. Add Student Data

**Row 2 - First Student:**
```
A2: ST001
B2: Rajesh Kumar
C2: rajesh@school.com
D2: Quiz 1
E2: 18
F2: 20
G2: Functions,Vectors
H2: Quiz 2
I2: 16
J2: 20
K2: Limits,Continuity
L2: 90
M2: Middle
N2: Yes
```

**Row 3 - Second Student:**
```
A3: ST002
B3: Priya Sharma
C3: priya@school.com
D3: Quiz 1
E3: 12
F3: 20
G3: Functions,Vectors
H3: Quiz 2
I3: 14
J3: 20
K3: Limits,Continuity
L3: 75
M3: High
N3: Yes
```

### 4. Continue Adding Rows
Add one row per student. You can have 10s or 100s of students.

### 5. Save the File
- **Save As:** `Grade10_Mathematics_Q1.xlsx`
- **Format:** Excel Workbook (.xlsx)
- **Location:** Any location on your computer

### 6. Upload in Performance Tracker
1. Go to LearnX → Teacher Dashboard → Performance Tracker
2. Select Grade: "Grade 10"
3. Enter Subject: "Mathematics"
4. Click "Select Excel File" and choose your file
5. Click "Upload Excel"
6. Wait for success message

## Important Notes

### About Student IDs
- Must be **UNIQUE** for each student
- Cannot contain spaces or special characters
- Examples: ST001, S101, 2024-001, CS_A_001
- If a student with this ID already exists, their record will be updated (not replaced)

### About Topics
- Separate multiple topics with **commas**
- ✅ Correct: `Algebra,Trigonometry,Calculus`
- ✅ Also correct: `Algebra, Trigonometry, Calculus` (spaces okay)
- ❌ Wrong: `Algebra Trigonometry Calculus` (no commas)
- ❌ Wrong: `Algebra | Trigonometry | Calculus` (wrong separator)

### About Test Marks
- **Marks Obtained:** Actual score the student got
- **Total Marks:** Out of how many marks
- **Percentage Calculated Automatically:** (18/20)*100 = 90%
- Both fields are required if you want this test counted

### About Topics Detection (Weak/Strong)
- **Weak Topics:** Student scores < 50% average in this topic
- **Strong Topics:** Student scores ≥ 50% average in this topic
- System analyzes **all test scores** for this student
- Topics appearing in multiple tests get better analysis

### About Attendance
- Enter as **percentage (0-100)**
- Examples: 85, 90, 95
- If not provided, defaults to 75%

### About Income
- Options: `Low`, `Middle`, `High`
- Used for socio-economic analysis
- If not provided, defaults to `Middle`

### About Fee Paid
- Options: `Yes` or `No`
- Used for financial analysis
- If not provided, defaults to `No`

## Example Spreadsheet

**Complete Example with 3 Students:**

| studentId | fullName | email | test1_name | test1_marks | test1_total | test1_topics | test2_name | test2_marks | test2_total | test2_topics | attendance | income | feePaid |
|-----------|----------|-------|-----------|-------------|------------|------------|-----------|-------------|------------|------------|----------|--------|----------|
| ST001 | Rajesh Kumar | rajesh@s.com | Mid-Term | 75 | 100 | Algebra,Functions | Final | 82 | 100 | Calculus,Vectors | 90 | Middle | Yes |
| ST002 | Priya Sharma | priya@s.com | Mid-Term | 55 | 100 | Algebra,Functions | Final | 62 | 100 | Calculus,Vectors | 72 | High | Yes |
| ST003 | Arun Patel | arun@s.com | Mid-Term | 40 | 100 | Algebra,Functions | Final | 48 | 100 | Calculus,Vectors | 60 | Low | No |

**What the system will see:**

**Rajesh:** 
- Performance Score: ~82%
- Weak Topics: None (all > 50%)
- Strong Topics: Algebra, Functions, Calculus, Vectors
- Prediction: Safe ✅

**Priya:**
- Performance Score: ~59%
- Weak Topics: Calculus (62% is borderline), Functions (55% is weak)
- Strong Topics: Algebra, Vectors
- Prediction: Warning ⚠️

**Arun:**
- Performance Score: ~44%
- Weak Topics: Algebra, Functions, Calculus, Vectors (all < 50%)
- Strong Topics: None
- Prediction: At Risk 🔴

## Common Mistakes

### ❌ Don't Do This

1. **Using semicolons instead of commas for topics:**
   ```
   ❌ test1_topics: Algebra;Trigonometry;Calculus
   ✅ test1_topics: Algebra,Trigonometry,Calculus
   ```

2. **Mixing spaces in student IDs:**
   ```
   ❌ studentId: ST 001
   ✅ studentId: ST001
   ```

3. **Having different column names:**
   ```
   ❌ Student_ID (wrong - should be studentId)
   ❌ Full Name (wrong - should be fullName)
   ✅ fullName
   ```

4. **Forgetting headers:**
   The first row MUST have column names

5. **Blank rows in the middle:**
   Don't have empty rows between student data

6. **Storing percentages instead of marks:**
   ```
   ❌ test1_marks: 85% (wrong format)
   ✅ test1_marks: 85
   ```

## What Happens After Upload

### Data Processing
1. System **reads Excel file**
2. **Creates accounts** for new students (if needed)
3. **Fetches quiz marks** from app database (by studentId)
4. **Fetches streaks** from app database (by studentId)
5. **Combines all data** - Excel + App data
6. **Identifies weak topics** (< 50% average)
7. **Calculates performance score** (Exam 60% + Quiz 30% + Streak 10%)
8. **Calls ML model** for risk prediction
9. **Saves to database**
10. **Updates dashboard** with new data

### What You'll See
- Success message: "Processed X students"
- Dashboard updates with new data
- Topic chart updates
- Student list updates
- At-risk alerts appear (if any)

## Adding More Tests Later

When you have another test:
1. Create new Excel file with `test3_*` columns
2. Same student IDs as before
3. Upload again
4. System will **APPEND** new tests to existing records
5. **Predictions automatically recalculate**
6. Dashboard shows updated metrics

## For Multiple Classes

Create separate Excel files per class:
- `Grade10_A_Mathematics.xlsx` - Grade 10-A class
- `Grade10_B_Mathematics.xlsx` - Grade 10-B class
- `Grade11_CS_Physics.xlsx` - Grade 11 CS branch Physics

Upload each separately:
1. Select different grade/subject for each upload
2. System keeps them separate
3. Compare class performance

## Troubleshooting

### "No valid data found"
- Ensure Excel file has headers in first row
- Ensure data starts from row 2
- Check file format (.xlsx, .xls, or .csv)

### "studentId required"
- Column named exactly `studentId` (case-sensitive)
- Ensure all rows have a value in this column

### Students not appearing in dashboard
- Reload browser page
- Check grade/subject selection matches upload
- Verify upload succeeded (success message displayed)

### Weak topics showing incorrect
- Check topic names in Excel (exact spelling matters)
- Topics must appear in multiple tests to be accurately classified
- Need at least 2-3 tests for accurate weak topic detection

## Performance Tips

- **For <100 students:** Single Excel file is fine
- **For >100 students:** Split into multiple files by grade/section
- **For multiple schools:** Create separate subject folders
- **Keep backups:** Save a copy of each uploaded file

## Integration with App Data

### How It Works
1. **Excel has:** Test scores, topics, attendance, income, fee
2. **App database has:** Quiz marks, streaks, other quiz results
3. **System merges by:** Student ID

### Example:
```
Excel data: ST001 scored 75 in Math test (Quiz 1)
App data: ST001 scored 85 in Math quiz from quiz system
         ST001 has 14-day streak

Merged data for dashboard:
- Quiz scores from Excel: 75%
- Quiz scores from app: 85%
- Average quiz percentage: 80%
- Streak: 14 days
- Performance score: (Math test 60% + Quizzes 30% + Streak 10%)
```

## Questions?

Email format questions to: teacher-support@learnx.local

Common issues are documented in: `PERFORMANCE_TRACKER_GUIDE.md`
