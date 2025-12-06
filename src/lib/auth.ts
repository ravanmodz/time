import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import { Admin } from '@/models/Admin';
import { Owner } from '@/models/Owner';
import mongoose from 'mongoose';

// ShopUser schema for user login
const shopUserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    fullName: String,
    assignedShops: [{ type: mongoose.Schema.Types.ObjectId }],
    isActive: { type: Boolean, default: true },
    lastLogin: Date
});

const ShopUser = mongoose.models.ShopUser || mongoose.model('ShopUser', shopUserSchema);

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.username || !credentials?.password) {
                        return null;
                    }

                    await dbConnect();

                    // Check if any owner exists, create default if not
                    const ownerCount = await Owner.countDocuments();

                    if (ownerCount === 0) {
                        const hashedPass = await bcrypt.hash('admin123', 12);
                        await Owner.create({
                            username: 'admin',
                            email: 'admin@example.com',
                            password: hashedPass,
                            fullName: 'Owner',
                            isActive: true
                        });
                    }

                    // First check Owner collection
                    const owner = await Owner.findOne({
                        username: credentials.username.toLowerCase()
                    });

                    if (owner) {
                        let isValid = false;
                        try {
                            isValid = await bcrypt.compare(credentials.password, owner.password);
                        } catch (e) {
                            isValid = false;
                        }

                        if (!isValid && owner.password === credentials.password) {
                            const hashedPass = await bcrypt.hash(credentials.password, 12);
                            await Owner.findByIdAndUpdate(owner._id, { password: hashedPass });
                            isValid = true;
                        }

                        if (!isValid) return null;

                        await Owner.findByIdAndUpdate(owner._id, { lastLogin: new Date() });

                        return {
                            id: owner._id.toString(),
                            name: owner.fullName,
                            email: owner.email,
                            role: 'owner'
                        };
                    }

                    // Then check Admin collection
                    const admin = await Admin.findOne({
                        username: credentials.username.toLowerCase()
                    });

                    if (admin) {
                        // Removed isActive check - registered admins can always login

                        // Check if password is valid
                        let isValid = false;
                        try {
                            // Try bcrypt compare first
                            isValid = await bcrypt.compare(credentials.password, admin.password);
                        } catch (e) {
                            // bcrypt failed - password might not be hashed
                            isValid = false;
                        }

                        // If bcrypt failed, check if password was stored unhashed
                        if (!isValid && admin.password === credentials.password) {
                            // Password was stored unhashed - update to hashed
                            const hashedPass = await bcrypt.hash(credentials.password, 12);
                            await Admin.findByIdAndUpdate(admin._id, { password: hashedPass });
                            isValid = true;
                        }

                        if (!isValid) return null;

                        await Admin.findByIdAndUpdate(admin._id, { lastLogin: new Date() });

                        return {
                            id: admin._id.toString(),
                            name: admin.fullName,
                            email: admin.email,
                            role: 'admin'
                        };
                    }

                    // Then check ShopUser collection
                    console.log('Checking ShopUser for:', credentials.username.toLowerCase());
                    const shopUser = await ShopUser.findOne({
                        username: credentials.username.toLowerCase()
                    });

                    console.log('ShopUser found:', shopUser ? 'Yes' : 'No');

                    if (shopUser) {
                        // Removed isActive check - registered users can always login
                        // (Keeping debug logs for now)

                        // Check if password is valid
                        let isValid = false;
                        console.log('Comparing passwords...');
                        console.log('Password from DB length:', shopUser.password?.length);
                        console.log('Password starts with $2a:', shopUser.password?.startsWith('$2a'));

                        try {
                            // Try bcrypt compare first
                            isValid = await bcrypt.compare(credentials.password, shopUser.password);
                            console.log('bcrypt compare result:', isValid);
                        } catch (e) {
                            console.error('bcrypt compare error:', e);
                            isValid = false;
                        }

                        // If bcrypt failed, check if password was stored unhashed
                        if (!isValid && shopUser.password === credentials.password) {
                            console.log('Direct password match - updating to hash');
                            const hashedPass = await bcrypt.hash(credentials.password, 12);
                            await ShopUser.findByIdAndUpdate(shopUser._id, { password: hashedPass });
                            isValid = true;
                        }

                        if (!isValid) {
                            console.log('Password validation failed, returning null');
                            return null;
                        }

                        console.log('Login successful for ShopUser:', shopUser.username);
                        await ShopUser.findByIdAndUpdate(shopUser._id, { lastLogin: new Date() });

                        return {
                            id: shopUser._id.toString(),
                            name: shopUser.fullName,
                            email: shopUser.email,
                            role: 'user',
                            assignedShops: shopUser.assignedShops
                        };
                    }

                    return null;
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.assignedShops = (user as any).assignedShops;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).assignedShops = token.assignedShops;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
};
