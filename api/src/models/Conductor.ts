import mongoose from 'mongoose';
import { IBasePersonnel, createPersonnelSchema } from './BasePersonnel';

/**
 * Conductor Model
 * 
 * Extends IBasePersonnel via inheritance — shares name, phone, licenseNo,
 * status, and currentBusId with the Driver model.
 * 
 * OOP Concept: Inheritance
 * - IConductor extends IBasePersonnel (adds conductorId)
 * - Uses createPersonnelSchema() factory for shared schema fields
 */
export interface IConductor extends IBasePersonnel {
  conductorId: string;
}

const ConductorSchema = createPersonnelSchema();

// Add Conductor-specific field on top of inherited personnel fields
ConductorSchema.add({
  conductorId: { type: String, required: true, unique: true },
});

export const Conductor = mongoose.model<IConductor>('Conductor', ConductorSchema);
