import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface AuthPayload {
  userId: string;
  username: string;
  role: string;
}

export class AuthService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'change-me-in-production';

    if (this.jwtSecret === 'change-me-in-production') {
      logger.warn('⚠️  Using default JWT_SECRET! Set a secure secret in production.');
    }
  }

  /**
   * Create initial admin user if no users exist
   */
  async initializeDefaultUser(): Promise<void> {
    try {
      const userCount = await prisma.user.count();

      if (userCount === 0) {
        const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        await prisma.user.create({
          data: {
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
          },
        });

        logger.info('✅ Created default admin user');
        logger.info(`   Username: admin`);
        logger.info(`   Password: ${defaultPassword}`);
        logger.info('   ⚠️  Change password after first login!');
      }
    } catch (error: any) {
      logger.error('Error initializing default user:', error.message);
    }
  }

  /**
   * Authenticate user and return JWT token
   */
  async login(username: string, password: string): Promise<{ token: string; user: any } | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        logger.warn(`Login attempt failed: user '${username}' not found`);
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        logger.warn(`Login attempt failed: invalid password for user '${username}'`);
        return null;
      }

      const payload: AuthPayload = {
        userId: user.id,
        username: user.username,
        role: user.role,
      };

      const token = jwt.sign(payload, this.jwtSecret, {
        expiresIn: '7d', // Token valid for 7 days
      });

      logger.info(`User '${username}' logged in successfully`);

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error: any) {
      logger.error('Login error:', error.message);
      throw new Error('Login failed');
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): AuthPayload | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as AuthPayload;
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return false;
      }

      const isValidPassword = await bcrypt.compare(oldPassword, user.password);

      if (!isValidPassword) {
        logger.warn(`Password change failed: invalid old password for user '${user.username}'`);
        return false;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      logger.info(`Password changed successfully for user '${user.username}'`);
      return true;
    } catch (error: any) {
      logger.error('Change password error:', error.message);
      return false;
    }
  }

  /**
   * Create new user (admin only)
   */
  async createUser(username: string, password: string, email?: string, role: string = 'user'): Promise<any> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          email,
          role,
        },
      });

      logger.info(`Created new user '${username}' with role '${role}'`);

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
    } catch (error: any) {
      logger.error('Create user error:', error.message);
      throw new Error('Failed to create user');
    }
  }
}

export const authService = new AuthService();
