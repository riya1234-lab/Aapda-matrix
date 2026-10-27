import { useState, useEffect, useCallback } from 'react';
import { LocationCoordinates } from '../types';

export interface GeolocationState extends LocationCoordinates {
  isAcquiring: boolean;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export function useGeolocation() {
  const [geoState, setGeoState] = useState<GeolocationState>({
    latitude: 28.6139, // Default center (New Delhi coordinates as sensible fallback)
    longitude: 77.2090,
    accuracy: 15,
    protocol: 'ACQUIRING GPS...',
    isAcquiring: true,
    error: null,
    permissionStatus: 'unknown',
  });

  const acquireLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoState((prev) => ({
        ...prev,
        isAcquiring: false,
        protocol: 'UNAVAILABLE',
        error: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    setGeoState((prev) => ({ ...prev, isAcquiring: true, protocol: 'ACQUIRING GPS...' }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          protocol: 'GPS ACTIVE',
          isAcquiring: false,
          error: null,
          permissionStatus: 'granted',
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        console.warn('Geolocation acquisition warning (SOS can still proceed):', err.message);
        setGeoState((prev) => ({
          ...prev,
          isAcquiring: false,
          protocol: 'NETWORK (IP)',
          error: err.message,
          permissionStatus: err.code === 1 ? 'denied' : 'unknown',
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      }
    );
  }, []);

  useEffect(() => {
    acquireLocation();

    // Check permission state if available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
        setGeoState((prev) => ({ ...prev, permissionStatus: status.state as any }));
        status.onchange = () => {
          setGeoState((prev) => ({ ...prev, permissionStatus: status.state as any }));
          if (status.state === 'granted') {
            acquireLocation();
          }
        };
      }).catch(() => {});
    }
  }, [acquireLocation]);

  return {
    ...geoState,
    refreshLocation: acquireLocation,
  };
}
