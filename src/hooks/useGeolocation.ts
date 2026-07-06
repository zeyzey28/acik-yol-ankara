import { useState, useEffect, useCallback, useRef } from 'react';
import { GeolocationState, Coordinates } from '@/utils/types';

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    loading: true,
    error: null,
    permissionStatus: null,
  });

  const hasRequestedOnce = useRef(false);

  const requestLocation = useCallback((forcePrompt = false) => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Geolokasyon bu tarayıcı tarafından desteklenmiyor.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = [position.coords.longitude, position.coords.latitude];
        setState({
          coordinates: coords,
          loading: false,
          error: null,
          permissionStatus: 'granted',
        });
      },
      (error) => {
        let errorMessage = 'Konum alınamadı. Başlangıç noktasını adres arayarak veya haritadan seçerek belirleyebilirsin.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Konum izni reddedildi. Başlangıç noktasını adres arayarak veya haritadan seçerek belirleyebilirsin.';
        }
        
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          permissionStatus: error.code === error.PERMISSION_DENIED ? 'denied' : prev.permissionStatus,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAndRequest = async () => {
      // Avoid requesting multiple times on mount
      if (hasRequestedOnce.current) return;
      hasRequestedOnce.current = true;

      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setState((prev) => ({ ...prev, permissionStatus: result.state }));

          // If denied, don't auto-request on load
          if (result.state === 'denied') {
            setState((prev) => ({
              ...prev,
              loading: false,
              error: 'Konum alınamadı. Başlangıç noktasını adres arayarak veya haritadan seçerek belirleyebilirsin.',
            }));
            return;
          }

          // If granted or prompt (not requested yet), request once
          requestLocation();
        } catch (e) {
          // Fallback if query fails
          requestLocation();
        }
      } else {
        requestLocation();
      }
    };

    checkAndRequest();
  }, [requestLocation]);

  const forceRequest = useCallback(() => {
    requestLocation(true);
  }, [requestLocation]);

  return { ...state, retry: forceRequest };
}
