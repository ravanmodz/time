import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Leave from '@/models/Leave';
import { authenticate } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticate(req, res, ['employee']);
    if (!auth) return;

    await connectDB();

    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const leave = new Leave({
      userId: auth.userId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'pending',
    });

    await leave.save();

    return res.status(201).json({
      success: true,
      leave,
    });
  } catch (error: any) {
    console.error('Apply leave error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

