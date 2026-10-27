import React, { useEffect, useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { EmergencyCallButton } from '../components/EmergencyCallButton';
import { api } from '../services/api';
import { cacheEmergencyContacts, getCachedEmergencyContacts } from '../services/offlineDb';
import { EmergencyContact } from '../types';
import { Phone, Shield, Heart, Flame, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try online fetch first, fallback to cached
    api.getContacts().then(async (data) => {
      if (data?.contacts && data.contacts.length > 0) {
        setContacts(data.contacts);
        await cacheEmergencyContacts(data.contacts);
      }
      setIsLoading(false);
    }).catch(async () => {
      const cached = await getCachedEmergencyContacts();
      if (cached.length > 0) {
        setContacts(cached);
      }
      setIsLoading(false);
    });
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AMBULANCE':
        return <Heart className="w-5 h-5 text-critical-red" />;
      case 'FIRE':
        return <Flame className="w-5 h-5 text-emergency-orange" />;
      case 'POLICE':
        return <Shield className="w-5 h-5 text-brand-blue" />;
      case 'WOMEN':
        return <Shield className="w-5 h-5 text-purple-600" />;
      default:
        return <AlertOctagon className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-24 font-sans selection:bg-critical-red selection:text-white">
      <div>
        <AppHeader />

        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Emergency Services Directory
            </h2>
            <p className="text-xs text-slate-500">
              Verified national and state emergency response helplines (available offline)
            </p>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-xs font-mono text-slate-500">
                Loading verified directory...
              </div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0">
                      {getCategoryIcon(contact.category)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                          {contact.serviceName}
                        </h4>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        Region: {contact.region} | Verified Helpline
                      </span>
                    </div>
                  </div>

                  <EmergencyCallButton
                    telephoneNumber={contact.telephoneNumber}
                    serviceName={contact.serviceName}
                    variant={contact.telephoneNumber === '112' ? 'primary' : 'warning'}
                    label={`Call Direct: ${contact.telephoneNumber}`}
                  />
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
};
