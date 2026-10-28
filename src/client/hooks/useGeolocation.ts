import { useState, useEffect, useCallback } from 'react';
import { LocationCoordinates } from '../types';

export interface GeolocationState extends LocationCoordinates {
  isAcquiring: boolean;
  hasGpsLock: boolean;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
  locationStatus: 'GPS_VERIFIED' | 'LOCATION_UNAVAILABLE' | 'USER_PROVIDED';
  locationSource: 'GPS' | 'NETWORK' | 'USER_MANUAL' | 'UNAVAILABLE';
  isEmergencyOverrideAllowed: boolean;
  userProvidedAddress: string;
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
    locationStatus: 'LOCATION_UNAVAILABLE',
    locationSource: 'UNAVAILABLE',
    isEmergencyOverrideAllowed: false,
    userProvidedAddress: '',
  });

  const acquireLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoState((prev) => ({
        ...prev,
        isAcquiring: false,
        hasGpsLock: false,
        protocol: 'UNAVAILABLE',
        locationStatus: 'LOCATION_UNAVAILABLE',
        locationSource: 'UNAVAILABLE',
        error: 'Hardware GPS / Geolocation is not supported by your browser.',
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
        // Validate latitude between -90 and 90, longitude between -180 and 180
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          setGeoState((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            accuracy: Math.round(pos.coords.accuracy),
            protocol: 'GPS LOCK VERIFIED',
            locationStatus: 'GPS_VERIFIED',
            locationSource: 'GPS',
            isAcquiring: false,
            hasGpsLock: true,
            error: null,
            permissionStatus: 'granted',
            timestamp: pos.timestamp,
          }));
        } else {
          setGeoState((prev) => ({
            ...prev,
            latitude: null,
            longitude: null,
            accuracy: null,
            isAcquiring: false,
            hasGpsLock: false,
            protocol: 'INVALID GPS COORDS',
            locationStatus: 'LOCATION_UNAVAILABLE',
            locationSource: 'UNAVAILABLE',
            error: 'Extracted GPS coordinates are outside valid spherical bounds.',
          }));
        }
      },
      (err) => {
        console.warn('GPS extraction required:', err.message);
        setGeoState((prev) => ({
          ...prev,
          latitude: null,
          longitude: null,
          accuracy: null,
          isAcquiring: false,
          hasGpsLock: false,
          protocol: 'NO GPS LOCK',
          locationStatus: prev.userProvidedAddress ? 'USER_PROVIDED' : 'LOCATION_UNAVAILABLE',
          locationSource: prev.userProvidedAddress ? 'USER_MANUAL' : 'UNAVAILABLE',
          error:
            err.code === 1
              ? 'Location permission denied. Please allow location access, or use Emergency Override to send SOS without GPS.'
              : err.code === 3
              ? 'GPS acquisition timed out. Use Emergency Override or enter address manually.'
              : err.message,
          permissionStatus: err.code === 1 ? 'denied' : 'unknown',
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }, []);

  const enableEmergencyOverride = useCallback(() => {
    setGeoState((prev) => ({
      ...prev,
      isEmergencyOverrideAllowed: true,
    }));
  }, []);

  const setManualAddress = useCallback((addr: string) => {
    setGeoState((prev) => ({
      ...prev,
      userProvidedAddress: addr,
      locationStatus: addr.trim() ? 'USER_PROVIDED' : 'LOCATION_UNAVAILABLE',
      locationSource: addr.trim() ? 'USER_MANUAL' : 'UNAVAILABLE',
      isEmergencyOverrideAllowed: true,
    }));
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
    enableEmergencyOverride,
    setManualAddress,
  };
}
