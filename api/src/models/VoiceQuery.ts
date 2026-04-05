import mongoose, { Schema, Document } from 'mongoose';

export interface IVoiceQuery extends Document {
  queryId: string;
  userId: string | null;
  audioUrl: string;
  audioDuration: number | null;
  language: string;
  transcription: string | null;
  translatedText: string | null;
  queryType: string | null;
  intent: string | null;
  responseText: string | null;
  responseAudioUrl: string | null;
  responseLang: string;
  status: string;
  processingTime: number | null;
  deviceInfo: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const VoiceQuerySchema = new Schema<IVoiceQuery>({
  queryId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, default: null, index: true },
  audioUrl: { type: String, required: true },
  audioDuration: { type: Number, default: null },
  language: { type: String, default: 'pa', index: true }, // Punjabi by default
  transcription: { type: String, default: null },
  translatedText: { type: String, default: null },
  queryType: { type: String, default: null, index: true },
  intent: { type: String, default: null },
  responseText: { type: String, default: null },
  responseAudioUrl: { type: String, default: null },
  responseLang: { type: String, default: 'pa' },
  status: { type: String, default: 'pending', index: true },
  processingTime: { type: Number, default: null },
  deviceInfo: { type: String, default: null },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

VoiceQuerySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const VoiceQuery = mongoose.model<IVoiceQuery>('VoiceQuery', VoiceQuerySchema);
