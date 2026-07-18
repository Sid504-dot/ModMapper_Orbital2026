import request from 'supertest';
import express from 'express';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import supabase from '../../db/supabase';
import authRouter from '../../routes/auth';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);


describe('POST /auth/register', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('returns 400 if email or password is missing', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'user@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email and password are required');
    });

    test('registers successfully and calls supabase with correct arguments', async () => {
        const signUpSpy = jest.spyOn(supabase.auth, 'signUp')
            .mockResolvedValue({
                data: { user: { id: 'abc-123', email: 'user@test.com' } },
                error: null
            } as any);

        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'user@test.com', password: 'password123' });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('User registered successfully');
        expect(signUpSpy).toHaveBeenCalledWith({
            email: 'user@test.com',
            password: 'password123'
        });
    });

    test('returns 400 when Supabase returns an error (e.g. duplicate email)', async () => {
        jest.spyOn(supabase.auth, 'signUp')
            .mockResolvedValue({
                data: null,
                error: { message: 'User already registered' }
            } as any);

        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'existing@test.com', password: 'password123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('User already registered');
    });
});

describe('POST /auth/login', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('returns 400 if email or password is missing', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email and password are required');
    });

    test('logs in successfully and calls supabase with correct arguments', async () => {
        const signInSpy = jest.spyOn(supabase.auth, 'signInWithPassword')
            .mockResolvedValue({
                data: { session: { access_token: 'jwt-token-xyz' } },
                error: null
            } as any);

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body.data).toBe('jwt-token-xyz');
        expect(signInSpy).toHaveBeenCalledWith({
            email: 'user@test.com',
            password: 'password123'
        });
    });

    test('returns 400 on wrong credentials', async () => {
        jest.spyOn(supabase.auth, 'signInWithPassword')
            .mockResolvedValue({
                data: null,
                error: { message: 'Invalid login credentials' }
            } as any);

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'wrongpassword' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid login credentials');
    });
});


describe('POST /auth/forgot-password', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('returns 400 if email is missing', async () => {
        const res = await request(app)
            .post('/auth/forgot-password')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email is required');
    });

    test('returns 200 with generic message on success', async () => {
        jest.spyOn(supabase.auth, 'resetPasswordForEmail')
            .mockResolvedValue({ error: null } as any);

        const res = await request(app)
            .post('/auth/forgot-password')
            .send({ email: 'user@test.com' });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('reset link');
    });

    test('returns 400 if Supabase returns an error', async () => {
        jest.spyOn(supabase.auth, 'resetPasswordForEmail')
            .mockResolvedValue({
                error: { message: 'Unable to send email' }
            } as any);

        const res = await request(app)
            .post('/auth/forgot-password')
            .send({ email: 'user@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Unable to send email');
    });
});