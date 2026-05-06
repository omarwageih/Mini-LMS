const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../config/db', () => ({
    sql: {
        Int: 'Int',
        VarChar: 'VarChar',
        NVarChar: 'NVarChar',
        Float: 'Float',
        Decimal: jest.fn().mockReturnValue('Decimal')
    },
    getPool: jest.fn().mockResolvedValue({
        request: jest.fn().mockReturnValue({
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [{ SubID: 1 }] })
        })
    })
}));

jest.mock('../middleware/upload', () => ({
    materialsUpload: {
        single: () => (req, res, next) => {
            req.file = { filename: 'mock-mat.pdf' };
            next();
        }
    }
}));

process.env.JWT_SECRET = 'test-secret';

describe('Assistant API', () => {
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

        const assistantRoutes = require('../routes/assistantRoutes');
        app.use('/api/assistant', assistantRoutes);

        token = jwt.sign({ id: 3, type: 'Assistant' }, process.env.JWT_SECRET);
    });

    describe('GET /api/assistant/courses', () => {
        it('should return courses for assistant', async () => {
            const res = await request(app)
                .get('/api/assistant/courses')
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
        });
    });

    describe('POST /api/assistant/submissions/grade', () => {
        it('should require submissionID and score', async () => {
            const res = await request(app)
                .post('/api/assistant/submissions/grade')
                .set('Authorization', `Bearer ${token}`)
                .send({ score: 90 }); // Missing submissionID

            expect(res.status).toBe(400);
        });

        it('grade successfully', async () => {
            const res = await request(app)
                .post('/api/assistant/submissions/grade')
                .set('Authorization', `Bearer ${token}`)
                .send({ submissionId: 1, score: 90 }); // Changed to submissionId

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Submission graded successfully");
        });
    });
});
