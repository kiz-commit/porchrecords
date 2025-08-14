import React from 'react';
import { PreviewDevice, getDeviceDimensions } from './PreviewMode';

interface DeviceFrameProps {
  device: PreviewDevice;
  children: React.ReactNode;
  className?: string;
}

export default function DeviceFrame({ device, children, className = '' }: DeviceFrameProps) {
  const deviceConfig = getDeviceDimensions(device);

  const getFrameStyles = () => {
    switch (device) {
      case 'mobile':
        return {
          width: deviceConfig.width,
          height: deviceConfig.height,
          maxWidth: '100%',
          maxHeight: '100%',
          margin: '0 auto',
          border: '8px solid #1f2937',
          borderRadius: '20px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          position: 'relative' as const,
          overflow: 'hidden'
        };
      case 'tablet':
        return {
          width: deviceConfig.width,
          height: deviceConfig.height,
          maxWidth: '100%',
          maxHeight: '100%',
          margin: '0 auto',
          border: '12px solid #1f2937',
          borderRadius: '16px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.15)',
          position: 'relative' as const,
          overflow: 'hidden'
        };
      case 'desktop':
      default:
        return {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '0',
          boxShadow: 'none',
          position: 'relative' as const,
          overflow: 'auto'
        };
    }
  };

  const getScreenStyles = () => {
    switch (device) {
      case 'mobile':
        return {
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          overflow: 'auto',
          borderRadius: '12px'
        };
      case 'tablet':
        return {
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          overflow: 'auto',
          borderRadius: '4px'
        };
      case 'desktop':
      default:
        return {
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          overflow: 'auto'
        };
    }
  };

  const getDeviceIndicator = () => {
    if (device === 'desktop') return null;

    return (
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded-full opacity-75">
          {deviceConfig.name}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`device-frame ${className}`}
      style={getFrameStyles()}
    >
      {getDeviceIndicator()}
      <div 
        className="device-screen"
        style={getScreenStyles()}
      >
        {children}
      </div>
    </div>
  );
} 