import { NextRequest } from 'next/server';
import { getDatabase } from './database';
import * as crypto from 'crypto';

// Lazy load speakeasy to avoid loading it unless needed
let speakeasy: any = null;
function getSpeakeasy() {
  if (!speakeasy) {
    speakeasy = require('speakeasy');
  }
  return speakeasy;
}

// Security configuration
const SECURITY_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
  SESSION_DURATION_HOURS: 8,
  TOTP_WINDOW: 2, // Allow 2 time windows (past and future)
  BACKUP_CODES_COUNT: 10,
};

export interface AdminSecurityRecord {
  id?: number;
  username: string;
  totp_secret?: string;
  backup_codes?: string;
  failed_attempts: number;
  locked_until?: string;
  last_login?: string;
  last_ip?: string;
  session_token?: string;
  session_expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLogEntry {
  username: string;
  action: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
}

// Encrypt sensitive data before storing in database
export function encryptSensitive(data: string): string {
  const algorithm = 'aes-256-cbc';
  const secret = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'default-secret-change-this';
  const key = crypto.scryptSync(secret, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

// Decrypt sensitive data when retrieving from database
export function decryptSensitive(encryptedData: string): string {
  const algorithm = 'aes-256-cbc';
  const secret = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'default-secret-change-this';
  const key = crypto.scryptSync(secret, 'salt', 32);
  
  const parts = encryptedData.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipher(algorithm, key);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Generate secure backup codes
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < SECURITY_CONFIG.BACKUP_CODES_COUNT; i++) {
    // Generate 8-character alphanumeric codes
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// Get or create admin security record
export async function getAdminSecurity(username: string): Promise<AdminSecurityRecord | null> {
  const database = await getDatabase();
  
  const record = await database.get(
    'SELECT * FROM admin_security WHERE username = ?',
    [username]
  );
  
  if (!record) {
    return null;
  }
  
  // Decrypt sensitive fields
  const result: AdminSecurityRecord = {
    ...record,
    totp_secret: record.totp_secret ? decryptSensitive(record.totp_secret) : undefined,
    backup_codes: record.backup_codes ? decryptSensitive(record.backup_codes) : undefined,
  };
  
  return result;
}

// Create or update admin security record
export async function updateAdminSecurity(data: Partial<AdminSecurityRecord>): Promise<void> {
  const database = await getDatabase();
  
  // Encrypt sensitive fields before storing
  const encryptedData = {
    ...data,
    totp_secret: data.totp_secret ? encryptSensitive(data.totp_secret) : undefined,
    backup_codes: data.backup_codes ? encryptSensitive(data.backup_codes) : undefined,
    updated_at: new Date().toISOString(),
  };
  
  // Check if record exists
  const existing = await database.get(
    'SELECT id FROM admin_security WHERE username = ?',
    [data.username]
  );
  
  if (existing) {
    // Update existing record
    const fields = Object.keys(encryptedData).filter(key => key !== 'username');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => encryptedData[field as keyof typeof encryptedData]);
    
    await database.run(
      `UPDATE admin_security SET ${setClause} WHERE username = ?`,
      [...values, data.username]
    );
  } else {
    // Create new record
    await database.run(`
      INSERT INTO admin_security (
        username, totp_secret, backup_codes, failed_attempts,
        locked_until, last_login, last_ip, session_token,
        session_expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.username,
      encryptedData.totp_secret,
      encryptedData.backup_codes,
      encryptedData.failed_attempts || 0,
      encryptedData.locked_until,
      encryptedData.last_login,
      encryptedData.last_ip,
      encryptedData.session_token,
      encryptedData.session_expires_at,
      new Date().toISOString(),
      encryptedData.updated_at,
    ]);
  }
}

// Check if admin is locked out due to failed attempts
export async function isAdminLockedOut(username: string): Promise<boolean> {
  const security = await getAdminSecurity(username);
  if (!security) return false;
  
  if (security.locked_until) {
    const lockoutTime = new Date(security.locked_until);
    const now = new Date();
    
    if (now < lockoutTime) {
      return true;
    } else {
      // Lockout period has expired, reset failed attempts
      await updateAdminSecurity({
        username,
        failed_attempts: 0,
        locked_until: undefined,
      });
      return false;
    }
  }
  
  return false;
}

// Record failed login attempt
export async function recordFailedAttempt(username: string, ip: string): Promise<void> {
  const security = await getAdminSecurity(username) || { username, failed_attempts: 0 };
  const newFailedAttempts = security.failed_attempts + 1;
  
  let lockedUntil: string | undefined;
  if (newFailedAttempts >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS) {
    const lockoutTime = new Date();
    lockoutTime.setMinutes(lockoutTime.getMinutes() + SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES);
    lockedUntil = lockoutTime.toISOString();
  }
  
  await updateAdminSecurity({
    username,
    failed_attempts: newFailedAttempts,
    locked_until: lockedUntil,
  });
  
  await logSecurityEvent({
    username,
    action: 'FAILED_LOGIN',
    details: `Failed attempt #${newFailedAttempts}${lockedUntil ? ' - Account locked' : ''}`,
    ip_address: ip,
    success: false,
  });
}

// Record successful login
export async function recordSuccessfulLogin(username: string, ip: string, sessionToken: string): Promise<void> {
  const sessionExpiry = new Date();
  sessionExpiry.setHours(sessionExpiry.getHours() + SECURITY_CONFIG.SESSION_DURATION_HOURS);
  
  await updateAdminSecurity({
    username,
    failed_attempts: 0,
    locked_until: undefined,
    last_login: new Date().toISOString(),
    last_ip: ip,
    session_token: sessionToken,
    session_expires_at: sessionExpiry.toISOString(),
  });
  
  await logSecurityEvent({
    username,
    action: 'SUCCESSFUL_LOGIN',
    details: 'Admin logged in successfully',
    ip_address: ip,
    success: true,
  });
}

// Generate and store TOTP secret for 2FA setup
export async function generateTOTPSecret(username: string): Promise<{ secret: string; qrCodeUrl: string }> {
  const speakeasyLib = getSpeakeasy();
  const secret = speakeasyLib.generateSecret({
    name: `Porch Records Admin (${username})`,
    issuer: 'Porch Records',
    length: 32,
  });
  
  // Store the secret in database
  await updateAdminSecurity({
    username,
    totp_secret: secret.base32,
  });
  
  await logSecurityEvent({
    username,
    action: 'TOTP_SECRET_GENERATED',
    details: '2FA secret generated',
    success: true,
  });
  
  return {
    secret: secret.base32,
    qrCodeUrl: secret.otpauth_url,
  };
}

// Verify TOTP code with proper time window
export async function verifyTOTPCode(username: string, token: string): Promise<boolean> {
  const security = await getAdminSecurity(username);
  if (!security?.totp_secret) {
    return false;
  }
  
  const speakeasyLib = getSpeakeasy();
  const verified = speakeasyLib.totp.verify({
    secret: security.totp_secret,
    encoding: 'base32',
    token: token,
    window: SECURITY_CONFIG.TOTP_WINDOW,
  });
  
  await logSecurityEvent({
    username,
    action: 'TOTP_VERIFICATION',
    details: `2FA verification ${verified ? 'successful' : 'failed'}`,
    success: verified,
  });
  
  return verified;
}

// Verify backup code
export async function verifyBackupCode(username: string, code: string): Promise<boolean> {
  const security = await getAdminSecurity(username);
  if (!security?.backup_codes) {
    return false;
  }
  
  const backupCodes = JSON.parse(security.backup_codes);
  const codeIndex = backupCodes.indexOf(code.toUpperCase());
  
  if (codeIndex === -1) {
    await logSecurityEvent({
      username,
      action: 'BACKUP_CODE_VERIFICATION',
      details: 'Backup code verification failed - invalid code',
      success: false,
    });
    return false;
  }
  
  // Remove used backup code
  backupCodes.splice(codeIndex, 1);
  await updateAdminSecurity({
    username,
    backup_codes: JSON.stringify(backupCodes),
  });
  
  await logSecurityEvent({
    username,
    action: 'BACKUP_CODE_VERIFICATION',
    details: 'Backup code verification successful - code consumed',
    success: true,
  });
  
  return true;
}

// Generate and store backup codes
export async function generateAndStoreBackupCodes(username: string): Promise<string[]> {
  const backupCodes = generateBackupCodes();
  
  await updateAdminSecurity({
    username,
    backup_codes: JSON.stringify(backupCodes),
  });
  
  await logSecurityEvent({
    username,
    action: 'BACKUP_CODES_GENERATED',
    details: `${backupCodes.length} backup codes generated`,
    success: true,
  });
  
  return backupCodes;
}

// Validate session token and IP
export async function validateSession(sessionToken: string, currentIp: string): Promise<{ valid: boolean; username?: string }> {
  const database = await getDatabase();
  
  const security = await database.get(
    'SELECT username, session_expires_at, last_ip FROM admin_security WHERE session_token = ?',
    [sessionToken]
  );
  
  if (!security) {
    return { valid: false };
  }
  
  // Check if session has expired
  const now = new Date();
  const expiresAt = new Date(security.session_expires_at);
  if (now > expiresAt) {
    // Clear expired session
    await updateAdminSecurity({
      username: security.username,
      session_token: undefined,
      session_expires_at: undefined,
    });
    
    await logSecurityEvent({
      username: security.username,
      action: 'SESSION_EXPIRED',
      details: 'Session token expired',
      success: false,
    });
    
    return { valid: false };
  }
  
  // Optionally validate IP address (can be disabled for mobile admin access)
  const validateIP = process.env.VALIDATE_ADMIN_IP !== 'false';
  if (validateIP && security.last_ip !== currentIp) {
    await logSecurityEvent({
      username: security.username,
      action: 'IP_MISMATCH',
      details: `IP changed from ${security.last_ip} to ${currentIp}`,
      ip_address: currentIp,
      success: false,
    });
    
    // For maximum security, invalidate session on IP change
    // You can comment this out if the admin needs mobile access
    return { valid: false };
  }
  
  return { valid: true, username: security.username };
}

// Invalidate all sessions for a user
export async function invalidateAllSessions(username: string): Promise<void> {
  await updateAdminSecurity({
    username,
    session_token: undefined,
    session_expires_at: undefined,
  });
  
  await logSecurityEvent({
    username,
    action: 'ALL_SESSIONS_INVALIDATED',
    details: 'All sessions invalidated',
    success: true,
  });
}

// Log security events
export async function logSecurityEvent(event: AuditLogEntry): Promise<void> {
  const database = await getDatabase();
  
  await database.run(`
    INSERT INTO admin_audit_log (
      username, action, details, ip_address, user_agent, success, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    event.username,
    event.action,
    event.details || '',
    event.ip_address || '',
    event.user_agent || '',
    event.success ? 1 : 0,
    new Date().toISOString(),
  ]);
}

// Get client IP address from request
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (real) {
    return real;
  }
  
  return 'unknown';
}

// Get user agent from request
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

// Rate limiting for API endpoints
const rateLimitStore = new Map<string, { count: number; lastReset: number }>();

// Verify admin authentication from request
export async function verifyAdminAuth(request: NextRequest): Promise<{ isValid: boolean; username?: string }> {
  try {
    // Get session token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.replace('Bearer ', '') || request.cookies.get('admin-session')?.value;
    
    if (!sessionToken) {
      return { isValid: false };
    }
    
    const currentIp = getClientIP(request);
    const sessionResult = await validateSession(sessionToken, currentIp);
    
    return {
      isValid: sessionResult.valid,
      username: sessionResult.username
    };
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return { isValid: false };
  }
}

export function checkRateLimit(ip: string, maxRequests: number = 10, windowMinutes: number = 15): boolean {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const key = `${ip}`;
  
  const current = rateLimitStore.get(key);
  
  if (!current) {
    rateLimitStore.set(key, { count: 1, lastReset: now });
    return true;
  }
  
  // Reset window if enough time has passed
  if (now - current.lastReset > windowMs) {
    rateLimitStore.set(key, { count: 1, lastReset: now });
    return true;
  }
  
  // Check if limit exceeded
  if (current.count >= maxRequests) {
    return false;
  }
  
  // Increment count
  current.count++;
  return true;
}