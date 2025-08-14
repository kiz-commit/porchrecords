import React from 'react';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

interface PreviewModeProps {
  currentDevice: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  className?: string;
}

interface DeviceConfig {
  name: string;
  width: string;
  height: string;
  icon: React.ReactNode;
}

const deviceConfigs: Record<PreviewDevice, DeviceConfig> = {
  desktop: {
    name: 'Desktop',
    width: '100%',
    height: '100%',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  tablet: {
    name: 'Tablet',
    width: '768px',
    height: '1024px',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  },
  mobile: {
    name: 'Mobile',
    width: '375px',
    height: '667px',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  }
};

export default function PreviewMode({ currentDevice, onDeviceChange, className = '' }: PreviewModeProps) {
  return (
    <div className={`flex items-center space-x-1 bg-white border border-gray-200 rounded-lg p-1 ${className}`}>
      {Object.entries(deviceConfigs).map(([device, config]) => (
        <button
          key={device}
          onClick={() => onDeviceChange(device as PreviewDevice)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentDevice === device
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title={`Preview on ${config.name}`}
        >
          {config.icon}
          <span className="hidden sm:inline">{config.name}</span>
        </button>
      ))}
    </div>
  );
}

// Helper function to get device dimensions
export function getDeviceDimensions(device: PreviewDevice) {
  return deviceConfigs[device];
}

// Helper function to get responsive classes for different devices
export function getResponsiveClasses(device: PreviewDevice) {
  switch (device) {
    case 'mobile':
      return 'max-w-sm mx-auto';
    case 'tablet':
      return 'max-w-2xl mx-auto';
    case 'desktop':
    default:
      return 'w-full';
  }
} 