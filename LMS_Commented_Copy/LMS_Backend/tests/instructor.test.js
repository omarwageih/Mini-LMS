const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../config/db', () => ({
    sql: {
        Int: 'Int',
        VarChar: 'VarChar',
        NVarChar: 'NVarChar',
        Float: 'Float',
        Decimal: jest.fn().mockReturnValue('Decimal'),
        Date: jest.fn().mockReturnValue('Date'),
        Transaction: jest.fn().mockImplementation(() => ({
            begin: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn()
        })),
        Request: jest.fn().mockImplementation(() => ({
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [] })
        }))
    },
    getPool: jest.fn().mockResolvedValue({
        request: jest.fn().mockReturnValue({
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockImplementation((q) => {
                if (q.includes('INSERT INTO Course')) return Promise.resolve({ recordset: [{ CourseID: 1 }] });
                if (q.includes('FROM Submission')) return Promise.resolve({ recordset: [{ StudentID: 1, Title: 'Test', CourseID: 1 }] });
                return Promise.resolve({ recordset: [] });
            })
        })
    })
}));

jest.mock('../middleware/upload', () => ({
    materialsUpload: {
        single: () => (req, res, next) => {
            req.file = { filename: 'mock-file.pdf' };
            next();
        }
    }
}));

process.env.JWT_SECRET = 'test-secret';

describe('Instructor API', () => {
    let app;
    let token;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        
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

        const instructorRoutes = require('../routes/instructorRoutes');
        app.use('/api/instructor', instructorRoutes);

        token = jwt.sign({ id: 2, type: 'Instructor' }, process.env.JWT_SECRET);
    });

    describe('POST /api/instructor/courses', () => {
        it('should fail if missing required fields', async () => {
            const res = await request(app)
                .post('/api/instructor/courses')
                .set('Authorization', `Bearer ${token}`)
                .send({}); // Missing courseName etc.

            expect(res.status).toBe(400);
        });

        it('should pass with valid fields', async () => {
            const res = await request(app)
                .post('/api/instructor/courses')
                .set('Authorization', `Bearer ${token}`)
                .send({ 
                    name: 'Test Course',
                    description: 'Desc',
                    maxMarks: 100
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Course created successfully");
        });
    });

    describe('POST /api/instructor/submissions/grade', () => {
        it('should fail with invalid score type', async () => {
            const res = await request(app)
                .post('/api/instructor/submissions/grade')
                .set('Authorization', `Bearer ${token}`)
                .send({ submissionId: 1, score: {}, feedback: 'Good' }); // Changed grade to score
            
            expect(res.status).toBe(400);
        });
        
        it('should pass with valid grading schema', async () => {
            const res = await request(app)
                .post('/api/instructor/submissions/grade')
                .set('Authorization', `Bearer ${token}`)
                .send({ submissionId: 1, score: 95, feedback: 'Excellent work' });

            expect(res.status).toBe(200);
        });
    });
});
