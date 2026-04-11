import mongoose from 'mongoose';
import { IBasePersonnel, createPersonnelSchema } from './BasePersonnel';

/**
 * Driver Model
 * 
 * Extends IBasePersonnel via inheritance — shares name, phone, licenseNo,
 * status, and currentBusId with the Conductor model.
 * 
 * OOP Concept: Inheritance
 * - IDriver extends IBasePersonnel (adds driverId)
 * - Uses createPersonnelSchema() factory for shared schema fields
 */
export interface IDriver extends IBasePersonnel {
  driverId: string;
}

const DriverSchema = createPersonnelSchema();

// Add Driver-specific field on top of inherited personnel fields
DriverSchema.add({
  driverId: { type: String, required: true, unique: true },
});

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
