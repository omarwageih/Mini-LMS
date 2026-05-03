-- =========================================================================
-- CSE 301 - Phase 5: Sample Data & SQL Queries
-- Domain: University Learning Management System (LMS)
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. SAMPLE DATA INSERTION (DML)
-- -------------------------------------------------------------------------

-- Insert Students (15 Records)
INSERT INTO Users (FullName, Email, Password, UserType) VALUES 
('Ahmed Ali', 'ahmed@std.must.edu.eg', 'pass123', 'Student'),
('Sara Youssef', 'sara@std.must.edu.eg', 'pass123', 'Student'),
('Omar Khaled', 'omar@std.must.edu.eg', 'pass123', 'Student'),
('Mona Hassan', 'mona@std.must.edu.eg', 'pass123', 'Student'),
('Karim Nabil', 'karim@std.must.edu.eg', 'pass123', 'Student'),
('Nour Gamal', 'nour@std.must.edu.eg', 'pass123', 'Student'),
('Youssef Tarek', 'youssef@std.must.edu.eg', 'pass123', 'Student'),
('Salma Wael', 'salma@std.must.edu.eg', 'pass123', 'Student'),
('Mahmoud Saeed', 'mahmoud@std.must.edu.eg', 'pass123', 'Student'),
('Hana Mostafa', 'hana@std.must.edu.eg', 'pass123', 'Student'),
('Ziad Ibrahim', 'ziad@std.must.edu.eg', 'pass123', 'Student'),
('Laila Amr', 'laila@std.must.edu.eg', 'pass123', 'Student'),
('Tarek Hisham', 'tarekh@std.must.edu.eg', 'pass123', 'Student'),
('Farah Ezzat', 'farah@std.must.edu.eg', 'pass123', 'Student'),
('Mostafa Kamal', 'mostafa@std.must.edu.eg', 'pass123', 'Student');

-- (Assuming the Users above got IDs 2 to 16, as ID 1 is the instructor from your original script)
INSERT INTO Students (UserID, Academic_Year, Major, GPA) VALUES 
(2, 3, 'Computer Science', 3.5), (3, 2, 'Software Engineering', 3.8),
(4, 4, 'Artificial Intelligence', 2.9), (5, 3, 'Computer Science', 3.2),
(6, 1, 'Data Science', 3.9), (7, 4, 'Software Engineering', 3.1),
(8, 2, 'Computer Science', 2.5), (9, 3, 'Artificial Intelligence', 3.6),
(10, 4, 'Data Science', 3.4), (11, 1, 'Computer Science', 2.8),
(12, 2, 'Software Engineering', 3.7), (13, 3, 'Artificial Intelligence', 3.0),
(14, 4, 'Computer Science', 3.9), (15, 1, 'Data Science', 2.7),
(16, 2, 'Software Engineering', 3.3);

-- Insert Courses
INSERT INTO Course (Name, Max_Marks, InstructorID) VALUES 
('Database Systems', 100, 1),
('Data Structures', 100, 1),
('Software Engineering', 100, 1),
('Artificial Intelligence', 100, 1),
('Web Development', 100, 1);

-- Insert Enrollments (15 Records)
INSERT INTO Enrollment (StudentID, CourseID) VALUES 
(2, 1), (3, 1), (4, 1), (5, 1), (6, 1),
(7, 2), (8, 2), (9, 2), (10, 2), (11, 2),
(12, 3), (13, 3), (14, 3), (15, 3), (16, 3);

-- Insert Assignments
INSERT INTO Assignment (CourseID, Title, Max_Score, Deadline, Created_By) VALUES 
(1, 'ER Diagram Project', 15, '2026-05-15', 1),
(1, 'SQL Queries Task', 10, '2026-05-20', 1),
(2, 'Linked Lists Implementation', 20, '2026-05-18', 1);

-- Insert Submissions (15 Records)
INSERT INTO Submission (AssignmentID, StudentID, Score, CorrectedBy) VALUES 
(1, 2, 14, 1), (1, 3, 15, 1), (1, 4, 10, 1), (1, 5, 12, 1), (1, 6, 13, 1),
(2, 2, 9, 1), (2, 3, 10, 1), (2, 4, 8, 1), (2, 5, 7, 1), (2, 6, 9, 1),
(3, 7, 18, 1), (3, 8, 15, 1), (3, 9, 20, 1), (3, 10, 19, 1), (3, 11, 16, 1);

-- -------------------------------------------------------------------------
-- 2. 10 SELECT QUERIES (Joins, Aggregation, Group By, Having, Subqueries)
-- -------------------------------------------------------------------------

-- Q1: Basic INNER JOIN to get student names and their enrolled courses
SELECT u.FullName, c.Name AS CourseName
FROM Enrollment e
INNER JOIN Students s ON e.StudentID = s.UserID
INNER JOIN Users u ON s.UserID = u.UserID
INNER JOIN Course c ON e.CourseID = c.CourseID;

-- Q2: LEFT JOIN to find courses that might not have any assignments yet
SELECT c.Name AS CourseName, a.Title AS AssignmentTitle
FROM Course c
LEFT JOIN Assignment a ON c.CourseID = a.CourseID;

-- Q3: Aggregate Function (AVG) and GROUP BY to find average GPA per Major
SELECT Major, AVG(GPA) AS Average_GPA
FROM Students
GROUP BY Major;

-- Q4: COUNT and GROUP BY to find the total number of students enrolled in each course
SELECT c.Name AS CourseName, COUNT(e.StudentID) AS TotalStudents
FROM Course c
INNER JOIN Enrollment e ON c.CourseID = e.CourseID
GROUP BY c.Name;

