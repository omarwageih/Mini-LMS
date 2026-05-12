-- =============================================
--  Mini LMS — Complete Database Script
--  CSE 301: Database Systems | Spring 2026
--  MUST — Computer & Software Engineering Dept.
--
--  HOW TO USE:
--  1. Open SQL Server Management Studio (SSMS)
--  2. Connect to your server
--  3. Run this entire file to create & populate the database
-- =============================================


-- =============================================
--  PHASE 4: DATABASE & SCHEMA CREATION (DDL)
-- =============================================

CREATE DATABASE MiniLMS;
GO

USE MiniLMS;
GO

-- ---------------------------------
-- Core user table (Superclass)
-- ---------------------------------
CREATE TABLE Users (
    UserID       INT           IDENTITY(1,1) PRIMARY KEY,
    FullName     VARCHAR(100)  NOT NULL,
    Email        VARCHAR(100)  UNIQUE NOT NULL,
    Password     VARCHAR(255)  NOT NULL,
    Phone        VARCHAR(20),
    IsActive     BIT           DEFAULT 1,
    UserType     VARCHAR(20)   CHECK (UserType IN ('Instructor', 'Assistant', 'Student')),
    CreatedAt    DATETIME      DEFAULT GETDATE(),
    ProfilePicture VARCHAR(MAX),
    ResetPasswordToken VARCHAR(255),
    ResetPasswordExpires DATETIME,
    FailedLoginAttempts INT DEFAULT 0,
    LockedUntil DATETIME NULL
);
GO

