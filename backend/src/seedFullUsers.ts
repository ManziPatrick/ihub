import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const users = [
    {
        username: 'superadmin',
        fullName: 'Bootskills Super Admin',
        email: 'superadmin@bootskills.com',
        password: 'Password@123',
        role: 'super_admin',
        title: 'Platform Owner',
        bio: 'Primary super admin account for Bootskills.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
        location: 'Kigali, Rwanda',
        phone: '+250780000000',
        status: 'active',
        isEmailVerified: true,
        level: 50,
        xp: 15000,
        streak: 45
    },
    {
        username: 'admin',
        fullName: 'Bootskills Admin',
        email: 'admin@bootskills.com',
        password: 'Password@123',
        role: 'admin',
        title: 'Head of Operations',
        bio: 'Platform administrator and operations lead for Bootskills.',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
        location: 'Kigali, Rwanda',
        phone: '+250780000001',
        status: 'active',
        isEmailVerified: true,
        level: 40,
        xp: 8000
    },
    {
        username: 'dev',
        fullName: 'Bootskills Developer',
        email: 'dev@bootskills.com',
        password: 'Password@123',
        role: 'trainer',
        title: 'Developer / Trainer',
        bio: 'Development and training contact for Bootskills.',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
        location: 'Kigali, Rwanda',
        phone: '+250780000002',
        status: 'active',
        isEmailVerified: true,
        level: 35,
        xp: 9000
    },
    {
        username: 'client',
        fullName: 'Bootskills Client',
        email: 'client@bootskills.com',
        password: 'Password@123',
        role: 'client',
        title: 'Client Account',
        bio: 'Bootskills client representative.',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
        location: 'Kigali, Rwanda',
        phone: '+250780000003',
        status: 'active',
        isEmailVerified: true,
        level: 10,
        xp: 500
    },
    {
        username: 'student_alice',
        fullName: 'Alice Mutoni',
        email: 'alice@example.com',
        password: 'password123',
        role: 'student',
        bio: 'Passionate about Data Science and Machine Learning.',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250',
        location: 'Musanze, Rwanda',
        status: 'active',
        isEmailVerified: true,
        level: 8,
        xp: 1200,
        streak: 12,
        academicStatus: 'intern'
    }
    ,
    {
        username: 'student_bob',
        fullName: 'Bob Kagabo',
        email: 'bob@example.com',
        password: 'password123',
        role: 'student',
        bio: 'Interested in Web Development and DevOps.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
        location: 'Kigali, Rwanda',
        status: 'active',
        isEmailVerified: true,
        level: 6,
        xp: 800,
        streak: 5,
        academicStatus: 'student'
    },
    {
        username: 'student_carla',
        fullName: 'Carla Uwase',
        email: 'carla@example.com',
        password: 'password123',
        role: 'student',
        bio: 'Aspiring UX designer and product enthusiast.',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=250',
        location: 'Butare, Rwanda',
        status: 'active',
        isEmailVerified: true,
        level: 7,
        xp: 950,
        streak: 7,
        academicStatus: 'student'
    },
    {
        username: 'student_dan',
        fullName: 'Daniel Habimana',
        email: 'daniel@example.com',
        password: 'password123',
        role: 'student',
        bio: 'Focused on mobile app development.',
        avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&q=80&w=250',
        location: 'Rwamagana, Rwanda',
        status: 'active',
        isEmailVerified: true,
        level: 5,
        xp: 600,
        streak: 3,
        academicStatus: 'student'
    },
    {
        username: 'student_ella',
        fullName: 'Ella Iradukunda',
        email: 'ella@example.com',
        password: 'password123',
        role: 'student',
        bio: 'Learner in AI ethics and applications.',
        avatar: 'https://images.unsplash.com/photo-1545996124-1b7a3f8a1d0b?auto=format&fit=crop&q=80&w=250',
        location: 'Kigali, Rwanda',
        status: 'active',
        isEmailVerified: true,
        level: 4,
        xp: 450,
        streak: 2,
        academicStatus: 'student'
    }
];

async function seedFullUsers() {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // Delete existing users to avoid duplicates
        await User.deleteMany({ email: { $in: users.map(u => u.email) } });
        console.log('🗑️  Cleared existing users');

        for (const userData of users) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = new User({
                ...userData,
                password: hashedPassword,
            });
            await user.save();
            console.log(`✅ Seeded ${userData.role}: ${userData.fullName} (@${userData.username})`);
        }

        console.log('\n🎉 All users seeded successfully with full profiles!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
}

seedFullUsers();