-- Q5: HAVING clause to find courses with more than 3 students enrolled
SELECT c.Name AS CourseName, COUNT(e.StudentID) AS TotalStudents
FROM Course c
INNER JOIN Enrollment e ON c.CourseID = e.CourseID
GROUP BY c.Name
HAVING COUNT(e.StudentID) > 3;

-- Q6: Subquery to find students whose GPA is above the overall average GPA
SELECT u.FullName, s.GPA 
FROM Students s
INNER JOIN Users u ON s.UserID = u.UserID
WHERE s.GPA > (SELECT AVG(GPA) FROM Students);

-- Q7: MAX and MIN functions to find the highest and lowest scores in a specific assignment
SELECT AssignmentID, MAX(Score) AS HighestScore, MIN(Score) AS LowestScore
FROM Submission
GROUP BY AssignmentID;

-- Q8: RIGHT JOIN to ensure all assignments are listed even if they have no submissions
SELECT a.Title AS AssignmentTitle, s.Score
FROM Submission s
RIGHT JOIN Assignment a ON s.AssignmentID = a.AssignmentID;

-- Q9: ORDER BY to list students by their GPA in descending order
SELECT u.FullName, s.Major, s.GPA
FROM Students s
INNER JOIN Users u ON s.UserID = u.UserID
ORDER BY s.GPA DESC;

-- Q10: Complex Query combining JOIN, GROUP BY, and SUM to calculate total assignment scores for each student
SELECT u.FullName, SUM(sub.Score) AS TotalAssignmentScore
FROM Submission sub
INNER JOIN Students s ON sub.StudentID = s.UserID
INNER JOIN Users u ON s.UserID = u.UserID
GROUP BY u.FullName;


-- -------------------------------------------------------------------------
-- 3. UPDATE & DELETE OPERATIONS
-- -------------------------------------------------------------------------

-- Update 1: Increase the Max_Marks of a specific course
UPDATE Course
SET Max_Marks = 150
WHERE Name = 'Database Systems';

-- Update 2: Give a 1-point bonus to submissions for a specific assignment that scored below 10
UPDATE Submission
SET Score = Score + 1
WHERE AssignmentID = 2 AND Score < 10;

-- Delete 1: Remove an enrollment record for a student who dropped the course
DELETE FROM Enrollment
WHERE StudentID = 16 AND CourseID = 3;

-- Delete 2: Remove an assignment that was cancelled
-- (Assuming an assignment with ID 99 was inserted previously)
-- DELETE FROM Assignment WHERE AssignmentID = 99;


-- -------------------------------------------------------------------------
-- 4. VIEWS (At least 2 Views)
-- -------------------------------------------------------------------------

-- View 1: Student Dashboard View (Shows students and their overall academic standing)
GO
CREATE VIEW vw_StudentAcademicInfo AS
SELECT u.UserID, u.FullName, u.Email, s.Major, s.Academic_Year, s.GPA
FROM Users u
INNER JOIN Students s ON u.UserID = s.UserID;
GO

-- View 2: Course Enrollment Summary View
GO
CREATE VIEW vw_CourseEnrollmentSummary AS
SELECT c.CourseID, c.Name, COUNT(e.StudentID) AS EnrolledCount
FROM Course c
LEFT JOIN Enrollment e ON c.CourseID = e.CourseID
GROUP BY c.CourseID, c.Name;
GO


-- -------------------------------------------------------------------------
-- 5. STORED PROCEDURES (At least 2 Procedures)
-- -------------------------------------------------------------------------

-- Procedure 1: Enroll a Student into a Course safely
GO
CREATE PROCEDURE sp_EnrollStudent
    @StudentID INT,
    @CourseID INT
AS
BEGIN
    -- Check if already enrolled to prevent errors
    IF NOT EXISTS (SELECT 1 FROM Enrollment WHERE StudentID = @StudentID AND CourseID = @CourseID)
    BEGIN
        INSERT INTO Enrollment (StudentID, CourseID, EnrolledAt)
        VALUES (@StudentID, @CourseID, GETDATE());
        PRINT 'Student enrolled successfully.';
    END
    ELSE
    BEGIN
        PRINT 'Student is already enrolled in this course.';
    END
END;
GO

-- Procedure 2: Calculate and Update Final Grade for a Student in a Course
GO
CREATE PROCEDURE sp_CalculateFinalGrade
    @StudentID INT,
    @CourseID INT
AS
BEGIN
    DECLARE @TotalScore DECIMAL(5,2);
    
    -- Sum of all submission scores for the student in the specific course
    SELECT @TotalScore = ISNULL(SUM(s.Score), 0)
    FROM Submission s
    INNER JOIN Assignment a ON s.AssignmentID = a.AssignmentID
    WHERE s.StudentID = @StudentID AND a.CourseID = @CourseID;

    -- Upsert the grade into Course_Grades
    IF EXISTS (SELECT 1 FROM Course_Grades WHERE StudentID = @StudentID AND CourseID = @CourseID)
    BEGIN
        UPDATE Course_Grades
        SET AssignmentTotal = @TotalScore, FinalGrade = @TotalScore
        WHERE StudentID = @StudentID AND CourseID = @CourseID;
    END
    ELSE
    BEGIN
        INSERT INTO Course_Grades (StudentID, CourseID, AssignmentTotal, FinalGrade)
        VALUES (@StudentID, @CourseID, @TotalScore, @TotalScore);
    END
END;
GO
