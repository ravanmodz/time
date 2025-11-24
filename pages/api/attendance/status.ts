import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { authenticate } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId: auth.userId,
      date: today,
    });

    let status = 'not_checked_in';
    if (attendance) {
      if (attendance.checkIn && !attendance.checkOut) {
        status = 'present';
      } else if (attendance.checkOut) {
        status = 'checked_out';
      }
    }

    return res.status(200).json({
      success: true,
      status,
      attendance: attendance || null,
    });
  } catch (error: any) {
    console.error('Get status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

