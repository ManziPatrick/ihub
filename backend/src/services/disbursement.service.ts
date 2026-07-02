/**
 * Disbursement Service
 * Handles automatic disbursement of owner commissions after successful payments
 * Uses InTouchPay RequestDeposit API to send money to owner's registered phone number
 */

import mongoose from 'mongoose';
import { CommissionDisbursement } from '../models/CommissionDisbursement';
import { AdminCommission } from '../models/AdminCommission';
import { Config } from '../models/Config';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { createIntouchService } from './intouch.service';
import { Payment } from '../models/Payment';

/**
 * Normalize Rwandan phone numbers to IntouchPay-friendly format
 * - Removes + prefix
 * - Prepends 250 if number starts with 0
 * - Strips non-digit characters
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  // If starts with 0 (local format), prepend Rwanda country code
  if (cleaned.startsWith('0')) {
    cleaned = '250' + cleaned.slice(1);
  }
  // If starts with 7 (Rwandan short format like 78XX...), prepend 250
  if (cleaned.startsWith('7')) {
    cleaned = '250' + cleaned;
  }
  return cleaned;
}

interface DisbursementResult {
  success: boolean;
  disbursementId?: string;
  message: string;
  netAmount?: number;
  platformCommission?: number;
  intouchReferenceId?: string;
}

interface CommissionConfigResult {
  type: 'percentage' | 'fixed';
  value: number;
  adminId: mongoose.Types.ObjectId;
  adminPhone: string;
}

export class DisbursementService {
  private intouchService = createIntouchService();

  /**
   * Calculate commission for a given payment and item
   */
  async calculateCommission(
    payment: any,
    itemId: string,
    itemType: string
  ): Promise<{ commission: number; type: 'percentage' | 'fixed'; value: number } | null> {
    // Find the owner of the item
    let ownerId: string | null = null;


    if (itemType === 'course') {
      const course = await Course.findById(itemId).select('instructor createdBy').lean();
      if (course) {
        ownerId = course.instructor?.toString() || course.createdBy?.toString() || null;
      }
    }

    if (!ownerId) return null;

    // 1) Try platform commission configuration (global defaults)
    //    This must be the default behavior.
    const platformConfig = await this.getPlatformCommissionConfig();

    // 2) Optional override: admin-specific commission
    //    If an admin commission exists for this item, it overrides the platform default.
    const configs = await AdminCommission.find({
      adminId: ownerId,
      active: true,
    }).lean();

    const itemConfig = configs.find(
      (c: any) => c.scope === itemType && c.scopeId?.toString() === itemId
    );
    const globalAdminConfig = configs.find((c: any) => c.scope === 'global');
    const activeAdminConfig = itemConfig || globalAdminConfig;

    const commissionConfig = activeAdminConfig
      ? {
          type: activeAdminConfig.type,
          value:
            activeAdminConfig.type === 'fixed'
              ? activeAdminConfig.fixedAmount
              : activeAdminConfig.percentage,
        }
      : { type: platformConfig.type, value: platformConfig.value };

    let commissionAmount = 0;
    if (commissionConfig.type === 'fixed') {
      commissionAmount = commissionConfig.value;
    } else {
      // Percentage
      commissionAmount = payment.amount * ((commissionConfig.value || 0) / 100);
    }

    return {
      commission: Math.round(commissionAmount),
      type: commissionConfig.type as 'percentage' | 'fixed',
      value: commissionConfig.value,
    };
  }

  /**
   * Get the platform's commission configuration from Config model
   */
  async getPlatformCommissionConfig(): Promise<{
    type: 'percentage' | 'fixed';
    value: number;
  }> {
    const typeConfig = await Config.findOne({ key: 'platform_commission_type' });
    const valueConfig = await Config.findOne({ key: 'platform_commission_value' });

    const type = (typeConfig?.value as 'percentage' | 'fixed') || 'percentage';
    const value = parseFloat(valueConfig?.value as string) || 10; // Default 10%

    return { type, value };
  }

  /**
   * Find the owner/admin of an item and their phone number
   */
  async findItemOwner(itemId: string, itemType: string): Promise<{ ownerId: string; phone: string } | null> {
    let ownerId: string | null = null;

    if (itemType === 'course') {
      const course = await Course.findById(itemId).select('instructor createdBy').lean();
      if (course) {
        ownerId = course.instructor?.toString() || course.createdBy?.toString() || null;
      }
    }

    if (!ownerId) return null;

    const owner = await User.findById(ownerId).select('phone fullName email').lean();
    if (!owner || !owner.phone) return null;

    return { ownerId, phone: owner.phone };
  }

  /**
   * Auto-disburse the owner's share after a successful payment
   */
  async processDisbursement(
    paymentId: string,
    customerId: string,
    itemId: string,
    itemType: string,
    grossAmount: number
  ): Promise<DisbursementResult> {
    // Hoist ownerInfo so it's accessible in catch block
    let ownerInfo: { ownerId: string; phone: string } | null = null;

    try {
      // Check auto-disbursement is enabled
      const autoDisbursementConfig = await Config.findOne({ key: 'auto_disbursement_enabled' });
      const autoDisbursementEnabled = autoDisbursementConfig?.value !== 'false';

      // Find the owner
      ownerInfo = await this.findItemOwner(itemId, itemType);
      if (!ownerInfo) {
        return {
          success: false,
          message: 'No owner found for this item, or owner has no phone number registered',
        };
      }

      // Calculate commission
      const commissionResult = await this.calculateCommission(
        { amount: grossAmount },
        itemId,
        itemType
      );

      const platformCommission = commissionResult?.commission || 0;
      const netAmount = grossAmount - platformCommission;

      // Check for existing disbursement to prevent duplicates
      const existing = await CommissionDisbursement.findOne({
        paymentId: new mongoose.Types.ObjectId(paymentId),
        ownerId: new mongoose.Types.ObjectId(ownerInfo.ownerId),
      });

      if (existing) {
        return {
          success: existing.status === 'Successful',
          disbursementId: existing._id.toString(),
          message: `Disbursement already exists with status: ${existing.status}`,
          netAmount: existing.netAmount,
          platformCommission: existing.platformCommission,
          intouchReferenceId: existing.intouchReferenceId,
        };
      }

      // Create disbursement record
      const disbursement = new CommissionDisbursement({
        paymentId: new mongoose.Types.ObjectId(paymentId),
        customerId: new mongoose.Types.ObjectId(customerId),
        ownerId: new mongoose.Types.ObjectId(ownerInfo.ownerId),
        itemId: new mongoose.Types.ObjectId(itemId),
        itemType,
        grossAmount,
        platformCommission,
        commissionType: commissionResult?.type || 'percentage',
        commissionValue: commissionResult?.value || 0,
        netAmount,
        ownerPhone: ownerInfo.phone,
        status: autoDisbursementEnabled ? 'Processing' : 'Pending',
        autoDisbursement: autoDisbursementEnabled,
        retryCount: 0,
        statusHistory: [
          {
            status: 'Pending',
            timestamp: new Date(),
            note: autoDisbursementEnabled
              ? 'Disbursement created, processing...'
              : 'Disbursement created, pending manual trigger',
          },
        ],
      });

      // If auto-disbursement is disabled, just save and return
      if (!autoDisbursementEnabled) {
        await disbursement.save();
        return {
          success: true,
          disbursementId: disbursement._id.toString(),
          message: 'Disbursement created but auto-disbursement is disabled',
          netAmount,
          platformCommission,
        };
      }

      // Send money via InTouch
      const trxRef = `DBS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      disbursement.intouchTransactionRef = trxRef;

      const normalizedPhone = normalizePhone(ownerInfo.phone);
      const depositResult = await this.intouchService.requestDeposit({
        amount: netAmount,
        phoneNumber: normalizedPhone,
        requestTransactionId: trxRef,
        reason: `Commission payout for ${itemType}: ${itemId}`,
        withdrawCharge: 0,
        serviceId: 1,
      });

      if (depositResult.success) {
        disbursement.status = 'Successful';
        disbursement.intouchReferenceId = depositResult.referenceId;
        disbursement.intouchTransactionRef = depositResult.transactionId || trxRef;
        disbursement.statusHistory.push({
          status: 'Successful',
          timestamp: new Date(),
          note: `Disbursement completed via InTouch. Ref: ${depositResult.referenceId || depositResult.transactionId}`,
        });
        await disbursement.save();

        return {
          success: true,
          disbursementId: disbursement._id.toString(),
          message: 'Disbursement successful',
          netAmount,
          platformCommission,
          intouchReferenceId: depositResult.referenceId,
        };
      } else {
        disbursement.status = 'Failed';
        disbursement.failureReason = depositResult.message;
        disbursement.statusHistory.push({
          status: 'Failed',
          timestamp: new Date(),
          note: `Disbursement failed: ${depositResult.message}`,
        });
        await disbursement.save();

        return {
          success: false,
          disbursementId: disbursement._id.toString(),
          message: `Disbursement failed: ${depositResult.message}`,
          netAmount,
          platformCommission,
        };
      }
    } catch (error) {
      console.error('❌ Disbursement processing error:', error);

      // Try to save error info — only if we have valid IDs
      try {
        if (mongoose.Types.ObjectId.isValid(paymentId) && mongoose.Types.ObjectId.isValid(customerId)) {
          const ownerObjectId = (ownerInfo && mongoose.Types.ObjectId.isValid(ownerInfo.ownerId))
            ? new mongoose.Types.ObjectId(ownerInfo.ownerId)
            : new mongoose.Types.ObjectId(); // fallback to new ID

          const failedRecord = new CommissionDisbursement({
            paymentId: new mongoose.Types.ObjectId(paymentId),
            customerId: new mongoose.Types.ObjectId(customerId),
            ownerId: ownerObjectId,
            itemId: mongoose.Types.ObjectId.isValid(itemId) ? new mongoose.Types.ObjectId(itemId) : new mongoose.Types.ObjectId(),
            itemType,
            grossAmount,
            platformCommission: 0,
            commissionType: 'percentage',
            commissionValue: 0,
            netAmount: grossAmount,
            ownerPhone: (ownerInfo && ownerInfo.phone) || '',
            status: 'Failed',
            autoDisbursement: true,
            retryCount: 0,
            failureReason: error instanceof Error ? error.message : 'Unknown error',
            statusHistory: [
              {
                status: 'Failed',
                timestamp: new Date(),
                note: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
          });
          await failedRecord.save();
        }
      } catch (innerErr) {
        console.error('Failed to save error disbursement record:', innerErr);
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Disbursement processing failed',
      };
    }
  }

  /**
   * Retry a failed disbursement
   */
  async retryDisbursement(disbursementId: string): Promise<DisbursementResult> {
    const disbursement = await CommissionDisbursement.findById(disbursementId);
    if (!disbursement) {
      return { success: false, message: 'Disbursement record not found' };
    }

    if (disbursement.status === 'Successful') {
      return {
        success: true,
        disbursementId: disbursement._id.toString(),
        message: 'Disbursement already successful',
        netAmount: disbursement.netAmount,
        platformCommission: disbursement.platformCommission,
        intouchReferenceId: disbursement.intouchReferenceId,
      };
    }

    // Increment retry count
    disbursement.retryCount += 1;
    disbursement.lastRetryAt = new Date();
    disbursement.status = 'Processing';
    disbursement.statusHistory.push({
      status: 'Processing',
      timestamp: new Date(),
      note: `Retry attempt #${disbursement.retryCount}`,
    });
    await disbursement.save();

    const trxRef = `DBS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    disbursement.intouchTransactionRef = trxRef;

    const normalizedPhone = normalizePhone(disbursement.ownerPhone);
    const depositResult = await this.intouchService.requestDeposit({
      amount: disbursement.netAmount,
      phoneNumber: normalizedPhone,
      requestTransactionId: trxRef,
      reason: `Retry commission payout for ${disbursement.itemType}`,
      withdrawCharge: 0,
      serviceId: 1,
    });

    if (depositResult.success) {
      disbursement.status = 'Successful';
      disbursement.intouchReferenceId = depositResult.referenceId;
      disbursement.intouchTransactionRef = depositResult.transactionId || trxRef;
      disbursement.failureReason = '';
      disbursement.statusHistory.push({
        status: 'Successful',
        timestamp: new Date(),
        note: `Retry successful. Ref: ${depositResult.referenceId || depositResult.transactionId}`,
      });
      await disbursement.save();

      return {
        success: true,
        disbursementId: disbursement._id.toString(),
        message: 'Retry successful',
        netAmount: disbursement.netAmount,
        platformCommission: disbursement.platformCommission,
        intouchReferenceId: depositResult.referenceId,
      };
    } else {
      disbursement.status = 'Failed';
      disbursement.failureReason = depositResult.message;
      disbursement.statusHistory.push({
        status: 'Failed',
        timestamp: new Date(),
        note: `Retry failed: ${depositResult.message}`,
      });
      await disbursement.save();

      return {
        success: false,
        disbursementId: disbursement._id.toString(),
        message: `Retry failed: ${depositResult.message}`,
        netAmount: disbursement.netAmount,
        platformCommission: disbursement.platformCommission,
      };
    }
  }

  /**
   * Manually trigger disbursement for a payment
   */
  async manualDisburse(
    paymentId: string,
    amount: number,
    phoneNumber: string,
    reason?: string
  ): Promise<DisbursementResult> {
    const trxRef = `MAN-DBS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const depositResult = await this.intouchService.requestDeposit({
      amount,
      phoneNumber,
      requestTransactionId: trxRef,
      reason: reason || 'Manual disbursement from platform',
      withdrawCharge: 0,
      serviceId: 1,
    });

    if (depositResult.success) {
      return {
        success: true,
        message: 'Manual disbursement successful',
        netAmount: amount,
        intouchReferenceId: depositResult.referenceId,
      };
    }

    return {
      success: false,
      message: depositResult.message,
    };
  }
}

export const disbursementService = new DisbursementService();
