/* 
============================================================
DATABASE: MUST_University_LMS
DESCRIPTION: Final Unified Schema for Misr University for Science and Technology (MUST)
UPGRADES: Unicode (Arabic), Soft Deletes, Hybrid Grading, 
          Performance Indexing, Dashboard Views
============================================================
*/

-- 1. Create Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'MUST_University_LMS')
BEGIN
    CREATE DATABASE MUST_University_LMS;
END
GO

USE MUST_University_LMS;
GO

-- ==========================================
-- 2. FOUNDATION LAYER (Users)
-- ==========================================

CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20),
    IsActive BIT DEFAULT 1,
    UserType NVARCHAR(20) CHECK (UserType IN (N'Instructor', N'Assistant', N'Student')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    DeletedAt DATETIME NULL, -- Soft Delete
    CreatedBy INT NULL,
    
    CONSTRAINT FK_Users_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);
GO

-- ==========================================
-- 3. ROLE LAYER (Instructors, Assistants, Students)
-- ==========================================

CREATE TABLE Instructors (
    UserID INT PRIMARY KEY,
    Specialization NVARCHAR(100),
    DeletedAt DATETIME NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

CREATE TABLE Assistants (
    UserID INT PRIMARY KEY,
    OfficeLocation NVARCHAR(100),
    DeletedAt DATETIME NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

CREATE TABLE Students (
    UserID INT PRIMARY KEY,
    AcademicYear INT CHECK (AcademicYear BETWEEN 1 AND 5),
    Major NVARCHAR(100),
    GPA DECIMAL(3,2) CHECK (GPA >= 0.00 AND GPA <= 4.00),
    Status NVARCHAR(20) DEFAULT N'Active',
    DeletedAt DATETIME NULL,
    
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

-- ==========================================
-- 4. CORE LAYER (Courses, Enrollment, Junctions)
-- ==========================================

CREATE TABLE Courses (
    CourseID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    MaxMarks INT DEFAULT 100,
    InstructorID INT,
    DeletedAt DATETIME NULL,
    FOREIGN KEY (InstructorID) REFERENCES Instructors(UserID)
);
GO

CREATE TABLE Enrollment (
    EnrollmentID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    EnrolledAt DATETIME DEFAULT GETDATE(),
    UNIQUE (StudentID, CourseID),
    FOREIGN KEY (StudentID) REFERENCES Students(UserID),
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
);
GO

CREATE TABLE Course_Assistants (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    AssistantID INT NOT NULL,
    CourseID INT NOT NULL,
    UNIQUE (AssistantID, CourseID),
    FOREIGN KEY (AssistantID) REFERENCES Assistants(UserID),
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
);
GO

-- ==========================================
-- 5. CONTENT LAYER (Weeks, Materials, Lectures)
-- ==========================================

CREATE TABLE StudyWeeks (
    WeekID INT IDENTITY(1,1) PRIMARY KEY,
    CourseID INT NOT NULL,
    WeekNumber INT NOT NULL,
    Title NVARCHAR(100),
    StartDate DATE,
    EndDate DATE,
    DeletedAt DATETIME NULL,
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
);
GO

CREATE TABLE Materials (
    MaterialID INT IDENTITY(1,1) PRIMARY KEY,
    WeekID INT NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    FilePath NVARCHAR(500) NULL, -- Document Management
    FileSize INT NULL,           -- Document Management
    CreatedBy INT,
    DeletedAt DATETIME NULL,
    FOREIGN KEY (WeekID) REFERENCES StudyWeeks(WeekID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);
GO

CREATE TABLE Lectures (
    LectureID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(100),
    LectureDate DATE NOT NULL,
    StartTime TIME,
    EndTime TIME,
    CourseID INT NOT NULL,
    InstructorID INT NOT NULL,
    DeletedAt DATETIME NULL,
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID),
    FOREIGN KEY (InstructorID) REFERENCES Instructors(UserID)
);
GO

-- ==========================================
-- 6. ACTIVITY LAYER (Attendance, Assignments, Quizzes)
-- ==========================================

CREATE TABLE Attendance (
    AttendanceID INT IDENTITY(1,1) PRIMARY KEY,
    LectureID INT NOT NULL,
    StudentID INT NOT NULL,
    Status NVARCHAR(20) CHECK (Status IN (N'Present', N'Absent', N'Late', N'Excused')),
    Score DECIMAL(5,2) DEFAULT 0.0,
    UNIQUE (LectureID, StudentID),
    FOREIGN KEY (LectureID) REFERENCES Lectures(LectureID),
    FOREIGN KEY (StudentID) REFERENCES Students(UserID)
);
GO

CREATE TABLE Assignments (
    AssignmentID INT IDENTITY(1,1) PRIMARY KEY,
    CourseID INT NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    MaxScore DECIMAL(5,2) NOT NULL,
    Deadline DATETIME,
    GradingMethod NVARCHAR(20) DEFAULT N'Manual' CHECK (GradingMethod IN (N'Manual', N'Automatic')),
    CreatedBy INT,
    DeletedAt DATETIME NULL,
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);
GO

CREATE TABLE Submissions (
    SubmissionID INT IDENTITY(1,1) PRIMARY KEY,
    AssignmentID INT NOT NULL,
    StudentID INT NOT NULL,
    Score DECIMAL(5,2),
    CorrectedBy INT,
    SubmittedAt DATETIME DEFAULT GETDATE(),
    UNIQUE (AssignmentID, StudentID),
    FOREIGN KEY (AssignmentID) REFERENCES Assignments(AssignmentID),
    FOREIGN KEY (StudentID) REFERENCES Students(UserID),
    FOREIGN KEY (CorrectedBy) REFERENCES Users(UserID)
);
GO

CREATE TABLE Quizzes (
    QuizID INT IDENTITY(1,1) PRIMARY KEY,
    CourseID INT NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    MaxScore DECIMAL(5,2) NOT NULL,
    QuizType NVARCHAR(50),
    GradingMethod NVARCHAR(20) DEFAULT N'Automatic' CHECK (GradingMethod IN (N'Manual', N'Automatic')),
    InstructorID INT,
    DeletedAt DATETIME NULL,
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID),
    FOREIGN KEY (InstructorID) REFERENCES Instructors(UserID)
);
GO

CREATE TABLE Quiz_Results (
    ResultID INT IDENTITY(1,1) PRIMARY KEY,
    QuizID INT NOT NULL,
    StudentID INT NOT NULL,
    Score DECIMAL(5,2) NOT NULL,
    UNIQUE (QuizID, StudentID),
    FOREIGN KEY (QuizID) REFERENCES Quizzes(QuizID),
    FOREIGN KEY (StudentID) REFERENCES Students(UserID)
);
GO

-- ==========================================
-- 7. ANALYTICS LAYER (Grading)
-- ==========================================

CREATE TABLE Course_Grades (
    GradeID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    AssignmentTotal DECIMAL(5,2) DEFAULT 0.0,
    QuizTotal DECIMAL(5,2) DEFAULT 0.0,
    AttendanceTotal DECIMAL(5,2) DEFAULT 0.0,
    CalculatedGrade DECIMAL(5,2) DEFAULT 0.0,
    ManualOverrideGrade DECIMAL(5,2) NULL,
    UseManualGrade BIT DEFAULT 0, -- 1 = Use Manual, 0 = Use Calculated
    
    UNIQUE (StudentID, CourseID),
    FOREIGN KEY (StudentID) REFERENCES Students(UserID),
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
);
GO

-- ==========================================
-- 8. PERFORMANCE INDEXES
-- ==========================================

CREATE INDEX IX_Users_Email ON Users(Email) WHERE DeletedAt IS NULL;
CREATE INDEX IX_Enrollment_Student_Course ON Enrollment(StudentID, CourseID);
CREATE INDEX IX_Attendance_Student_Lecture ON Attendance(StudentID, LectureID);
CREATE INDEX IX_Submissions_Student_Assignment ON Submissions(StudentID, AssignmentID);
GO

-- ==========================================
-- 9. VIEWS & LOGIC
-- ==========================================

-- View for Instructor Dashboards
CREATE VIEW vw_InstructorDashboard AS
SELECT 
    C.Name AS CourseName,
    U.FullName AS InstructorName,
    COUNT(E.StudentID) AS EnrolledStudents,
    AVG(CASE WHEN CG.UseManualGrade = 1 THEN CG.ManualOverrideGrade ELSE CG.CalculatedGrade END) AS ClassAverageGrade
FROM Courses C
JOIN Instructors I ON C.InstructorID = I.UserID
JOIN Users U ON I.UserID = U.UserID
LEFT JOIN Enrollment E ON C.CourseID = E.CourseID
LEFT JOIN Course_Grades CG ON E.StudentID = CG.StudentID AND C.CourseID = CG.CourseID
WHERE C.DeletedAt IS NULL
GROUP BY C.Name, U.FullName;
GO

-- Stored Procedure for Grading Logic
CREATE PROCEDURE sp_SyncGrades
    @p_StudentID INT,
    @p_CourseID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Update calculated fields
    UPDATE Course_Grades
    SET 
        AssignmentTotal = (SELECT ISNULL(SUM(Score), 0) FROM Submissions S 
                           JOIN Assignments A ON S.AssignmentID = A.AssignmentID 
                           WHERE S.StudentID = @p_StudentID AND A.CourseID = @p_CourseID),
        QuizTotal = (SELECT ISNULL(SUM(R.Score), 0) FROM Quiz_Results R 
                     JOIN Quizzes Q ON R.QuizID = Q.QuizID 
                     WHERE R.StudentID = @p_StudentID AND Q.CourseID = @p_CourseID),
        AttendanceTotal = (SELECT ISNULL(SUM(Score), 0) FROM Attendance Att 
                           JOIN Lectures L ON Att.LectureID = L.LectureID 
                           WHERE Att.StudentID = @p_StudentID AND L.CourseID = @p_CourseID)
    WHERE StudentID = @p_StudentID AND CourseID = @p_CourseID;

    -- Update CalculatedGrade
    UPDATE Course_Grades
    SET CalculatedGrade = AssignmentTotal + QuizTotal + AttendanceTotal
    WHERE StudentID = @p_StudentID AND CourseID = @p_CourseID;
END;
GO

-- ==========================================
-- 10. MUSTAFA UNIVERSITY SEED DATA
-- ==========================================

-- A. Users
SET IDENTITY_INSERT Users ON;
INSERT INTO Users (UserID, FullName, Email, Password, Phone, UserType) VALUES
(1, N'Dr. Abdulhameed Sharaf', N'sharaf@eng.must.edu.eg', N'123', N'01011112222', N'Instructor'),
(2, N'Dr. Ahmed Khaled', N'ahmed@eng.must.edu.eg', N'123', N'01033334444', N'Instructor'),
(3, N'Dr. Mona Youssef', N'mona@eng.must.edu.eg', N'123', N'01255556666', N'Instructor'),
(4, N'Eng. Bilal Elhlwany', N'bilal@eng.must.edu.eg', N'123', N'01177778888', N'Assistant'),
(5, N'Eng. Sara Hassan', N'sara@eng.must.edu.eg', N'123', N'01599990000', N'Assistant'),
(6, N'ali mahmoud', N'ali@eng.must.edu.eg', N'123', N'01012345678', N'Student'),
(7, N'Omar Ali', N'omar@eng.must.edu.eg', N'123', N'01087654321', N'Student'),
(8, N'Karim Zaki', N'karim@eng.must.edu.eg', N'123', N'01223456789', N'Student'),
(9, N'Nour El Din', N'nour@eng.must.edu.eg', N'123', N'01134567890', N'Student'),
(10, N'Salma Ahmed', N'salma@eng.must.edu.eg', N'123', N'01545678901', N'Student');
SET IDENTITY_INSERT Users OFF;

-- B. Subclasses
INSERT INTO Instructors (UserID, Specialization) VALUES
(1, N'Database Systems'), (2, N'Software Engineering'), (3, N'Data Structures');
INSERT INTO Assistants (UserID, OfficeLocation) VALUES
(4, N'Building A - 302'), (5, N'Building B - 105');
INSERT INTO Students (UserID, AcademicYear, Major, GPA) VALUES
(6, 4, N'Computer Engineering', 3.85), (7, 3, N'Computer Engineering', 3.20),
(8, 4, N'Software Engineering', 2.90), (9, 2, N'Computer Science', 3.50),
(10, 4, N'Computer Engineering', 3.95);

-- C. Courses
SET IDENTITY_INSERT Courses ON;
INSERT INTO Courses (CourseID, Name, MaxMarks, InstructorID) VALUES
(1, N'CSE301: Database Systems', 100, 1),
(2, N'CSE405: AI Agents Architecture', 100, 1),
(3, N'SWE202: Software Engineering', 100, 2);
SET IDENTITY_INSERT Courses OFF;

-- D. Course_Assistants & Enrollment
INSERT INTO Course_Assistants (AssistantID, CourseID) VALUES (4, 1), (4, 2), (5, 3);
INSERT INTO Enrollment (StudentID, CourseID) VALUES (6, 1), (6, 2), (6, 3), (7, 1), (8, 2), (9, 3), (10, 1);

-- E. StudyWeeks & Materials
SET IDENTITY_INSERT StudyWeeks ON;
INSERT INTO StudyWeeks (WeekID, CourseID, WeekNumber, Title, StartDate, EndDate) VALUES
(1, 1, 1, N'Intro to Databases', '2026-02-15', '2026-02-21'),
(2, 1, 2, N'ER Modeling', '2026-02-22', '2026-02-28');
SET IDENTITY_INSERT StudyWeeks OFF;
INSERT INTO Materials (WeekID, Title, CreatedBy) VALUES (1, N'Lec 1 Slides', 1), (2, N'ERD Guide', 1);

-- F. Attendance & Grades Initialization
INSERT INTO Lectures (LectureDate, StartTime, EndTime, CourseID, InstructorID, Title) VALUES
('2026-02-16', '10:00', '12:00', 1, 1, N'Lec 1: Concepts');
INSERT INTO Attendance (LectureID, StudentID, Status, Score) VALUES (1, 6, N'Present', 2.0), (1, 7, N'Present', 2.0), (1, 10, N'Late', 1.0);
INSERT INTO Course_Grades (StudentID, CourseID, AttendanceTotal) VALUES (6, 1, 2.0), (7, 1, 2.0), (10, 1, 1.0);

-- G. Submissions & Results
SET IDENTITY_INSERT Assignments ON;
INSERT INTO Assignments (AssignmentID, CourseID, Title, MaxScore, CreatedBy) VALUES (1, 1, N'Phase 2: ERD', 15.0, 1);
SET IDENTITY_INSERT Assignments OFF;
INSERT INTO Submissions (AssignmentID, StudentID, Score, CorrectedBy) VALUES (1, 6, 15.0, 4), (1, 7, 13.5, 4), (1, 10, 14.0, 4);

SET IDENTITY_INSERT Quizzes ON;
INSERT INTO Quizzes (QuizID, CourseID, Title, MaxScore, QuizType, InstructorID) VALUES (1, 1, N'Midterm 1', 10.0, N'MCQ', 1);
SET IDENTITY_INSERT Quizzes OFF;
INSERT INTO Quiz_Results (QuizID, StudentID, Score) VALUES (1, 6, 10.0), (1, 7, 8.5), (1, 10, 9.0);
GO

-- FINAL: Run Logic Sync
EXEC sp_SyncGrades @p_StudentID = 6, @p_CourseID = 1;
EXEC sp_SyncGrades @p_StudentID = 7, @p_CourseID = 1;
EXEC sp_SyncGrades @p_StudentID = 10, @p_CourseID = 1;
GO

SELECT * FROM vw_InstructorDashboard;
GO