-- ---------------------------------
-- Role sub-tables (Specialization)
-- ---------------------------------
CREATE TABLE Instructors (
    UserID           INT          PRIMARY KEY,
    Specialization   VARCHAR(100),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

CREATE TABLE Assistants (
    UserID            INT         PRIMARY KEY,
    Office_Location   VARCHAR(100),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

CREATE TABLE Students (
    UserID         INT           PRIMARY KEY,
    Academic_Year  INT           CHECK (Academic_Year BETWEEN 1 AND 5),
    Major          VARCHAR(50),
    GPA            DECIMAL(3,2)  CHECK (GPA >= 0.00 AND GPA <= 4.00),
    StudentCode    VARCHAR(20)   UNIQUE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

-- ---------------------------------
-- Courses
-- ---------------------------------
CREATE TABLE Course (
    CourseID      INT           IDENTITY(1,1) PRIMARY KEY,
    Name          VARCHAR(100)  NOT NULL,
    Max_Marks     INT           NOT NULL,
    Description   VARCHAR(MAX),
    Picture       VARCHAR(255),
    InstructorID  INT,
    CreatedAt     DATETIME      DEFAULT GETDATE(),
    FOREIGN KEY (InstructorID) REFERENCES Instructors(UserID)
);
GO

-- M:N — Students enroll in many Courses
CREATE TABLE Enrollment (
    EnrollmentID  INT      IDENTITY(1,1) PRIMARY KEY,
    StudentID     INT      NOT NULL,
    CourseID      INT      NOT NULL,
    Grade         DECIMAL(5,2),
    EnrolledAt    DATETIME DEFAULT GETDATE(),
    UNIQUE (StudentID, CourseID),
    FOREIGN KEY (StudentID) REFERENCES Students(UserID) ON DELETE CASCADE,
    FOREIGN KEY (CourseID)  REFERENCES Course(CourseID)  ON DELETE CASCADE
);
GO

-- M:N — Assistants assist in many Courses
CREATE TABLE Course_Assistants (
    ID           INT  IDENTITY(1,1) PRIMARY KEY,
    AssistantID  INT  NOT NULL,
    CourseID     INT  NOT NULL,
    UNIQUE (AssistantID, CourseID),
    FOREIGN KEY (AssistantID) REFERENCES Assistants(UserID),
    FOREIGN KEY (CourseID)    REFERENCES Course(CourseID) ON DELETE CASCADE
);
GO

-- ---------------------------------
-- Course Content
-- ---------------------------------
CREATE TABLE StudyWeek (
    Week_ID      INT          IDENTITY(1,1) PRIMARY KEY,
    CourseID     INT          NOT NULL,
    Week_Number  INT          NOT NULL,
    Title        VARCHAR(100),
    StartDate    DATE,
    EndDate      DATE,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID) ON DELETE CASCADE
);
GO

CREATE TABLE Material (
    Material_ID  INT          IDENTITY(1,1) PRIMARY KEY,
    Week_ID      INT          NOT NULL,
    Title        VARCHAR(100) NOT NULL,
    Type         VARCHAR(50),
    FileURL      VARCHAR(255),
    Created_By   INT,
    CreatedAt    DATETIME     DEFAULT GETDATE(),
    FOREIGN KEY (Week_ID)    REFERENCES StudyWeek(Week_ID) ON DELETE CASCADE,
    FOREIGN KEY (Created_By) REFERENCES Users(UserID)
);
GO

-- ---------------------------------
-- Lectures & Attendance
-- ---------------------------------
CREATE TABLE Lecture (
    LectureID     INT          IDENTITY(1,1) PRIMARY KEY,
    Title         VARCHAR(100),
    Date          DATE         NOT NULL,
    Start_Time    TIME,
    End_Time      TIME,
    CourseID      INT          NOT NULL,
    InstructorID  INT          NOT NULL,
    Week_ID       INT,
    FOREIGN KEY (CourseID)     REFERENCES Course(CourseID) ON DELETE CASCADE,
    FOREIGN KEY (InstructorID) REFERENCES Instructors(UserID),
    FOREIGN KEY (Week_ID)      REFERENCES StudyWeek(Week_ID) ON DELETE SET NULL
);
GO

CREATE TABLE Attendance (
    AttendanceID  INT          IDENTITY(1,1) PRIMARY KEY,
    LectureID     INT          NOT NULL,
    StudentID     INT          NOT NULL,
    Status        VARCHAR(20)  CHECK (Status IN ('Present', 'Absent', 'Late', 'Excused')),
    Score         DECIMAL(5,2) DEFAULT 0.0,
    UNIQUE (LectureID, StudentID),
    FOREIGN KEY (LectureID)  REFERENCES Lecture(LectureID),
    FOREIGN KEY (StudentID)  REFERENCES Students(UserID) ON DELETE CASCADE
);
GO

-- ---------------------------------
-- Assignments & Submissions
-- ---------------------------------
CREATE TABLE Assignment (
    AssignmentID  INT           IDENTITY(1,1) PRIMARY KEY,
    CourseID      INT           NOT NULL,
    Title         VARCHAR(100)  NOT NULL,
    Description   VARCHAR(MAX),
    Deadline      DATETIME,
    Max_Score     DECIMAL(5,2)  NOT NULL,
    Created_By    INT,
    CreatedAt     DATETIME      DEFAULT GETDATE(),
    FOREIGN KEY (CourseID)   REFERENCES Course(CourseID) ON DELETE CASCADE,
    FOREIGN KEY (Created_By) REFERENCES Users(UserID)
);
GO

CREATE TABLE Submission (
    SubID              INT           IDENTITY(1,1) PRIMARY KEY,
    AssignmentID       INT           NOT NULL,
    StudentID          INT           NOT NULL,
    FilePath           VARCHAR(255),
    SubmissionContent  VARCHAR(MAX),
    Score              DECIMAL(5,2),
    Feedback           VARCHAR(MAX),
    CorrectedBy        INT,
    SubmittedAt        DATETIME      DEFAULT GETDATE(),
    UNIQUE (AssignmentID, StudentID),
    FOREIGN KEY (AssignmentID) REFERENCES Assignment(AssignmentID) ON DELETE CASCADE,
    FOREIGN KEY (StudentID)    REFERENCES Students(UserID)          ON DELETE CASCADE,
    FOREIGN KEY (CorrectedBy)  REFERENCES Users(UserID)
);
GO

-- ---------------------------------
-- Quizzes
-- ---------------------------------
CREATE TABLE Quizzes (
    QuizID        INT           IDENTITY(1,1) PRIMARY KEY,
    CourseID      INT           NOT NULL,
    Title         VARCHAR(100)  NOT NULL,
    Max_Score     DECIMAL(5,2)  NOT NULL,
    Quiz_Type     VARCHAR(50),
    InstructorID  INT,
    FOREIGN KEY (CourseID)      REFERENCES Course(CourseID) ON DELETE CASCADE,
    FOREIGN KEY (InstructorID)  REFERENCES Instructors(UserID)
);
GO

CREATE TABLE Quiz_Result (
    ResultID   INT           IDENTITY(1,1) PRIMARY KEY,
    QuizID     INT           NOT NULL,
    StudentID  INT           NOT NULL,
    Score      DECIMAL(5,2)  NOT NULL,
    UNIQUE (QuizID, StudentID),
    FOREIGN KEY (QuizID)    REFERENCES Quizzes(QuizID),
    FOREIGN KEY (StudentID) REFERENCES Students(UserID) ON DELETE CASCADE
);
GO

-- ---------------------------------
-- Aggregated Grade Ledger
-- ---------------------------------
CREATE TABLE Course_Grades (
    GradeID           INT           IDENTITY(1,1) PRIMARY KEY,
    StudentID         INT           NOT NULL,
    CourseID          INT           NOT NULL,
    AssignmentTotal   DECIMAL(5,2)  DEFAULT 0.0,
    QuizTotal         DECIMAL(5,2)  DEFAULT 0.0,
    AttendanceTotal   DECIMAL(5,2)  DEFAULT 0.0,
    FinalGrade        DECIMAL(5,2)  DEFAULT 0.0,
    UNIQUE (StudentID, CourseID),
    FOREIGN KEY (StudentID) REFERENCES Students(UserID) ON DELETE CASCADE,
    FOREIGN KEY (CourseID)  REFERENCES Course(CourseID)  ON DELETE CASCADE
);
GO

-- ---------------------------------
-- Course Materials (General)
-- ---------------------------------
CREATE TABLE CourseMaterials (
    MaterialID INT IDENTITY(1,1) PRIMARY KEY,
    CourseID INT NOT NULL,
    Title VARCHAR(200) NOT NULL,
    Description VARCHAR(500),
    FileUrl VARCHAR(500),
    FileType VARCHAR(50),
    UploadedBy INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID) ON DELETE CASCADE,
    FOREIGN KEY (UploadedBy) REFERENCES Users(UserID)
);
GO

-- ---------------------------------
-- Announcements
-- ---------------------------------
CREATE TABLE Announcements (
    AnnouncementID INT IDENTITY(1,1) PRIMARY KEY,
    CourseID INT NOT NULL,
    Title VARCHAR(200) NOT NULL,
    Content VARCHAR(MAX) NOT NULL,
    PostedBy INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID) ON DELETE CASCADE,
    FOREIGN KEY (PostedBy) REFERENCES Users(UserID)
);
GO

