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
import { createPaypackService, PawaPayService } from './paypack.service';
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
  private pawapayService: PawaPayService | null = null;

  private getPawaPayService(): PawaPayService | null {
    if (this.pawapayService) return this.pawapayService;
    try {
      this.pawapayService = createPaypackService();
      return this.pawapayService;
    } catch {
      return null;
    }
  }

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
   * Get the primary provider for disbursements (defaults to 'pawapay')
   * Read from Config model — super admin can set via GraphQL mutation
   */
  async getDisbursementPrimaryProvider(): Promise<'pawapay' | 'intouch'> {
    const config = await Config.findOne({ key: 'disbursement_primary_provider' });
    if (config?.value === 'intouch') return 'intouch';
    return 'pawapay'; // default
  }

  /**
   * Attempt payout via PawaPay
   */
  private async tryPawaPayPayout(disbursement: any): Promise<{
    success: boolean;
    referenceId?: string;
    message: string;
  }> {
    try {
      const pawapay = this.getPawaPayService();
      if (!pawapay) {
        return { success: false, message: 'PawaPay service not configured' };
      }

      // Normalize phone: ensure international format (250 prefix for Rwandan numbers)
      const normalizedPhone = normalizePhone(disbursement.ownerPhone);

      const result = await pawapay.initiateDisbursement({
        amount: disbursement.netAmount,
        phoneNumber: normalizedPhone,
        reason: `Commission payout for ${disbursement.itemType} #${disbursement.itemId.toString().slice(-8)}`,
      });

      if (result.success) {
        return {
          success: true,
          referenceId: result.transactionId || '',
          message: '✅ PawaPay payout accepted. Money sent directly to recipient (no PIN required).',
        };
      }

      return { success: false, message: `❌ PawaPay payout failed: ${result.message}` };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'PawaPay payout failed' };
    }
  }

  /**
   * Attempt payout via Intouch
   */
  private async tryIntouchPayout(disbursement: any): Promise<{
    success: boolean;
    transactionId?: string;
    referenceId?: string;
    message: string;
  }> {
    const trxRef = `DBS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      const normalizedPhone = normalizePhone(disbursement.ownerPhone);
      const result = await this.intouchService.requestDeposit({
        amount: disbursement.netAmount,
        phoneNumber: normalizedPhone,
        requestTransactionId: trxRef,
        reason: `Commission payout for ${disbursement.itemType}`,
        withdrawCharge: 0,
        serviceId: 1,
      });

      if (result.success) {
        return {
          success: true,
          transactionId: result.transactionId,
          referenceId: result.referenceId,
          message: result.message || 'Intouch payout successful',
        };
      }

      return { success: false, message: result.message || 'Intouch payout failed' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Intouch payout failed' };
    }
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

      // Calculate release date: configurable hold period (default 15 days) for refunds
      const holdDaysConfig = await Config.findOne({ key: 'disbursement_hold_days' });
      const holdDays = parseInt(holdDaysConfig?.value as string, 10) || 15;
      const releaseDate = new Date();
      releaseDate.setDate(releaseDate.getDate() + holdDays);

      // Create disbursement record with OnHold status (15-day approval hold)
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
        status: 'OnHold',
        releaseDate,
        autoDisbursement: autoDisbursementEnabled,
        retryCount: 0,
        statusHistory: [
          {
            status: 'OnHold',
            timestamp: new Date(),
            note: `Disbursement held for ${holdDays}-day refund period. Eligible for release after ${releaseDate.toISOString().split('T')[0]}`,
          },
        ],
      });

      await disbursement.save();

      return {
        success: true,
        disbursementId: disbursement._id.toString(),
        message: `Disbursement created and placed on hold for ${holdDays}-day refund period. Eligible for release on ${releaseDate.toISOString().split('T')[0]}. Only super admin can approve.`,
        netAmount,
        platformCommission,
      };
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
   * Helper: Attempt payout via the given provider, update disbursement record on success
   * Returns true if successful
   */
  private async attemptPayout(
    disbursement: any,
    provider: 'pawapay' | 'intouch'
  ): Promise<boolean> {
    if (provider === 'pawapay') {
      const result = await this.tryPawaPayPayout(disbursement);
      if (result.success) {
        disbursement.status = 'Successful';
        disbursement.intouchReferenceId = result.referenceId;
        disbursement.intouchTransactionRef = `PAWAPAY-${result.referenceId}`;
        disbursement.failureReason = '';
        disbursement.statusHistory.push({
          status: 'Successful',
          timestamp: new Date(),
          note: `Payout successful via PawaPay. Ref: ${result.referenceId}`,
        });
        await disbursement.save();
        return true;
      }
      console.warn(`⚠️ PawaPay payout failed: ${result.message}`);
      return false;
    } else {
      const trxRef = `DBS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const result = await this.tryIntouchPayout(disbursement);
      if (result.success) {
        disbursement.status = 'Successful';
        disbursement.intouchReferenceId = result.referenceId;
        disbursement.intouchTransactionRef = result.transactionId || trxRef;
        disbursement.failureReason = '';
        disbursement.statusHistory.push({
          status: 'Successful',
          timestamp: new Date(),
          note: `Payout successful via Intouch. Ref: ${result.referenceId || result.transactionId}`,
        });
        await disbursement.save();
        return true;
      }
      console.warn(`⚠️ Intouch payout failed: ${result.message}`);
      return false;
    }
  }

  /**
   * Retry a failed disbursement
   * Tries primary provider first (default: PawaPay), falls back to secondary
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
    disbursement.failureReason = '';
    disbursement.statusHistory.push({
      status: 'Processing',
      timestamp: new Date(),
      note: `Retry attempt #${disbursement.retryCount}`,
    });
    await disbursement.save();

    // Determine provider order from config
    const primaryProvider = await this.getDisbursementPrimaryProvider();
    const secondaryProvider = primaryProvider === 'pawapay' ? 'intouch' : 'pawapay';

    console.log(`🔄 Retry #${disbursement.retryCount}: trying ${primaryProvider} first, then ${secondaryProvider}`);

    // Try primary provider first
    const primarySuccess = await this.attemptPayout(disbursement, primaryProvider);
    if (primarySuccess) {
      return {
        success: true,
        disbursementId: disbursement._id.toString(),
        message: `Retry successful via ${primaryProvider}`,
        netAmount: disbursement.netAmount,
        platformCommission: disbursement.platformCommission,
        intouchReferenceId: disbursement.intouchReferenceId,
      };
    }

    // Fall back to secondary provider
    const secondarySuccess = await this.attemptPayout(disbursement, secondaryProvider);
    if (secondarySuccess) {
      return {
        success: true,
        disbursementId: disbursement._id.toString(),
        message: `Retry successful via ${secondaryProvider} (fallback)`,
        netAmount: disbursement.netAmount,
        platformCommission: disbursement.platformCommission,
        intouchReferenceId: disbursement.intouchReferenceId,
      };
    }

    // Both providers failed
    disbursement.status = 'Failed';
    disbursement.failureReason = `Both ${primaryProvider} and ${secondaryProvider} failed after ${disbursement.retryCount} retries.`;
    disbursement.statusHistory.push({
      status: 'Failed',
      timestamp: new Date(),
      note: `Retry failed via both ${primaryProvider} and ${secondaryProvider}.`,
    });
    await disbursement.save();

    return {
      success: false,
      disbursementId: disbursement._id.toString(),
      message: `Retry failed via both ${primaryProvider} and ${secondaryProvider}`,
      netAmount: disbursement.netAmount,
      platformCommission: disbursement.platformCommission,
    };
  }

  /**
   * Approve a held disbursement for release (super admin only, after 15-day hold period)
   * Tries primary provider first (default: PawaPay), falls back to secondary
   */
  async approveDisbursement(disbursementId: string, approvedBy: string): Promise<DisbursementResult> {
    const disbursement = await CommissionDisbursement.findById(disbursementId);
    if (!disbursement) {
      return { success: false, message: 'Disbursement record not found' };
    }

    if (disbursement.status !== 'OnHold') {
      return {
        success: false,
        disbursementId: disbursement._id.toString(),
        message: `Disbursement is not on hold. Current status: ${disbursement.status}`,
      };
    }

    if (disbursement.releaseDate && new Date() < disbursement.releaseDate) {
      return {
        success: false,
        disbursementId: disbursement._id.toString(),
        message: `Disbursement cannot be released until ${disbursement.releaseDate.toISOString().split('T')[0]}. The hold period has not elapsed.`,
      };
    }

    // Mark as approved
    disbursement.approvedBy = new mongoose.Types.ObjectId(approvedBy);
    disbursement.approvedAt = new Date();
    disbursement.status = 'Processing';
    disbursement.failureReason = '';
    disbursement.statusHistory.push({
      status: 'Processing',
      timestamp: new Date(),
      note: `Disbursement approved by ${approvedBy} after hold period`,
    });
    await disbursement.save();

    // Determine provider order from config
    const primaryProvider = await this.getDisbursementPrimaryProvider();
    const secondaryProvider = primaryProvider === 'pawapay' ? 'intouch' : 'pawapay';

    console.log(`🔄 Approve disbursement: trying ${primaryProvider} first, then ${secondaryProvider}`);

    // Try primary provider first
    const primarySuccess = await this.attemptPayout(disbursement, primaryProvider);
    if (primarySuccess) {
      return {
        success: true,
        disbursementId: disbursement._id.toString(),
        message: `Disbursement approved and paid successfully via ${primaryProvider}`,
        netAmount: disbursement.netAmount,
        platformCommission: disbursement.platformCommission,
        intouchReferenceId: disbursement.intouchReferenceId,
      };
    }

    // Fall back to secondary provider
    const secondarySuccess = await this.attemptPayout(disbursement, secondaryProvider);
    if (secondarySuccess) {
      return {
        success: true,
        disbursementId: disbursement._id.toString(),
        message: `Disbursement approved and paid via ${secondaryProvider} (fallback)`,
        netAmount: disbursement.netAmount,
        platformCommission: disbursement.platformCommission,
        intouchReferenceId: disbursement.intouchReferenceId,
      };
    }

    // Both providers failed
    disbursement.status = 'Failed';
    disbursement.failureReason = `Both ${primaryProvider} and ${secondaryProvider} failed after approval.`;
    disbursement.statusHistory.push({
      status: 'Failed',
      timestamp: new Date(),
      note: `Approved disbursement failed via both ${primaryProvider} and ${secondaryProvider}.`,
    });
    await disbursement.save();

    return {
      success: false,
      disbursementId: disbursement._id.toString(),
      message: `Disbursement approved but payout failed via both ${primaryProvider} and ${secondaryProvider}`,
      netAmount: disbursement.netAmount,
      platformCommission: disbursement.platformCommission,
    };
  }

  /**
   * Force-approve a held disbursement (super admin only, bypasses hold period check)
   * Processes the payout immediately regardless of release date
   */
  async forceApproveDisbursement(disbursementId: string, approvedBy: string): Promise<DisbursementResult> {
    const disbursement = await CommissionDisbursement.findById(disbursementId);
    if (!disbursement) {
      return { success: false, message: 'Disbursement record not found' };
    }

    if (disbursement.status !== 'OnHold') {
      return {
        success: false,
        disbursementId: disbursement._id.toString(),
        message: `Disbursement is not on hold. Current status: ${disbursement.status}`,
      };
    }

    // Mark as approved — no release date check
    disbursement.approvedBy = new mongoose.Types.ObjectId(approvedBy);
    disbursement.approvedAt = new Date();
    disbursement.status = 'Processing';
    disbursement.failureReason = '';
    disbursement.statusHistory.push({
      status: 'Processing',
      timestamp: new Date(),
      note: `Disbursement force-approved by super admin ${approvedBy} (bypassed hold period)`,
    });
    await disbursement.save();

    // Determine provider order from config
    const primaryProvider = await this.getDisbursementPrimaryProvider();
    const secondaryProvider = primaryProvider === 'pawapay' ? 'intouch' : 'pawapay';

    console.log(`⚡ Force approve disbursement: trying ${primaryProvider} first, then ${secondaryProvider}`);

    // Try primary provider first
    const primarySuccess = await this.attemptPayout(disbursement, primaryProvider);
    if (primarySuccess) {
      return {
        success: true,
        disbursementId: disbursement._id.toString(),
        message: `Disbursement force-approved and paid successfully via ${primaryProvider}`,
        netAmount: disbursement.netAmount,
        platformCommission: disbursement.platformCommission,
        intouchReferenceId: disbursement.intouchReferenceId,
      };
    }

    // Fall back to secondary provider
    const secondarySuccess = await this.attemptPayout(disbursement, secondaryProvider);
    if (secondarySuccess) {
      return {
        success: true,
        disbursementId: disbursement._id.toString(),
        message: `Disbursement force-approved and paid via ${secondaryProvider} (fallback)`,
        netAmount: disbursement.netAmount,
        platformCommission: disbursement.platformCommission,
        intouchReferenceId: disbursement.intouchReferenceId,
      };
    }

    // Both providers failed
    disbursement.status = 'Failed';
    disbursement.failureReason = `Both ${primaryProvider} and ${secondaryProvider} failed after force-approval.`;
    disbursement.statusHistory.push({
      status: 'Failed',
      timestamp: new Date(),
      note: `Force-approved disbursement failed via both ${primaryProvider} and ${secondaryProvider}.`,
    });
    await disbursement.save();

    return {
      success: false,
      disbursementId: disbursement._id.toString(),
      message: `Disbursement force-approved but payout failed via both ${primaryProvider} and ${secondaryProvider}`,
      netAmount: disbursement.netAmount,
      platformCommission: disbursement.platformCommission,
    };
  }

  /**
   * Get the configured hold days from Config
   */
  async getHoldDays(): Promise<number> {
    const config = await Config.findOne({ key: 'disbursement_hold_days' });
    return parseInt(config?.value as string, 10) || 15;
  }

  /**
   * Set the hold days (super admin only)
   */
  async setHoldDays(days: number): Promise<number> {
    const clamped = Math.max(0, Math.min(365, days));
    await Config.findOneAndUpdate(
      { key: 'disbursement_hold_days' },
      {
        $set: {
          value: clamped.toString(),
          description: 'Number of days disbursements are held before release (0 = no hold)',
        },
      },
      { upsert: true }
    );
    return clamped;
  }

  /**
   * Void/refund a held disbursement (super admin only)
   * Cancels the disbursement without sending money, effectively refunding the customer
   */
  async voidDisbursement(disbursementId: string, voidedBy: string, reason?: string): Promise<DisbursementResult> {
    const disbursement = await CommissionDisbursement.findById(disbursementId);
    if (!disbursement) {
      return { success: false, message: 'Disbursement record not found' };
    }

    if (disbursement.status !== 'OnHold') {
      return {
        success: false,
        disbursementId: disbursement._id.toString(),
        message: `Only OnHold disbursements can be voided. Current status: ${disbursement.status}`,
      };
    }

    // Mark as voided/refunded
    disbursement.status = 'Failed';
    disbursement.failureReason = reason || `Voided by super admin before release. Payment should be refunded to customer.`;
    disbursement.approvedBy = new mongoose.Types.ObjectId(voidedBy);
    disbursement.approvedAt = new Date();
    disbursement.statusHistory.push({
      status: 'Failed',
      timestamp: new Date(),
      note: `Disbursement voided by super admin ${voidedBy}. Reason: ${reason || 'Customer refund'}. Net amount ${disbursement.netAmount} RWF was NOT sent.`,
    });
    await disbursement.save();

    return {
      success: true,
      disbursementId: disbursement._id.toString(),
      message: `Disbursement voided successfully. ${disbursement.netAmount} RWF was NOT sent to the owner. The payment can now be refunded to the customer.`,
      netAmount: disbursement.netAmount,
      platformCommission: disbursement.platformCommission,
    };
  }

  /**
   * Manually trigger disbursement for a payment
   * Tries primary provider first (default: PawaPay), falls back to secondary
   */
  async manualDisburse(
    paymentId: string,
    amount: number,
    phoneNumber: string,
    reason?: string
  ): Promise<DisbursementResult> {
    const primaryProvider = await this.getDisbursementPrimaryProvider();
    const secondaryProvider = primaryProvider === 'pawapay' ? 'intouch' : 'pawapay';

    console.log(`💰 Manual disbursement: trying ${primaryProvider} first, then ${secondaryProvider}`);

    // Helper: try payout via a specific provider
    const tryPayout = async (provider: 'pawapay' | 'intouch'): Promise<{
      success: boolean;
      referenceId?: string;
      message: string;
    }> => {
      if (provider === 'pawapay') {
        const pawapay = this.getPawaPayService();
        if (!pawapay) {
          return { success: false, message: 'PawaPay service not configured' };
        }
        // Normalize phone: ensure international format (250 prefix for Rwandan numbers)
        const normalizedPhone = normalizePhone(phoneNumber);
        const result = await pawapay.initiateDisbursement({
          amount,
          phoneNumber: normalizedPhone,
          reason: reason || 'Manual disbursement from platform',
        });
        if (result.success) {
          return { success: true, referenceId: result.transactionId || '', message: result.message || '✅ PawaPay payout successful' };
        }
        return { success: false, message: result.message || 'PawaPay payout failed' };
      } else {
        const trxRef = `MAN-DBS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const normalizedPhone = normalizePhone(phoneNumber);
        const result = await this.intouchService.requestDeposit({
          amount,
          phoneNumber: normalizedPhone,
          requestTransactionId: trxRef,
          reason: reason || 'Manual disbursement from platform',
          withdrawCharge: 0,
          serviceId: 1,
        });
        if (result.success) {
          return { success: true, referenceId: result.referenceId, message: result.message || 'Intouch payout successful' };
        }
        return { success: false, message: result.message || 'Intouch payout failed' };
      }
    };

    // Try primary provider first
    let lastResult = await tryPayout(primaryProvider);
    if (lastResult.success) {
      return {
        success: true,
        message: `Manual disbursement successful via ${primaryProvider}. ${lastResult.message}`,
        netAmount: amount,
        intouchReferenceId: lastResult.referenceId,
      };
    }

    console.warn(`⚠️ ${primaryProvider} manual disbursement failed, falling back to ${secondaryProvider}: ${lastResult.message}`);

    // Fall back to secondary provider
    lastResult = await tryPayout(secondaryProvider);
    if (lastResult.success) {
      return {
        success: true,
        message: `Manual disbursement successful via ${secondaryProvider} (fallback). ${lastResult.message}`,
        netAmount: amount,
        intouchReferenceId: lastResult.referenceId,
      };
    }

    return {
      success: false,
      message: `Manual disbursement failed via both ${primaryProvider} and ${secondaryProvider}.`,
    };
  }
}

export const disbursementService = new DisbursementService();
