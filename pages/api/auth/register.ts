import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken, authenticate } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticate(req, res, ['super_admin', 'admin', 'hr']);
    if (!auth) return;

    await connectDB();

    const { name, email, phone, password, role, department, designation, joiningDate, shiftId } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: role === 'super_admin' && auth.role !== 'super_admin' ? 'employee' : role,
      department,
      designation,
      joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      shiftId,
      status: 'active',
    });

    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      designation: user.designation,
    };

    return res.status(201).json({
      success: true,
      user: userData,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

