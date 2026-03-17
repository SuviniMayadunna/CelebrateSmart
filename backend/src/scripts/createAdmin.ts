import prisma from '../config/database';
import { hashPassword } from '../utils/auth';

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    const hashedPassword = await hashPassword('admin123');
    
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@celebratesmart.com',
        password: hashedPassword,
        phone: '+1234567890',
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the password after first login!');
    
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠️  Admin user already exists!');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
