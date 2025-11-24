import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Leave from '@/models/Leave';
import { authenticate } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    await connectDB();

    const { userId, status } = req.query;

    const query: any = {};

    // Employees can only see their own leaves
    if (auth.role === 'employee') {
      query.userId = auth.userId;
    } else if (userId) {
      // Admin/HR can see any user's leaves
      query.userId = userId;
    }

    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .populate('userId', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      leaves,
    });
  } catch (error: any) {
    console.error('Get leaves error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

