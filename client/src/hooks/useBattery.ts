import { useState, useEffect } from 'react';

export interface BatteryState {
  level: number; // 0 to 100
  charging: boolean;
  supported: boolean;
  isAutoGuard: boolean; // true if <= 5%
}

export function useBattery(): BatteryState {
  const [battery, setBattery] = useState<BatteryState>({
    level: 78, // Realistic fallback
    charging: false,
    supported: false,
    isAutoGuard: false,
  });

  useEffect(() => {
    let batteryObj: any = null;

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        batteryObj = b;
        const updateBattery = () => {
          const lvl = Math.round(b.level * 100);
          setBattery({
            level: lvl,
            charging: b.charging,
            supported: true,
            isAutoGuard: lvl <= 5,
          });
        };

        updateBattery();
        b.addEventListener('levelchange', updateBattery);
        b.addEventListener('chargingchange', updateBattery);
      }).catch(() => {
        setBattery((prev) => ({ ...prev, supported: false }));
      });
    }

    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', () => {});
        batteryObj.removeEventListener('chargingchange', () => {});
      }
    };
  }, []);

  return battery;
}
