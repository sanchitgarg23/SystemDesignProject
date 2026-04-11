import { Schema, Document } from 'mongoose';

/**
 * BasePersonnel — Abstract Interface for Personnel Entities
 * 
 * Demonstrates OOP Inheritance: Driver and Conductor share identical
 * structure (name, phone, licenseNo, status, currentBusId). Rather than
 * duplicating this across both models, we define a base interface and
 * a schema factory function.
 * 
 * OOP Concept: Inheritance
 * - IBasePersonnel serves as the "parent class" interface
 * - IDriver and IConductor extend it with their specific ID fields
 * - createPersonnelSchema() provides the shared schema definition
 */
export interface IBasePersonnel extends Document {
  name: string;
  phone: string;
  licenseNo: string;
  status: 'active' | 'inactive' | 'on_leave';
  currentBusId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Factory function to create the shared personnel schema.
 * Both Driver and Conductor models use this as their base schema,
 * then add their specific ID field on top.
 * 
 * This avoids code duplication and ensures consistent field definitions
 * across personnel entities.
 */
export function createPersonnelSchema(): Schema {
  return new Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    licenseNo: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave'],
      default: 'active',
    },
    currentBusId: { type: String, default: null },
  }, { timestamps: true });
}
