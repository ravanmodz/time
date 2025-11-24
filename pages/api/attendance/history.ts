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

    const { startDate, endDate, userId } = req.query;

    const query: any = {};
    
    // Admin/HR can view any user's attendance
    if (userId && (auth.role === 'admin' || auth.role === 'hr' || auth.role === 'super_admin')) {
      query.userId = userId;
    } else {
      query.userId = auth.userId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate as string);
      }
    }

    const attendances = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(100)
      .populate('userId', 'name email');

    return res.status(200).json({
      success: true,
      attendances,
    });
  } catch (error: any) {
    console.error('Get history error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