-- ---------------------------------
-- Discussions
-- ---------------------------------
CREATE TABLE DiscussionPosts (
    PostID      INT           IDENTITY(1,1) PRIMARY KEY,
    CourseID    INT           NOT NULL,
    UserID      INT           NOT NULL,
    Title       NVARCHAR(200) NOT NULL,
    Content     NVARCHAR(MAX) NOT NULL,
    IsPinned    BIT           DEFAULT 0,
    CreatedAt   DATETIME      DEFAULT GETDATE(),
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID) ON DELETE CASCADE,
    FOREIGN KEY (UserID)   REFERENCES Users(UserID)
);
GO

CREATE TABLE DiscussionReplies (
    ReplyID     INT           IDENTITY(1,1) PRIMARY KEY,
    PostID      INT           NOT NULL,
    UserID      INT           NOT NULL,
    Content     NVARCHAR(MAX) NOT NULL,
    CreatedAt   DATETIME      DEFAULT GETDATE(),
    FOREIGN KEY (PostID) REFERENCES DiscussionPosts(PostID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

-- ---------------------------------
-- Direct Messaging
-- ---------------------------------
CREATE TABLE Messages (
    MessageID    INT           IDENTITY(1,1) PRIMARY KEY,
    SenderID     INT           NOT NULL,
    ReceiverID   INT           NOT NULL,
    Content      NVARCHAR(MAX) NOT NULL,
    IsRead       BIT           DEFAULT 0,
    CreatedAt    DATETIME      DEFAULT GETDATE(),
    FOREIGN KEY (SenderID)   REFERENCES Users(UserID),
    FOREIGN KEY (ReceiverID) REFERENCES Users(UserID)
);
GO

-- ---------------------------------
-- Notifications
-- ---------------------------------
CREATE TABLE Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Message NVARCHAR(MAX),
    Link NVARCHAR(500),
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

-- ---------------------------------
-- Audit Log
-- ---------------------------------
CREATE TABLE AuditLog (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT,
    Action NVARCHAR(100) NOT NULL,
    Details NVARCHAR(MAX),
    IPAddress NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE SET NULL
);
GO

-- =============================================
--  PHASE 5: SAMPLE DATA (DML — INSERT)
--  All passwords = '123456' (bcrypt, 10 rounds)
-- =============================================

-- ── Seed Instructor ──────────────────────────
INSERT INTO Users   (FullName, Email, Password, UserType)
VALUES ('Dr. Abdelhamid Sharaf', 'dr@mini.edu.eg', '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Instructor');

INSERT INTO Instructors (UserID, Specialization)
VALUES (SCOPE_IDENTITY(), 'Database Systems');
GO

-- ── Seed 3 Assistants ────────────────────────
INSERT INTO Users (FullName, Email, Password, UserType) VALUES
('Eng. Bilal Elhlwany',  'bilal@mini.edu.eg',  '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Assistant'),
('Eng. Joumana Emad',    'joumana@mini.edu.eg', '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Assistant'),
('Eng. Khaled Farouk',   'khaled@mini.edu.eg',  '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Assistant');

INSERT INTO Assistants (UserID, Office_Location)
SELECT UserID, 'Lab C-201'
FROM   Users
WHERE  Email IN ('bilal@mini.edu.eg', 'joumana@mini.edu.eg', 'khaled@mini.edu.eg');
GO

-- ── Seed 15 Students ─────────────────────────
INSERT INTO Users (FullName, Email, Password, UserType) VALUES
('Ahmed Ali',      'ahmed@std.mini.edu.eg',   '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Sara Youssef',   'sara@std.mini.edu.eg',    '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Omar Khaled',    'omar@std.mini.edu.eg',    '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Mona Hassan',    'mona@std.mini.edu.eg',    '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Karim Nabil',    'karim@std.mini.edu.eg',   '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Nour Gamal',     'nour@std.mini.edu.eg',    '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Youssef Tarek',  'youssef@std.mini.edu.eg', '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Salma Wael',     'salma@std.mini.edu.eg',   '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Mahmoud Saeed',  'mahmoud@std.mini.edu.eg', '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Hana Mostafa',   'hana@std.mini.edu.eg',    '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Ziad Ibrahim',   'ziad@std.mini.edu.eg',    '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Laila Amr',      'laila@std.mini.edu.eg',   '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Tarek Hisham',   'tarekh@std.mini.edu.eg',  '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Farah Ezzat',    'farah@std.mini.edu.eg',   '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student'),
('Mostafa Kamal',  'mostafa@std.mini.edu.eg', '$2b$10$oTEvN6lb9KQ8g6SvFF1m8OD/iHQGHIOp7e.03Ew.16d3jJHng01Um', 'Student');

INSERT INTO Students (UserID, Academic_Year, Major, GPA)
SELECT UserID,
       (ABS(CHECKSUM(NEWID())) % 4) + 1,
       CASE (ABS(CHECKSUM(NEWID())) % 4)
           WHEN 0 THEN 'Computer Science'
           WHEN 1 THEN 'Software Engineering'
           WHEN 2 THEN 'Artificial Intelligence'
           ELSE        'Data Science'
       END,
       CAST(ROUND(2.0 + (ABS(CHECKSUM(NEWID())) % 200) / 100.0, 2) AS DECIMAL(3,2))
FROM   Users
WHERE  UserType = 'Student';
GO

-- ── Seed 5 Courses ───────────────────────────
DECLARE @InstrID INT = (SELECT TOP 1 UserID FROM Instructors ORDER BY UserID);

INSERT INTO Course (Name, Max_Marks, Description, InstructorID) VALUES
('Database Systems',   100, 'CSE 301 — Core concepts of relational databases, SQL, and design.', @InstrID),
('Data Structures',    100, 'CSE 201 — Arrays, lists, trees, graphs, and complexity.',            @InstrID),
('Software Engineering',100,'CSE 401 — SDLC, UML, Agile, and testing methodologies.',            @InstrID),
('Operating Systems',  100, 'CSE 305 — Processes, scheduling, memory, and file systems.',         @InstrID),
('Computer Networks',  100, 'CSE 405 — OSI model, TCP/IP, routing, and security.',                @InstrID);
GO

-- ── Assign Assistants to Course 1 ────────────
INSERT INTO Course_Assistants (AssistantID, CourseID)
SELECT a.UserID, (SELECT TOP 1 CourseID FROM Course WHERE Name = 'Database Systems')
FROM   Assistants a;
GO

-- ── Enroll all Students in first 2 Courses ───
INSERT INTO Enrollment (StudentID, CourseID)
SELECT s.UserID, c.CourseID
FROM   Students s
CROSS JOIN (
    SELECT TOP 2 CourseID FROM Course ORDER BY CourseID
) c
WHERE NOT EXISTS (
    SELECT 1 FROM Enrollment WHERE StudentID = s.UserID AND CourseID = c.CourseID
);
GO

-- ── Seed Study Weeks for Database Systems ────
DECLARE @c1 INT = (SELECT TOP 1 CourseID FROM Course WHERE Name = 'Database Systems');
INSERT INTO StudyWeek (CourseID, Week_Number, Title, StartDate, EndDate) VALUES
(@c1, 1, 'Introduction to Databases',  '2026-02-01', '2026-02-07'),
(@c1, 2, 'ER Diagram Design',          '2026-02-08', '2026-02-14'),
(@c1, 3, 'ER-to-Relational Mapping',   '2026-02-15', '2026-02-21'),
(@c1, 4, 'SQL DDL & Constraints',      '2026-02-22', '2026-02-28'),
(@c1, 5, 'SQL DML & Queries',          '2026-03-01', '2026-03-07');
GO

-- ── Seed Materials ───────────────────────────
DECLARE @w1 INT = (SELECT TOP 1 Week_ID FROM StudyWeek WHERE Title = 'Introduction to Databases');
DECLARE @w2 INT = (SELECT TOP 1 Week_ID FROM StudyWeek WHERE Title = 'ER Diagram Design');
INSERT INTO Material (Week_ID, Title, Type, FileURL) VALUES
(@w1, 'Week 1 — Lecture Slides',  'PDF',   '/uploads/materials/week1-slides.pdf'),
(@w1, 'Week 1 — Intro Video',     'Video', 'https://youtube.com/watch?v=db-intro'),
(@w2, 'Week 2 — ER Diagram Notes','PDF',   '/uploads/materials/week2-er-notes.pdf'),
(@w2, 'Week 2 — ERDPlus Tutorial','Video', 'https://youtube.com/watch?v=erdplus');
GO

-- ── Seed Assignments ─────────────────────────
DECLARE @c1 INT   = (SELECT TOP 1 CourseID FROM Course WHERE Name = 'Database Systems');
DECLARE @instrBy INT = (SELECT TOP 1 UserID FROM Instructors ORDER BY UserID);
INSERT INTO Assignment (CourseID, Title, Description, Deadline, Max_Score, Created_By) VALUES
(@c1, 'Phase 1 — ER Diagram',      'Design and submit your ER Diagram using draw.io',  DATEADD(day, 7,  GETDATE()), 15, @instrBy),
(@c1, 'Phase 2 — SQL Scripts',     'Submit DDL + sample data SQL scripts',              DATEADD(day, 14, GETDATE()), 15, @instrBy),
(@c1, 'Phase 3 — Full Application','Submit your working full-stack application source', DATEADD(day, 21, GETDATE()), 20, @instrBy);
GO

-- ── Seed Submissions (first 5 students) ──────
DECLARE @a1  INT = (SELECT TOP 1 AssignmentID FROM Assignment WHERE Title = 'Phase 1 — ER Diagram');
DECLARE @asst INT = (SELECT TOP 1 UserID FROM Assistants ORDER BY UserID);
INSERT INTO Submission (AssignmentID, StudentID, FilePath, Score, Feedback, CorrectedBy)
SELECT TOP 5
    @a1,
    s.UserID,
    '/uploads/submissions/er-diagram.pdf',
    CAST(10 + (ABS(CHECKSUM(NEWID())) % 5) AS DECIMAL(5,2)),
    'Good work. Please add cardinality labels.',
    @asst
FROM Students s
ORDER BY s.UserID;
GO

-- ── Seed Quizzes ─────────────────────────────
DECLARE @c1 INT  = (SELECT TOP 1 CourseID FROM Course WHERE Name = 'Database Systems');
DECLARE @instr INT = (SELECT TOP 1 UserID FROM Instructors ORDER BY UserID);
INSERT INTO Quizzes (CourseID, Title, Max_Score, Quiz_Type, InstructorID) VALUES
(@c1, 'Quiz 1 — DB Concepts',  10, 'MCQ',   @instr),
(@c1, 'Quiz 2 — SQL Queries',  10, 'Mixed', @instr);
GO


-- =============================================
--  PHASE 5: SQL QUERIES (10 Complex SELECTs)
-- =============================================

/* 1. INNER JOIN + ORDER BY
   List all students enrolled in Database Systems, ordered by GPA descending */
SELECT u.FullName, s.GPA, s.Major, c.Name AS CourseName
FROM   Users u
INNER JOIN Students   s ON u.UserID    = s.UserID
INNER JOIN Enrollment e ON s.UserID    = e.StudentID
INNER JOIN Course     c ON e.CourseID  = c.CourseID
WHERE  c.Name = 'Database Systems'
ORDER  BY s.GPA DESC;

/* 2. LEFT JOIN + COUNT
   Count enrolled students per course, including courses with no students */
SELECT c.Name AS CourseName, COUNT(e.StudentID) AS TotalStudents
FROM   Course c
LEFT JOIN Enrollment e ON c.CourseID = e.CourseID
GROUP BY c.Name;

/* 3. SUBQUERY
   Find students whose GPA is above the class average */
SELECT u.FullName, s.GPA
FROM   Users u
JOIN   Students s ON u.UserID = s.UserID
WHERE  s.GPA > (SELECT AVG(GPA) FROM Students)
ORDER  BY s.GPA DESC;

/* 4. AGGREGATE FUNCTIONS
   Show the highest, lowest, and average score per assignment */
SELECT a.Title,
       MAX(sub.Score) AS HighestScore,
       MIN(sub.Score) AS LowestScore,
       AVG(sub.Score) AS AverageScore,
       COUNT(sub.SubID) AS TotalSubmissions
FROM   Assignment a
JOIN   Submission sub ON a.AssignmentID = sub.AssignmentID
GROUP  BY a.Title;

/* 5. GROUP BY + HAVING
   Show only courses that have more than 5 enrolled students */
SELECT c.Name AS CourseName, COUNT(e.StudentID) AS EnrolledCount
FROM   Course c
JOIN   Enrollment e ON c.CourseID = e.CourseID
GROUP  BY c.Name
HAVING COUNT(e.StudentID) > 5;

/* 6. RIGHT JOIN
   List all assignments and any submissions (NULL if not yet submitted) */
SELECT a.Title AS Assignment, u.FullName AS Student, sub.Score
FROM   Submission sub
RIGHT JOIN Assignment a ON sub.AssignmentID = a.AssignmentID
LEFT  JOIN Users u       ON sub.StudentID   = u.UserID;

/* 7. MULTI-TABLE JOIN
   Full grading report: student name, assignment, score, and percentage */
SELECT u.FullName AS Student,
       a.Title    AS Assignment,
       sub.Score,
       a.Max_Score,
       CAST(CASE WHEN a.Max_Score > 0 THEN sub.Score / a.Max_Score * 100 ELSE 0 END AS DECIMAL(5,1)) AS Percentage
FROM   Users u
JOIN   Submission sub ON u.UserID        = sub.StudentID
JOIN   Assignment a   ON sub.AssignmentID = a.AssignmentID
WHERE  a.CourseID = (SELECT TOP 1 CourseID FROM Course WHERE Name = 'Database Systems')
ORDER  BY Percentage DESC;

/* 8. GROUP BY + SUM
   Total max marks available per course */
SELECT c.Name AS CourseName, SUM(a.Max_Score) AS TotalAssignmentMarks
FROM   Course c
JOIN   Assignment a ON c.CourseID = a.CourseID
GROUP  BY c.Name;

/* 9. DATE FILTERING
   Find assignments due in the next 30 days */
SELECT a.Title, c.Name AS Course, a.Deadline
FROM   Assignment a
JOIN   Course     c ON a.CourseID = c.CourseID
WHERE  a.Deadline BETWEEN GETDATE() AND DATEADD(day, 30, GETDATE())
ORDER  BY a.Deadline ASC;

/* 10. NESTED SUBQUERY
    Find the student with the highest score on the first assignment */
SELECT u.FullName, sub.Score
FROM   Users u
JOIN   Submission sub ON u.UserID = sub.StudentID
WHERE  sub.AssignmentID = (SELECT TOP 1 AssignmentID FROM Assignment ORDER BY AssignmentID)
  AND  sub.Score = (
       SELECT MAX(Score) FROM Submission
       WHERE  AssignmentID = (SELECT TOP 1 AssignmentID FROM Assignment ORDER BY AssignmentID)
  );


-- =============================================
--  PHASE 5: DML — UPDATE & DELETE
-- =============================================

-- UPDATE 1: Correct a student's GPA after grade appeal
UPDATE Students
SET    GPA = 3.95
WHERE  UserID = (SELECT TOP 1 UserID FROM Students ORDER BY UserID);

-- UPDATE 2: Extend assignment deadline by 3 days
UPDATE Assignment
SET    Deadline = DATEADD(day, 3, Deadline)
WHERE  Title = 'Phase 2 — SQL Scripts';

-- DELETE 1: Remove a submission that was uploaded by mistake
DELETE FROM Submission
WHERE SubID = (SELECT TOP 1 SubID FROM Submission ORDER BY SubmittedAt DESC);

-- DELETE 2: Unenroll the last enrolled student from Operating Systems
DELETE FROM Enrollment
WHERE  StudentID = (SELECT TOP 1 UserID FROM Students ORDER BY UserID DESC)
  AND  CourseID  = (SELECT TOP 1 CourseID FROM Course WHERE Name = 'Operating Systems');


-- =============================================
--  PHASE 5: VIEWS
-- =============================================

GO
-- View 1: Full student-course dashboard (used by the app internally)
CREATE VIEW vw_StudentDashboard AS
SELECT
    u.UserID,
    u.FullName,
    u.Email,
    s.GPA,
    s.Major,
    s.Academic_Year,
    c.Name         AS CourseName,
    c.CourseID,
    e.Grade        AS CourseGrade,
    e.EnrolledAt
FROM Users u
JOIN Students   s ON u.UserID   = s.UserID
JOIN Enrollment e ON s.UserID   = e.StudentID
JOIN Course     c ON e.CourseID = c.CourseID;
GO

-- View 2: Course statistics summary
CREATE VIEW vw_CourseStatistics AS
SELECT
    c.CourseID,
    c.Name                              AS CourseName,
    COUNT(DISTINCT e.StudentID)         AS TotalStudents,
    COUNT(DISTINCT a.AssignmentID)      AS TotalAssignments,
    AVG(sub.Score)                      AS AvgSubmissionScore
FROM Course c
LEFT JOIN Enrollment e ON c.CourseID  = e.CourseID
LEFT JOIN Assignment a ON c.CourseID  = a.CourseID
LEFT JOIN Submission sub ON a.AssignmentID = sub.AssignmentID
GROUP BY c.CourseID, c.Name;
GO


-- =============================================
--  PHASE 5: STORED PROCEDURES
-- =============================================

-- SP 1: Safely enroll a student (checks for duplicates first)
CREATE PROCEDURE sp_EnrollStudent
    @StudentID INT,
    @CourseID  INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (
        SELECT 1 FROM Enrollment
        WHERE StudentID = @StudentID AND CourseID = @CourseID
    )
    BEGIN
        INSERT INTO Enrollment (StudentID, CourseID)
        VALUES (@StudentID, @CourseID);
        PRINT 'Student enrolled successfully.';
    END
    ELSE
        PRINT 'Student is already enrolled in this course.';
END;
GO

-- SP 2: Grade a submission (used by Assistants)
CREATE PROCEDURE sp_GradeSubmission
    @SubmissionID INT,
    @Score        DECIMAL(5,2),
    @Feedback     VARCHAR(MAX),
    @AssistantID  INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Submission
    SET    Score       = @Score,
           Feedback    = @Feedback,
           CorrectedBy = @AssistantID
    WHERE  SubID = @SubmissionID;

    PRINT 'Submission graded successfully.';
END;
GO
