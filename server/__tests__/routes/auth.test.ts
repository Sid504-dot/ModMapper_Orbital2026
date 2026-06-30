import request from 'supertest';
import express from 'express';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

// Mock supabase BEFORE requiring the router
jest.mock('../../db/supabase', () => ({
    auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        resetPasswordForEmail: jest.fn(),
    }
}));

const supabase = require('../../db/supabase');
const authRouter = require('../../routes/auth');

// Build a minimal Express app — avoids importing index.js (which starts cron)
const app = express();
app.use(express.json());
app.use('/auth', authRouter);

// ─── POST /auth/register ────────────────────────────────────────────────────

describe('POST /auth/register', () => {
    beforeEach(async () => jest.clearAllMocks());

    test('returns 400 if email is missing', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ password: 'password123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email and password are required');
    });

    test('returns 400 if password is missing', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'user@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email and password are required');
    });

    test('returns 400 if body is empty', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email and password are required');
    });

    test('returns 201 and success message on valid registration', async () => {
        supabase.auth.signUp.mockResolvedValue({
            data: { user: { id: 'abc-123', email: 'user@test.com' } },
            error: null
        });

        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'user@test.com', password: 'password123' });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('User registered successfully');
        expect(res.body.data).toBeDefined();
    });

    test('returns 400 when Supabase returns an error (e.g. duplicate email)', async () => {
        supabase.auth.signUp.mockResolvedValue({
            data: null,
            error: { message: 'User already registered' }
        });

        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'existing@test.com', password: 'password123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('User already registered');
    });

    test('calls supabase.auth.signUp with correct arguments', async () => {
        supabase.auth.signUp.mockResolvedValue({
            data: { user: { id: 'abc-123' } },
            error: null
        });

        await request(app)
            .post('/auth/register')
            .send({ email: 'user@test.com', password: 'mypassword' });

        expect(supabase.auth.signUp).toHaveBeenCalledWith({
            email: 'user@test.com',
            password: 'mypassword'
        });
    });
});

// ─── POST /auth/login ───────────────────────────────────────────────────────

describe('POST /auth/login', () => {
    beforeEach(async () => jest.clearAllMocks());

    test('returns 400 if email is missing', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ password: 'password123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email and password are required');
    });

    test('returns 400 if password is missing', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email and password are required');
    });

    test('returns 400 if body is empty', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({});

        expect(res.status).toBe(400);
    });

    test('returns 200 and access_token on successful login', async () => {
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: { session: { access_token: 'jwt-token-xyz' } },
            error: null
        });

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Login successful');
        expect(res.body.token).toBe('jwt-token-xyz');
    });

    test('returns 400 on wrong credentials', async () => {
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: null,
            error: { message: 'Invalid login credentials' }
        });

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'wrongpassword' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid login credentials');
    });

    test('calls supabase.auth.signInWithPassword with correct arguments', async () => {
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: { session: { access_token: 'token' } },
            error: null
        });

        await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'mypassword' });

        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'user@test.com',
            password: 'mypassword'
        });
    });
});

// ─── POST /auth/forgot-password ─────────────────────────────────────────────

describe('POST /auth/forgot-password', () => {
    beforeEach(async () => jest.clearAllMocks());

    test('returns 400 if email is missing', async () => {
        const res = await request(app)
            .post('/auth/forgot-password')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email is required');
    });

    test('returns 200 with generic message on success', async () => {
        supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

        const res = await request(app)
            .post('/auth/forgot-password')
            .send({ email: 'user@test.com' });

        expect(res.status).toBe(200);
        // Message is intentionally vague (security best practice)
        expect(res.body.message).toContain('reset link');
    });

    test('returns 400 if Supabase returns an error', async () => {
        supabase.auth.resetPasswordForEmail.mockResolvedValue({
            error: { message: 'Unable to send email' }
        });

        const res = await request(app)
            .post('/auth/forgot-password')
            .send({ email: 'user@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Unable to send email');
    });
});
