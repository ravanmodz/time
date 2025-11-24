import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { authenticate } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Request correction
    try {
      const auth = await authenticate(req, res, ['employee']);
      if (!auth) return;

      await connectDB();

      const { attendanceId, reason, proof } = req.body;

      if (!attendanceId || !reason) {
        return res.status(400).json({ error: 'Attendance ID and reason are required' });
      }

      const attendance = await Attendance.findOne({
        _id: attendanceId,
        userId: auth.userId,
      });

      if (!attendance) {
        return res.status(404).json({ error: 'Attendance not found' });
      }

      attendance.correctionRequest = {
        requestedAt: new Date(),
        reason,
        proof: proof || [],
        status: 'pending',
      };

      await attendance.save();

      return res.status(200).json({
        success: true,
        message: 'Correction request submitted',
      });
    } catch (error: any) {
      console.error('Request correction error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PATCH') {
    // Approve/Reject correction
    try {
      const auth = await authenticate(req, res, ['admin', 'hr', 'super_admin']);
      if (!auth) return;

      await connectDB();

      const { attendanceId, action, notes } = req.body;

      if (!attendanceId || !action) {
        return res.status(400).json({ error: 'Attendance ID and action are required' });
      }

      if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
      }

      const attendance = await Attendance.findById(attendanceId);

      if (!attendance || !attendance.correctionRequest) {
        return res.status(404).json({ error: 'Correction request not found' });
      }

      attendance.correctionRequest.status = action;
      attendance.correctionRequest.reviewedBy = auth.userId;
      attendance.correctionRequest.reviewedAt = new Date();
      attendance.correctionRequest.notes = notes;

      await attendance.save();

      return res.status(200).json({
        success: true,
        message: `Correction request ${action}`,
      });
    } catch (error: any) {
      console.error('Review correction error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

