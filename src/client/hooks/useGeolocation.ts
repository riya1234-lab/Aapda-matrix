import { useState, useEffect, useCallback } from 'react';
import { LocationCoordinates } from '../types';

export interface GeolocationState extends LocationCoordinates {
  isAcquiring: boolean;
  hasGpsLock: boolean;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export function useGeolocation() {
  const [geoState, setGeoState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    protocol: 'EXTRACTING GPS...',
    isAcquiring: true,
    hasGpsLock: false,
    error: null,
    permissionStatus: 'unknown',
  });

  const acquireLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoState((prev) => ({
        ...prev,
        isAcquiring: false,
        hasGpsLock: false,
        protocol: 'UNAVAILABLE',
        error: 'Hardware GPS / Geolocation is not supported by your browser',
      }));
      return;
    }

    setGeoState((prev) => ({
      ...prev,
      isAcquiring: true,
      protocol: 'EXTRACTING GPS...',
    }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          protocol: 'GPS LOCK VERIFIED',
          isAcquiring: false,
          hasGpsLock: true,
          error: null,
          permissionStatus: 'granted',
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        console.warn('GPS extraction required:', err.message);
        setGeoState({
          latitude: null,
          longitude: null,
          accuracy: null,
          isAcquiring: false,
          hasGpsLock: false,
          protocol: 'NO GPS LOCK',
          error: err.code === 1 ? 'Location permission denied. Please allow GPS to enable SOS dispatch.' : err.message,
          permissionStatus: err.code === 1 ? 'denied' : 'unknown',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  }, []);

  useEffect(() => {
    acquireLocation();

    // Check permission state if available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          setGeoState((prev) => ({ ...prev, permissionStatus: status.state as any }));
          status.onchange = () => {
            setGeoState((prev) => ({ ...prev, permissionStatus: status.state as any }));
            if (status.state === 'granted') {
              acquireLocation();
            }
          };
        })
        .catch(() => {});
    }
  }, [acquireLocation]);

  return {
    ...geoState,
    refreshLocation: acquireLocation,
  };
}
