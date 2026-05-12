-- Add cascade to Material on Week deletion
ALTER TABLE Material DROP CONSTRAINT FK__Material__Week_I__6C190EBB;
ALTER TABLE Material ADD CONSTRAINT FK_Material_Week 
    FOREIGN KEY (Week_ID) REFERENCES StudyWeek(Week_ID) ON DELETE CASCADE;

PRINT 'Material cascade updated.';
GO
