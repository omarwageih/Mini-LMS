-- Add missing cascades for Attendance and Quiz Results
-- Attendance -> Lecture
ALTER TABLE Attendance DROP CONSTRAINT FK__Attendanc__Lectu__76969D2E;
ALTER TABLE Attendance ADD CONSTRAINT FK_Attendance_Lecture 
    FOREIGN KEY (LectureID) REFERENCES Lecture(LectureID) ON DELETE CASCADE;

-- Quiz_Result -> Quizzes
ALTER TABLE Quiz_Result DROP CONSTRAINT FK__Quiz_Resu__QuizI__0A9D95DB;
ALTER TABLE Quiz_Result ADD CONSTRAINT FK_QuizResult_Quiz 
    FOREIGN KEY (QuizID) REFERENCES Quizzes(QuizID) ON DELETE CASCADE;

PRINT 'Cascades updated successfully.';
GO
