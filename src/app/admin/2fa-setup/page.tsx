'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '@/components/AdminLayout';

interface TOTPStatus {
  enabled: boolean;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
}

export default function Admin2FASetup() {
  const [totpStatus, setTotpStatus] = useState<TOTPStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchTOTPStatus();
  }, []);

  const fetchTOTPStatus = async () => {
    try {
      const response = await fetch('/api/admin/auth/2fa-status');
      if (response.ok) {
        const data = await response.json();
        setTotpStatus(data);
      } else {
        setError('Failed to fetch 2FA status');
      }
    } catch (err) {
      setError('Failed to fetch 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const generateNewSecret = async () => {
    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/auth/generate-totp', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setTotpStatus(data);
        setSuccess('New TOTP secret generated successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate TOTP secret');
      }
    } catch (err) {
      setError('Failed to generate TOTP secret');
    } finally {
      setGenerating(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your admin account less secure.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/auth/disable-2fa', {
        method: 'POST',
      });

      if (response.ok) {
        setTotpStatus({ enabled: false });
        setSuccess('2FA has been disabled successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to disable 2FA');
      }
    } catch (err) {
      setError('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const test2FA = async () => {
    const code = prompt('Enter a 6-digit code from your authenticator app to test:');
    if (!code) return;

    try {
      const response = await fetch('/api/admin/auth/test-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        setSuccess('2FA test successful! Your authenticator app is working correctly.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || '2FA test failed');
      }
    } catch (err) {
      setError('Failed to test 2FA');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg">Loading 2FA status...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Two-Factor Authentication Setup</h1>
          <p className="mt-2 text-gray-600">
            Manage 2FA settings for enhanced security
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="text-green-800">{success}</div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Current Status</h2>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${totpStatus?.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-700">
                {totpStatus?.enabled ? '2FA is enabled' : '2FA is disabled'}
              </span>
            </div>
          </div>

          {totpStatus?.enabled && totpStatus.secret && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-lg font-medium text-blue-900 mb-3">Setup Instructions</h3>
              
              <div className="mb-4">
                <h4 className="font-medium text-blue-800 mb-2">1. Install an Authenticator App</h4>
                <p className="text-blue-700 text-sm mb-2">
                  Download one of these apps on your phone:
                </p>
                <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
                  <li>Google Authenticator</li>
                  <li>Authy</li>
                  <li>Microsoft Authenticator</li>
                  <li>1Password</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-blue-800 mb-2">2. Add the Secret</h4>
                <p className="text-blue-700 text-sm mb-2">
                  In your authenticator app, add a new account using one of these methods:
                </p>
                
                <div className="mb-3">
                  <p className="text-blue-700 text-sm font-medium mb-1">Option A: Scan QR Code</p>
                  {totpStatus.qrCodeUrl && (
                    <div className="bg-white p-2 inline-block rounded border">
                      <Image 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpStatus.qrCodeUrl)}`}
                        alt="QR Code for TOTP"
                        className="w-32 h-32"
                        width={128}
                        height={128}
                      />
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <p className="text-blue-700 text-sm font-medium mb-1">Option B: Manual Entry</p>
                  <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                    {totpStatus.secret}
                  </div>
                  <p className="text-blue-700 text-xs mt-1">
                    Enter this secret manually in your authenticator app
                  </p>
                </div>

                {totpStatus.backupCodes && (
                  <div className="mb-3">
                    <p className="text-red-700 text-sm font-medium mb-1">⚠️ Important: Backup Codes</p>
                    <div className="bg-red-50 p-3 rounded border border-red-200">
                      <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                        {totpStatus.backupCodes.map((code, index) => (
                          <div key={index} className="bg-white p-2 rounded border text-center">
                            {code}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-red-700 text-xs">
                        <p className="font-medium">🔒 Save these codes in a secure location!</p>
                        <ul className="list-disc list-inside mt-1">
                          <li>Each code can only be used once</li>
                          <li>Use them if you lose access to your authenticator app</li>
                          <li>Keep them separate from your other passwords</li>
                        </ul>
                      </div>
                      <button
                        onClick={() => {
                          const codesText = totpStatus.backupCodes?.join('\n') || '';
                          navigator.clipboard.writeText(codesText);
                          setSuccess('Backup codes copied to clipboard!');
                        }}
                        className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                      >
                        Copy Codes
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-blue-800 mb-2">3. Test Your Setup</h4>
                <p className="text-blue-700 text-sm mb-3">
                  Click the button below to test if your authenticator app is working correctly:
                </p>
                <button
                  onClick={test2FA}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Test 2FA
                </button>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            {!totpStatus?.enabled ? (
              <button
                onClick={generateNewSecret}
                disabled={generating}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Enable 2FA'}
              </button>
            ) : (
              <>
                <button
                  onClick={generateNewSecret}
                  disabled={generating}
                  className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate New Secret'}
                </button>
                <button
                  onClick={disable2FA}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Disable 2FA
                </button>
              </>
            )}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-lg font-medium text-yellow-900 mb-2">Important Notes</h3>
            <ul className="text-yellow-800 text-sm space-y-1">
              <li>• Keep your TOTP secret secure and don&apos;t share it with anyone</li>
              <li>• If you lose access to your authenticator app, you may be locked out of the admin panel</li>
              <li>• Consider backing up your authenticator app or using a cloud-based solution like Authy</li>
              <li>• The secret is stored in your environment variables and should be kept secure</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 