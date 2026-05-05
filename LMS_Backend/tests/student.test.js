const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock db
jest.mock('../config/db', () => ({
    sql: {
        Int: 'Int',
        VarChar: 'VarChar',
        NVarChar: 'NVarChar',
        Float: 'Float',
        Decimal: jest.fn().mockReturnValue('Decimal'),
        Date: jest.fn().mockReturnValue('Date')
    },
    getPool: jest.fn().mockResolvedValue({
        request: jest.fn().mockReturnValue({
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockImplementation((q) => {
                if (q.includes('Submission WHERE AssignmentID')) return Promise.resolve({ recordset: [] });
                return Promise.resolve({ recordset: [ { id: 1, name: 'Mock Data', CourseName: 'C1', TotalClasses: 10, AttendedClasses: 8, SubmissionID: 1, Status: 'Pending', courseCount: 5, pendingCount: 2 } ] });
            })
        })
    })
}));

// Mock upload middleware to bypass file system
jest.mock('../middleware/upload', () => ({
    single: () => (req, res, next) => {
        req.file = { filename: 'mock-file.pdf' };
        next();
    }
}));

process.env.JWT_SECRET = 'test-secret';

describe('Student API', () => {
    let app;
    let token;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        
        // Mock auth middleware for testing
        app.use((req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ message: 'No token' });
            try {
                const t = authHeader.split(' ')[1];
                req.user = jwt.verify(t, process.env.JWT_SECRET);
                next();
            } catch {
                return res.status(401).json({ message: 'Invalid token' });
            }
        });

        const studentRoutes = require('../routes/studentRoutes');
        app.use('/api/student', studentRoutes);

        token = jwt.sign({ id: 1, type: 'Student' }, process.env.JWT_SECRET);
    });

    describe('GET /api/student/dashboard', () => {
        it('should return dashboard data', async () => {
            const res = await request(app)
                .get('/api/student/dashboard')
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('courseCount');
            expect(res.body).toHaveProperty('pendingTasks');
        });
    });

    describe('POST /api/student/assignments/submit', () => {
        it('should require assignmentID', async () => {
            const res = await request(app)
                .post('/api/student/assignments/submit')
                .set('Authorization', `Bearer ${token}`)
                .send({}); // Missing assignmentID
            
            expect(res.status).toBe(400);
        });

        it('should successfully submit an assignment', async () => {
            const res = await request(app)
                .post('/api/student/assignments/submit')
                .set('Authorization', `Bearer ${token}`)
                .send({ assignmentID: 1 }); // Send JSON instead of multipart, multer is mocked anyway.
            
            // We mocked the DB so the logic should process successfully
            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Assignment submitted successfully");
        });
    });
});
