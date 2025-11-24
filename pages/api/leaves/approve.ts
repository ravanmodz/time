import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Leave from '@/models/Leave';
import Attendance from '@/models/Attendance';
import { authenticate } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticate(req, res, ['admin', 'hr', 'super_admin']);
    if (!auth) return;

    await connectDB();

    const { leaveId, action, rejectionReason } = req.body;

    if (!leaveId || !action) {
      return res.status(400).json({ error: 'Leave ID and action are required' });
    }

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ error: 'Leave not found' });
    }

    leave.status = action;
    leave.approvedBy = auth.userId;
    leave.approvedAt = new Date();
    if (action === 'rejected' && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }

    await leave.save();

    // If approved, mark attendance as leave for those dates
    if (action === 'approved') {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);

        await Attendance.findOneAndUpdate(
          { userId: leave.userId, date },
          {
            userId: leave.userId,
            date,
            status: 'leave',
          },
          { upsert: true }
        );
      }
    }

    return res.status(200).json({
      success: true,
      leave,
    });
  } catch (error: any) {
    console.error('Approve leave error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

