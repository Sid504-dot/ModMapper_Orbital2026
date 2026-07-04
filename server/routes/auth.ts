import express, { Request, Response } from 'express';
const router = express.Router();
const supabase = require('../db/supabase');
import { ApiResponse } from '../types/apiResponse';

router.post('/register', async (req: Request, res: Response<ApiResponse>) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'User did not enter email id or password',
      data: null,
      error: 'Email and password are required',
    });
  }

  const { data: confirmationData, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Some problem fetching user data',
      data: null,
      error: error.message,
    });
  }

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: confirmationData,
    error: null,
  });
});

router.post('/login', async (req: Request, res: Response<ApiResponse>) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'User did not enter email id or password',
      data: null,
      error: 'Email and password are required',
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Some problem fetching user data',
      data: null,
      error: error.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: data.session.access_token,
    error: null,
  });
});

router.post('/forgot-password', async (req: Request, res: Response<ApiResponse>) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'User did not enter email id',
      data: null,
      error: 'Email is required',
    });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Some problem fetching user data',
      data: null,
      error: error.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'If this email is registered, a reset link has been sent.',
    data: null,
    error: null,
  });
});

export default router;