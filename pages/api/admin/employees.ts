import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticate } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await authenticate(req, res, ['super_admin', 'admin', 'hr']);
  if (!auth) return;

  await connectDB();

  if (req.method === 'GET') {
    try {
      const { department, status, role } = req.query;

      const query: any = {};
      if (department) query.department = department;
      if (status) query.status = status;
      if (role) query.role = role;

      const employees = await User.find(query)
        .select('-password')
        .populate('shiftId')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        employees,
      });
    } catch (error: any) {
      console.error('Get employees error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Employee ID is required' });
      }

      const employee = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      return res.status(200).json({
        success: true,
        employee,
      });
    } catch (error: any) {
      console.error('Update employee error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Employee ID is required' });
      }

      await User.findByIdAndUpdate(id, { status: 'inactive' });

      return res.status(200).json({
        success: true,
        message: 'Employee deactivated',
      });
    } catch (error: any) {
      console.error('Delete employee error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

