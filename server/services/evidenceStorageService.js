import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EVIDENCE_DIR = path.join(__dirname, '..', 'data', 'evidence');

// Ensure evidence directory exists
try {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[EvidenceService] Unable to create evidence directory:', e.message);
}

/**
 * Sanitizes and optimizes incoming evidence snapshot.
 * Prevents MongoDB BSON document bloat (>16MB) by capping payload size.
 * Optionally offloads to local filesystem or cloud object storage.
 *
 * @param {string} rawSnapshot - Base64 image string or URI
 * @param {string} eventId - Unique event identifier
 * @returns {Promise<string>} Processed snapshot string or URI
 */
export async function processEvidenceSnapshot(rawSnapshot, eventId) {
  if (!rawSnapshot || typeof rawSnapshot !== 'string') {
    return null;
  }

  // If already a URL or path reference, return as-is
  if (rawSnapshot.startsWith('http://') || rawSnapshot.startsWith('https://') || rawSnapshot.startsWith('/evidence/')) {
    return rawSnapshot;
  }

  // Enforce 400KB maximum size ceiling on Base64 payload
  const MAX_BASE64_LENGTH = 400 * 1024;
  if (rawSnapshot.length > MAX_BASE64_LENGTH) {
    console.warn(`[EvidenceService] Evidence snapshot for ${eventId} exceeded 400KB, truncating.`);
    return rawSnapshot.substring(0, MAX_BASE64_LENGTH);
  }

  // If local file persistence is enabled or disk storage directory exists
  try {
    if (fs.existsSync(EVIDENCE_DIR) && rawSnapshot.startsWith('data:image/')) {
      const matches = rawSnapshot.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `${eventId || 'evidence_' + Date.now()}.${ext}`;
        const filePath = path.join(EVIDENCE_DIR, filename);

        // Async non-blocking file write
        fs.promises.writeFile(filePath, buffer).catch((err) => {
          console.warn('[EvidenceService] Non-critical write error:', err.message);
        });

        // In high-scale deployments, return relative path or cloud storage URI
        // For inline backward-compatibility with UI canvas, return verified base64
        return rawSnapshot;
      }
    }
  } catch (err) {
    console.warn('[EvidenceService] Fallback to inline storage:', err.message);
  }

  return rawSnapshot;
}
