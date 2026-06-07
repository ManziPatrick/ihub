import { ApplicationPhase, IApplicationPhase } from '../models/ApplicationPhase';
import { InternshipProgram } from '../models/internship/InternshipProgram';

export class ApplicationPhaseService {
  /**
   * Create a new application phase
   */
  static async createPhase(
    programId: string,
    phaseData: {
      name: string;
      description?: string;
      order: number;
      requiredDeliverables?: any[];
      estimatedDurationDays?: number;
      enableApproval?: boolean;
      approvalType?: 'single' | 'multiple';
      notificationOnCompletion?: boolean;
      isInterviewPhase?: boolean;
      allowMeetingScheduling?: boolean;
    }
  ): Promise<IApplicationPhase> {
    const phase = new ApplicationPhase({
      programId,
      ...phaseData,
    });

    const savedPhase = await phase.save();

    // Add phase to program's phases array
    await InternshipProgram.findByIdAndUpdate(
      programId,
      { $push: { phases: savedPhase._id } },
      { new: true }
    );

    return savedPhase;
  }

  /**
   * Get all phases for a program
   */
  static async getPhasesByProgram(programId: string): Promise<IApplicationPhase[]> {
    return ApplicationPhase.find({ programId }).sort({ order: 1 });
  }

  /**
   * Get a single phase
   */
  static async getPhaseById(phaseId: string): Promise<IApplicationPhase | null> {
    return ApplicationPhase.findById(phaseId);
  }

  /**
   * Update a phase
   */
  static async updatePhase(
    phaseId: string,
    updateData: Partial<IApplicationPhase>
  ): Promise<IApplicationPhase | null> {
    return ApplicationPhase.findByIdAndUpdate(phaseId, updateData, { new: true });
  }

  /**
   * Delete a phase
   */
  static async deletePhase(phaseId: string): Promise<boolean> {
    const phase = await ApplicationPhase.findById(phaseId);
    if (!phase) return false;

    // Remove phase from program's phases array
    await InternshipProgram.findByIdAndUpdate(
      phase.programId,
      { $pull: { phases: phaseId } },
      { new: true }
    );

    await ApplicationPhase.findByIdAndDelete(phaseId);
    return true;
  }

  /**
   * Reorder phases within a program
   */
  static async reorderPhases(
    programId: string,
    phaseIds: string[]
  ): Promise<any[]> {
    const updates = phaseIds.map((id, index) =>
      ApplicationPhase.findByIdAndUpdate(id, { order: index }, { new: true })
    );
    return Promise.all(updates) as any;
  }

  /**
   * Get interview phases for a program
   */
  static async getInterviewPhases(programId: string): Promise<IApplicationPhase[]> {
    return ApplicationPhase.find({
      programId,
      isInterviewPhase: true,
    }).sort({ order: 1 });
  }

  /**
   * Get phases with meeting scheduling enabled
   */
  static async getSchedulingPhases(programId: string): Promise<IApplicationPhase[]> {
    return ApplicationPhase.find({
      programId,
      allowMeetingScheduling: true,
    }).sort({ order: 1 });
  }
}
