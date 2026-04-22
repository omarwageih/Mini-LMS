const { sql, poolPromise } = require('../config/dbConfig');

exports.getAllUsers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT U.UserID, U.FullName, U.Email, U.Phone, U.UserType, U.IsActive, U.CreatedAt, U.UpdatedAt,
                    CASE 
                        WHEN U.UserType = 'Student' THEN S.Major
                        WHEN U.UserType = 'Instructor' THEN I.Specialization
                        WHEN U.UserType = 'Assistant' THEN A.OfficeLocation
                    END AS RoleDetail,
                    S.GPA, S.AcademicYear
                FROM Users U
                LEFT JOIN Students S ON U.UserID = S.UserID
                LEFT JOIN Instructors I ON U.UserID = I.UserID
                LEFT JOIN Assistants A ON U.UserID = A.UserID
                WHERE U.DeletedAt IS NULL
            `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserID', sql.Int, req.params.id)
            .query(`
                SELECT U.UserID, U.FullName, U.Email, U.Phone, U.UserType, U.IsActive, U.CreatedAt, U.UpdatedAt,
                    S.AcademicYear, S.Major, S.GPA, S.Status AS StudentStatus,
                    I.Specialization,
                    A.OfficeLocation, A.InstructorID
                FROM Users U
                LEFT JOIN Students S ON U.UserID = S.UserID
                LEFT JOIN Instructors I ON U.UserID = I.UserID
                LEFT JOIN Assistants A ON U.UserID = A.UserID
                WHERE U.UserID = @UserID AND U.DeletedAt IS NULL
            `);
        
        if (result.recordset.length === 0) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, phone, specialization, officeLocation, academicYear, major, gpa } = req.body;
        const pool = await poolPromise;
        const transaction = new (require('mssql')).Transaction(pool);

        await transaction.begin();
        try {
            // 1. Update base Users table
            await transaction.request()
                .input('UserID', sql.Int, id)
                .input('FullName', sql.NVarChar, fullName || null)
                .input('Phone', sql.NVarChar, phone || null)
                .query(`
                    UPDATE Users 
                    SET FullName = ISNULL(@FullName, FullName), 
                        Phone = ISNULL(@Phone, Phone),
                        UpdatedAt = GETDATE()
                    WHERE UserID = @UserID AND DeletedAt IS NULL
                `);

            // 2. Update Instructor fields
            if (specialization !== undefined) {
                await transaction.request()
                    .input('UserID', sql.Int, id)
                    .input('Specialization', sql.NVarChar, specialization)
                    .query('UPDATE Instructors SET Specialization = @Specialization, UpdatedAt = GETDATE() WHERE UserID = @UserID');
            }

            // 3. Update Assistant fields
            if (officeLocation !== undefined) {
                await transaction.request()
                    .input('UserID', sql.Int, id)
                    .input('OfficeLocation', sql.NVarChar, officeLocation)
                    .query('UPDATE Assistants SET OfficeLocation = @OfficeLocation, UpdatedAt = GETDATE() WHERE UserID = @UserID');
            }

            // 4. Update Student fields
            if (academicYear !== undefined || major !== undefined || gpa !== undefined) {
                await transaction.request()
                    .input('UserID', sql.Int, id)
                    .input('AcademicYear', sql.Int, academicYear || null)
                    .input('Major', sql.NVarChar, major || null)
                    .input('GPA', sql.Decimal(3, 2), gpa || null)
                    .query(`
                        UPDATE Students 
                        SET AcademicYear = ISNULL(@AcademicYear, AcademicYear), 
                            Major = ISNULL(@Major, Major),
                            GPA = ISNULL(@GPA, GPA),
                            UpdatedAt = GETDATE()
                        WHERE UserID = @UserID
                    `);
            }

            await transaction.commit();

            // Log the activity
            await pool.request()
                .input('UserID', sql.Int, req.user.id)
                .input('Action', sql.NVarChar, 'UPDATE_USER')
                .input('TargetTable', sql.NVarChar, 'Users')
                .input('TargetID', sql.Int, id)
                .input('Details', sql.NVarChar, `Updated user #${id}`)
                .query("INSERT INTO Activity_Log (UserID, Action, TargetTable, TargetID, Details) VALUES (@UserID, @Action, @TargetTable, @TargetID, @Details)");

            res.status(200).json({ message: 'User updated successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const transaction = new (require('mssql')).Transaction(pool);

        await transaction.begin();
        try {
            // Soft delete in Users table
            await transaction.request()
                .input('UserID', sql.Int, id)
                .query('UPDATE Users SET DeletedAt = GETDATE(), IsActive = 0, UpdatedAt = GETDATE() WHERE UserID = @UserID');

            // Cascade soft delete to role tables
            await transaction.request()
                .input('UserID', sql.Int, id)
                .query('UPDATE Students SET DeletedAt = GETDATE() WHERE UserID = @UserID');
            await transaction.request()
                .input('UserID', sql.Int, id)
                .query('UPDATE Instructors SET DeletedAt = GETDATE() WHERE UserID = @UserID');
            await transaction.request()
                .input('UserID', sql.Int, id)
                .query('UPDATE Assistants SET DeletedAt = GETDATE() WHERE UserID = @UserID');

            await transaction.commit();

            // Log the activity
            await pool.request()
                .input('UserID', sql.Int, req.user.id)
                .input('Action', sql.NVarChar, 'DELETE_USER')
                .input('TargetTable', sql.NVarChar, 'Users')
                .input('TargetID', sql.Int, id)
                .input('Details', sql.NVarChar, `Soft deleted user #${id}`)
                .query("INSERT INTO Activity_Log (UserID, Action, TargetTable, TargetID, Details) VALUES (@UserID, @Action, @TargetTable, @TargetID, @Details)");

            res.status(200).json({ message: 'User deleted successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
