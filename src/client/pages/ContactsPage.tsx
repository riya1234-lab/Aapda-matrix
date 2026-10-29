import React, { useEffect, useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { EmergencyCallButton } from '../components/EmergencyCallButton';
import { api } from '../services/api';
import {
  cacheEmergencyContacts,
  getCachedEmergencyContacts,
  getPersonalContacts,
  savePersonalContact,
  deletePersonalContact,
} from '../services/offlineDb';
import { EmergencyContact, PersonalEmergencyContact } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useBattery } from '../hooks/useBattery';
import { useGeolocation } from '../hooks/useGeolocation';
import {
  Phone,
  Shield,
  Heart,
  Flame,
  AlertOctagon,
  CheckCircle2,
  Users,
  PlusCircle,
  Trash2,
  MessageSquare,
  BatteryWarning,
  Send,
  X,
} from 'lucide-react';

export const ContactsPage: React.FC = () => {
  const { t } = useLanguage();
  const { level, isBelowTenPercent } = useBattery();
  const { latitude, longitude } = useGeolocation();

  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'PERSONAL'>('DIRECTORY');
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [personalContacts, setPersonalContacts] = useState<PersonalEmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New personal contact modal state
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [newNotifyBattery, setNewNotifyBattery] = useState(true);

  // Load verified directory and personal contacts
  useEffect(() => {
    // 1. Fetch official directory
    api.getContacts()
      .then(async (data) => {
        if (data?.contacts && data.contacts.length > 0) {
          setContacts(data.contacts);
          await cacheEmergencyContacts(data.contacts);
        }
        setIsLoading(false);
      })
      .catch(async () => {
        const cached = await getCachedEmergencyContacts();
        if (cached.length > 0) {
          setContacts(cached);
        }
        setIsLoading(false);
      });

    // 2. Fetch personal contacts from IndexedDB
    getPersonalContacts().then((list) => {
      setPersonalContacts(list);
    });
  }, []);

  const handleAddPersonalContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const newContact: PersonalEmergencyContact = {
      id: `personal_${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      relationship: newRelation.trim() || 'Emergency Contact',
      notifyOnLowBattery: newNotifyBattery,
      createdAt: new Date().toISOString(),
    };

    await savePersonalContact(newContact);
    const updated = await getPersonalContacts();
    setPersonalContacts(updated);

    // Reset form
    setNewName('');
    setNewPhone('');
    setNewRelation('');
    setIsAddingContact(false);
  };

  const handleDeletePersonalContact = async (id: string) => {
    await deletePersonalContact(id);
    const updated = await getPersonalContacts();
    setPersonalContacts(updated);
  };

  // Generate low battery SMS link for predefined contacts
  const getLowBatterySmsLink = () => {
    const batteryContacts = personalContacts.filter((c) => c.notifyOnLowBattery);
    const phoneList = batteryContacts.map((c) => c.phone.replace(/[^0-9+]/g, '')).join(';');
    const coordsText =
      latitude && longitude
        ? `https://maps.google.com/?q=${latitude},${longitude}`
        : 'GPS extracting';
    const message = encodeURIComponent(
      `[EMERGENCY BATTERY ALERT] My phone battery is critically low (${level}%). Last known location: ${coordsText}. Sent via AAPDA MATRIX.`
    );
    return `sms:${phoneList}?body=${message}`;
  };

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
      case 'ROAD_ACCIDENT':
        return <AlertOctagon className="w-5 h-5 text-amber-600" />;
      case 'CYCLONE':
        return <Shield className="w-5 h-5 text-teal-600" />;
      default:
        return <AlertOctagon className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-24 font-sans selection:bg-critical-red selection:text-white">
      <div>
        <AppHeader />

        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          {/* Critical Low Battery Alert Banner (Requirement 4) */}
          {isBelowTenPercent && (
            <div className="bg-red-50 border-2 border-critical-red rounded-2xl p-4 shadow-md space-y-2.5 animate-pulse">
              <div className="flex items-center gap-2 text-critical-red font-black text-xs uppercase tracking-wider">
                <BatteryWarning className="w-5 h-5" />
                <span>{t.batteryCriticalAlert}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {t.batteryAutoShareDesc}
              </p>
              <a
                href={getLowBatterySmsLink()}
                className="w-full py-2.5 px-3 bg-critical-red hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{t.shareLocationNow}</span>
              </a>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('DIRECTORY')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'DIRECTORY'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-critical-red" />
              <span>{t.emergencyDirectory}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PERSONAL')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'PERSONAL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-brand-blue" />
              <span>{t.myCircle} ({personalContacts.length})</span>
            </button>
          </div>

          {/* TAB 1: OFFICIAL DIRECTORY */}
          {activeTab === 'DIRECTORY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Verified Emergency Response Numbers
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Clicking immediately opens your phone dialer pad
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-xs font-mono text-slate-500">
                  Loading verified directory...
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
                  <p className="text-sm font-black text-slate-700">Directory Unavailable</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Emergency contacts could not be loaded from the server. This may mean the backend is offline or the database has not been seeded yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoading(true);
                      api.getContacts()
                        .then(async (data) => {
                          if (data?.contacts && data.contacts.length > 0) {
                            setContacts(data.contacts);
                            await cacheEmergencyContacts(data.contacts);
                          }
                          setIsLoading(false);
                        })
                        .catch(async () => {
                          const cached = await getCachedEmergencyContacts();
                          if (cached.length > 0) setContacts(cached);
                          setIsLoading(false);
                        });
                    }}
                    className="mt-1 text-xs font-bold text-brand-blue underline"
                  >
                    Retry
                  </button>
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

                    {/* Direct phone dialer trigger with 0 delay */}
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
          )}

          {/* TAB 2: PREDEFINED PERSONAL CONTACTS */}
          {activeTab === 'PERSONAL' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Predefined Emergency Circle
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Contacts alerted when low battery (&lt; 10%) or SOS is active
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingContact(true)}
                  className="py-1.5 px-3 bg-brand-blue hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Add Contact Modal / Form */}
              {isAddingContact && (
                <form
                  onSubmit={handleAddPersonalContact}
                  className="bg-white border-2 border-brand-blue/60 rounded-2xl p-4 shadow-md space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                      {t.addPredefinedContact}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingContact(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={t.contactName}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />

                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="Phone Number (e.g. +91 9899112233)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />

                    <input
                      type="text"
                      value={newRelation}
                      onChange={(e) => setNewRelation(e.target.value)}
                      placeholder={t.relation}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />

                    <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newNotifyBattery}
                        onChange={(e) => setNewNotifyBattery(e.target.checked)}
                        className="rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                      />
                      <span className="text-[11px] text-slate-700 font-semibold">
                        {t.notifyOnLowBattery}
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingContact(false)}
                      className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 bg-brand-blue hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm"
                    >
                      {t.saveContact}
                    </button>
                  </div>
                </form>
              )}

              {/* Personal Contact Cards */}
              {personalContacts.length === 0 ? (
                <div className="text-center py-8 text-xs font-mono text-slate-500 bg-white border border-slate-200 rounded-2xl p-6">
                  No predefined contacts added yet. Tap <strong>+ Add</strong> above to add family, doctors, or neighbors.
                </div>
              ) : (
                personalContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                          {contact.name}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                          {contact.phone} • {contact.relationship}
                        </span>
                        {contact.notifyOnLowBattery && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            ✓ Battery &lt; 10% Auto-Alert Active
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePersonalContact(contact.id)}
                        className="text-slate-400 hover:text-critical-red p-1 rounded-lg transition-colors"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {/* Direct phone call button */}
                      <a
                        href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                        className="py-2.5 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Call</span>
                      </a>

                      {/* Direct SMS button */}
                      <a
                        href={`sms:${contact.phone.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(
                          `[EMERGENCY SOS] I need urgent assistance. My current coordinates: ${
                            latitude && longitude ? `https://maps.google.com/?q=${latitude},${longitude}` : 'GPS pending'
                          }`
                        )}`}
                        className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-brand-blue border border-blue-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send SMS</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      <AppFooter />
    </div>
  );
};
