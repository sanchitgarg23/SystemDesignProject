import QRCode from 'qrcode';
import crypto from 'crypto';

const QR_SECRET = process.env.QR_SECRET || 'sih_qr_secret_2024';

/**
 * QRService — QR Code Generation and Validation
 * 
 * Encapsulates all QR code operations including payload signing,
 * image generation, and verification.
 * 
 * Design Pattern: Facade
 * - Hides the complexity of HMAC signing, QR encoding, and validation
 *   behind simple method calls.
 * 
 * OOP Concept: Encapsulation
 * - HMAC secret and signing logic are private implementation details
 * - External callers only see generateBookingQR() and verifyBookingQR()
 */
export class QRService {
  /**
   * Generate QR code data and image for a booking
   */
  public static async generateBookingQR(bookingId: string): Promise<{ qrData: string; qrImage: string }> {
    const timestamp = Date.now();

    // Create QR payload
    const payload = {
      bookingId,
      timestamp,
      type: 'BOOKING',
    };

    // Sign the payload
    const signature = QRService.createSignature(JSON.stringify(payload));

    const qrData = JSON.stringify({
      ...payload,
      signature,
    });

    // Generate QR code as base64 data URL
    const qrImage = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return { qrData, qrImage };
  }

  /**
   * Verify QR code data from conductor scan
   */
  public static verifyBookingQR(qrData: string): {
    valid: boolean;
    bookingId?: string;
    error?: string;
  } {
    try {
      const parsed = JSON.parse(qrData);

      if (!parsed.bookingId || !parsed.timestamp || !parsed.signature) {
        return { valid: false, error: 'Invalid QR format' };
      }

      // Recreate payload without signature
      const payload = {
        bookingId: parsed.bookingId,
        timestamp: parsed.timestamp,
        type: parsed.type || 'BOOKING',
      };

      // Verify signature
      const expectedSignature = QRService.createSignature(JSON.stringify(payload));

      if (parsed.signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }

      // Check if QR is too old (24 hours)
      const age = Date.now() - parsed.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (age > maxAge) {
        return { valid: false, error: 'QR code expired' };
      }

      return { valid: true, bookingId: parsed.bookingId };
    } catch (error) {
      return { valid: false, error: 'Failed to parse QR data' };
    }
  }

  /**
   * Create HMAC signature for data (private implementation detail)
   */
  private static createSignature(data: string): string {
    return crypto
      .createHmac('sha256', QR_SECRET)
      .update(data)
      .digest('hex')
      .substring(0, 16); // Use first 16 chars for shorter QR
  }
}

// Backward-compatible named exports
export const generateBookingQR = QRService.generateBookingQR;
export const verifyBookingQR = QRService.verifyBookingQR;
