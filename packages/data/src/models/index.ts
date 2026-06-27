import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { ScanIntake, ScanStatus, SourceCollectionResult } from '@growthpath/shared';

export interface BusinessDocument extends Document {
  bizName: string;
  bizAddress: string;
  bizDomain: string;
  bizCity: string;
  bizVertical: string;
  verticalKey: string;
  bizType: string;
  gbpPrimaryCategory?: string;
  bizTier: string;
  scanTier: string;
  ownerServices: string[];
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<BusinessDocument>(
  {
    bizName: { type: String, required: true },
    bizAddress: { type: String, required: true },
    bizDomain: { type: String, required: true, index: true },
    bizCity: { type: String, required: true },
    bizVertical: { type: String, required: true },
    verticalKey: { type: String, required: true },
    bizType: { type: String, required: true },
    gbpPrimaryCategory: { type: String },
    bizTier: { type: String, required: true },
    scanTier: { type: String, required: true },
    ownerServices: { type: [String], required: true },
  },
  { timestamps: true },
);

businessSchema.index({ bizDomain: 1, bizCity: 1 });

export const Business =
  mongoose.models.Business || mongoose.model<BusinessDocument>('Business', businessSchema);

export interface ScanDocument extends Document {
  businessId: Types.ObjectId;
  userId?: Types.ObjectId;
  sampleSeedKey?: string;
  scanTier: string;
  status: ScanStatus;
  startedAt?: Date;
  completedAt?: Date;
  totalCost?: number;
  partialReasons: string[];
  collectionStatus: SourceCollectionResult[];
  retryOfScanId?: Types.ObjectId;
  retryMode?: 'full' | 'missing_sources';
  pdfExport?: {
    status: 'queued' | 'running' | 'complete' | 'failed';
    s3Key?: string;
    error?: string;
    requestedAt?: Date;
    completedAt?: Date;
  };
  actionPlanProgress?: {
    completedTaskIds: number[];
    updatedAt: Date;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const scanSchema = new Schema<ScanDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    sampleSeedKey: { type: String, index: true },
    scanTier: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'partial', 'complete', 'failed'],
      default: 'queued',
      index: true,
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    totalCost: { type: Number },
    partialReasons: { type: [String], default: [] },
    collectionStatus: { type: Schema.Types.Mixed, default: [] },
    retryOfScanId: { type: Schema.Types.ObjectId, ref: 'Scan' },
    retryMode: { type: String, enum: ['full', 'missing_sources'] },
    pdfExport: {
      status: { type: String, enum: ['queued', 'running', 'complete', 'failed'] },
      s3Key: { type: String },
      error: { type: String },
      requestedAt: { type: Date },
      completedAt: { type: Date },
    },
    actionPlanProgress: {
      completedTaskIds: { type: [Number], default: [] },
      updatedAt: { type: Date },
    },
    error: { type: String },
  },
  { timestamps: true },
);

export const Scan = mongoose.models.Scan || mongoose.model<ScanDocument>('Scan', scanSchema);

export interface ScanResultDocument extends Document {
  scanId: Types.ObjectId;
  businessId: Types.ObjectId;
  auditData: Record<string, unknown>;
  scores: Record<string, unknown>;
  p1: number;
  p2: number;
  profile: string;
  createdAt: Date;
  updatedAt: Date;
}

const scanResultSchema = new Schema<ScanResultDocument>(
  {
    scanId: { type: Schema.Types.ObjectId, ref: 'Scan', required: true, unique: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    auditData: { type: Schema.Types.Mixed, required: true },
    scores: { type: Schema.Types.Mixed, required: true },
    p1: { type: Number, required: true },
    p2: { type: Number, required: true },
    profile: { type: String, required: true },
  },
  { timestamps: true },
);

export const ScanResult =
  mongoose.models.ScanResult || mongoose.model<ScanResultDocument>('ScanResult', scanResultSchema);

export function intakeToBusinessFields(intake: ScanIntake) {
  return {
    bizName: intake.bizName,
    bizAddress: intake.bizAddress,
    bizDomain: intake.bizDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0],
    bizCity: intake.bizCity,
    bizVertical: intake.bizVertical,
    verticalKey: intake.verticalKey,
    bizType: intake.bizType,
    gbpPrimaryCategory: intake.gbpPrimaryCategory,
    bizTier: intake.bizTier,
    scanTier: intake.scanTier,
    ownerServices: intake.ownerServices,
  };
}
