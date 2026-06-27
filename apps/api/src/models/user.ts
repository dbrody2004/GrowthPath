import bcrypt from 'bcryptjs';
import mongoose, { Schema, type Document } from 'mongoose';

export type UserRole = 'admin' | 'user';

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  sessionToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    sessionToken: { type: String, default: null },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = async function comparePassword(password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.models.User || mongoose.model<UserDocument>('User', userSchema);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function toUserDto(user: UserDocument) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
