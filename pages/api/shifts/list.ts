import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Shift from '@/models/Shift';
import { authenticate } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const auth = await authenticate(req, res);
      if (!auth) return;

      await connectDB();

      const shifts = await Shift.find().sort({ name: 1 });

      return res.status(200).json({
        success: true,
        shifts,
      });
    } catch (error: any) {
      console.error('Get shifts error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const auth = await authenticate(req, res, ['admin', 'hr', 'super_admin']);
      if (!auth) return;

      await connectDB();

      const { name, startTime, endTime, graceTime, halfDayHours, isRotational, days } = req.body;

      if (!name || !startTime || !endTime) {
        return res.status(400).json({ error: 'Name, start time, and end time are required' });
      }

      const shift = new Shift({
        name,
        startTime,
        endTime,
        graceTime: graceTime || 15,
        halfDayHours: halfDayHours || 4,
        isRotational: isRotational || false,
        days: days || [1, 2, 3, 4, 5], // Mon-Fri default
      });

      await shift.save();

      return res.status(201).json({
        success: true,
        shift,
      });
    } catch (error: any) {
      console.error('Create shift error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

