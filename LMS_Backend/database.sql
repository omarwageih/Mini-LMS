-- =============================================
--  Mini LMS - Complete Database Schema
--  Run this in SSMS on your LMS database
-- =============================================

CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Phone VARCHAR(20),
    IsActive BIT DEFAULT 1,
    UserType VARCHAR(20) CHECK (UserType IN ('Instructor', 'Assistant', 'Student')),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE Instructors (
    UserID INT PRIMARY KEY,
    Specialization VARCHAR(100),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

CREATE TABLE Assistants (
    UserID INT PRIMARY KEY,
    Office_Location VARCHAR(100),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

CREATE TABLE Students (
    UserID INT PRIMARY KEY,
    Academic_Year INT CHECK (Academic_Year BETWEEN 1 AND 5),
    Major VARCHAR(50),
    GPA DECIMAL(3,2) CHECK (GPA >= 0.00 AND GPA <= 4.00),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

CREATE TABLE Course (
    CourseID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Max_Marks INT NOT NULL, 
    InstructorID INT,
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
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
);
GO

CREATE TABLE Course_Assistants (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    AssistantID INT NOT NULL,
    CourseID INT NOT NULL,
    UNIQUE (AssistantID, CourseID),
    FOREIGN KEY (AssistantID) REFERENCES Assistants(UserID),
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
);
GO

CREATE TABLE StudyWeek (
    Week_ID INT IDENTITY(1,1) PRIMARY KEY,
    CourseID INT NOT NULL,
    Week_Number INT NOT NULL,
    Title VARCHAR(100),
    StartDate DATE,
    EndDate DATE,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
);
GO

CREATE TABLE Material (
    Material_ID INT IDENTITY(1,1) PRIMARY KEY,
    Week_ID INT NOT NULL,
    Title VARCHAR(100) NOT NULL,
    Created_By INT,
    FOREIGN KEY (Week_ID) REFERENCES StudyWeek(Week_ID),
    FOREIGN KEY (Created_By) REFERENCES Users(UserID)
);
GO

CREATE TABLE Lecture (
    LectureID INT IDENTITY(1,1) PRIMARY KEY,
    Title VARCHAR(100),
    Date DATE NOT NULL,
    Start_Time TIME,
    End_Time TIME,
    CourseID INT NOT NULL,
    InstructorID INT NOT NULL,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID),
    FOREIGN KEY (InstructorID) REFERENCES Instructors(UserID)
);
GO

CREATE TABLE Attendance (
    AttendanceID INT IDENTITY(1,1) PRIMARY KEY,
    LectureID INT NOT NULL,
    StudentID INT NOT NULL,
    Status VARCHAR(20) CHECK (Status IN ('Present', 'Absent', 'Late', 'Excused')),
    Score DECIMAL(5,2) DEFAULT 0.0,
    UNIQUE (LectureID, StudentID), 
    FOREIGN KEY (LectureID) REFERENCES Lecture(LectureID),
    FOREIGN KEY (StudentID) REFERENCES Students(UserID)
);
GO

CREATE TABLE Assignment (
    AssignmentID INT IDENTITY(1,1) PRIMARY KEY,
    CourseID INT NOT NULL,
    Title VARCHAR(100) NOT NULL,
    Max_Score DECIMAL(5,2) NOT NULL,
    Deadline DATETIME,
    Created_By INT,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID),
    FOREIGN KEY (Created_By) REFERENCES Users(UserID)
);
GO

CREATE TABLE Submission (
    SubID INT IDENTITY(1,1) PRIMARY KEY,
    AssignmentID INT NOT NULL,
    StudentID INT NOT NULL,
    FilePath VARCHAR(255),              -- ← ADDED: for file upload
    Score DECIMAL(5,2),
    CorrectedBy INT,
    SubmittedAt DATETIME DEFAULT GETDATE(),
    UNIQUE (AssignmentID, StudentID),
    FOREIGN KEY (AssignmentID) REFERENCES Assignment(AssignmentID),
    FOREIGN KEY (StudentID) REFERENCES Students(UserID),
    FOREIGN KEY (CorrectedBy) REFERENCES Users(UserID)
);
GO

CREATE TABLE Quizzes (
    QuizID INT IDENTITY(1,1) PRIMARY KEY,
    CourseID INT NOT NULL,
    Title VARCHAR(100) NOT NULL,
    Max_Score DECIMAL(5,2) NOT NULL,
    Quiz_Type VARCHAR(50),
    InstructorID INT,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID),
    FOREIGN KEY (InstructorID) REFERENCES Instructors(UserID)
);
GO

CREATE TABLE Quiz_Result (
    ResultID INT IDENTITY(1,1) PRIMARY KEY,
    QuizID INT NOT NULL,
    StudentID INT NOT NULL,
    Score DECIMAL(5,2) NOT NULL,
    UNIQUE (QuizID, StudentID),
    FOREIGN KEY (QuizID) REFERENCES Quizzes(QuizID),
    FOREIGN KEY (StudentID) REFERENCES Students(UserID)
);
GO

CREATE TABLE Course_Grades (
    GradeID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    AssignmentTotal DECIMAL(5,2) DEFAULT 0.0,
    QuizTotal DECIMAL(5,2) DEFAULT 0.0,
    AttendanceTotal DECIMAL(5,2) DEFAULT 0.0,
    FinalGrade DECIMAL(5,2) DEFAULT 0.0,
    UNIQUE (StudentID, CourseID),
    FOREIGN KEY (StudentID) REFERENCES Students(UserID),
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
);
GO

-- =============================================
--  SEED DATA: Instructor account
-- =============================================

INSERT INTO Users (FullName, Email, Password, UserType)
VALUES ('Dr Abdelhamid', 'dr@test.com', '123456', 'Instructor');
GO

-- ← ADDED: Insert instructor into Instructors table (required for Course FK)
INSERT INTO Instructors (UserID)
SELECT UserID FROM Users WHERE Email = 'dr@test.com';
GO

SELECT * FROM Users;
SELECT * FROM Instructors;
