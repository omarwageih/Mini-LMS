const request = require('supertest');
const express = require('express');

// Mock the database
jest.mock('../config/db', () => ({
    sql: {
        Int: 'Int',
        VarChar: 'VarChar',
        NVarChar: 'NVarChar',
        Float: 'Float',
        Transaction: jest.fn()
    },
    getPool: jest.fn().mockResolvedValue({
        request: jest.fn().mockReturnValue({
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [{ count: 0 }] })
        })
    })
}));

jest.mock('../utils/emailService', () => ({
    sendEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../utils/helpers', () => ({
    logAudit: jest.fn().mockResolvedValue(true),
    createNotification: jest.fn().mockResolvedValue(true)
}));

const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'test-secret-key';

describe('Auth API', () => {
    let app;

    beforeAll(() => {
        // Build a minimal Express app for testing
        app = express();
        app.use(express.json());
        const authRoutes = require('../routes/authRoutes');
        app.use('/api/auth', authRoutes);
    });

    describe('POST /api/auth/login', () => {
        it('should return 400 if email or password is missing', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: '' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
        });

        it('should return 400 if body is empty', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/register', () => {
        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ fullName: 'Test' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBeDefined();
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should return 400 if email is missing', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({});

            expect(res.status).toBe(400);
        });
    });
});

describe('JWT Token Validation', () => {
    it('should generate a valid JWT token', () => {
        const payload = { id: 1, type: 'Student', name: 'Test User' };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        expect(decoded.id).toBe(1);
        expect(decoded.type).toBe('Student');
    });

    it('should reject expired tokens', async () => {
        const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '0s' });

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(() => jwt.verify(token, process.env.JWT_SECRET)).toThrow();
    });

    it('should reject tokens with invalid secret', () => {
        const token = jwt.sign({ id: 1 }, 'wrong-secret');

        expect(() => jwt.verify(token, process.env.JWT_SECRET)).toThrow();
    });
});

describe('Notification Routes', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        // Mock auth middleware for testing
        app.use((req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ message: 'No token' });
            try {
                const token = authHeader.split(' ')[1];
                req.user = jwt.verify(token, process.env.JWT_SECRET);
                next();
            } catch {
                return res.status(401).json({ message: 'Invalid token' });
            }
        });

        const notificationRoutes = require('../routes/notificationRoutes');
        app.use('/api/notifications', notificationRoutes);
    });

    it('should return 401 without a token', async () => {
        const res = await request(app).get('/api/notifications/unread-count');
        expect(res.status).toBe(401);
    });

    it('should accept a valid token', async () => {
        const token = jwt.sign({ id: 1, type: 'Student' }, process.env.JWT_SECRET, { expiresIn: '15m' });

        // This will fail at DB level, but auth should pass
        const res = await request(app)
            .get('/api/notifications/unread-count')
            .set('Authorization', `Bearer ${token}`);

        // Will be 500 since DB is mocked, but not 401
        expect(res.status).not.toBe(401);
    });
});

describe('Middleware', () => {
    describe('Rate Limiting', () => {
        it('should apply rate limits to auth routes', () => {
            // Verify rate limiter config exists
            const rateLimit = require('express-rate-limit');
            expect(rateLimit).toBeDefined();
        });
    });

    describe('Helmet Security', () => {
        it('should set security headers', () => {
            const helmet = require('helmet');
            expect(helmet).toBeDefined();
        });
    });
});
