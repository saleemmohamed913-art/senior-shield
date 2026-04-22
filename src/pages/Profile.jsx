import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Edit3, Phone, HeartPulse, Plus, AlertCircle, CheckCircle, Share2, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, removeEmergencyContact, addEmergencyContact, createTrackingSession } from '../services/firestoreService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { MEDICAL_CONDITIONS } from '../utils/constants';
import { BottomNav } from '../shared/components';

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser, userProfile, setUserProfile } = useAuth();

  const DEMO = {
    name: 'Madhesh',
    age: '22',
    medicalCondition: 'Fever',
    phone: '+91 9361341593',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: DEMO.name,
    age: DEMO.age,
    medicalCondition: DEMO.medicalCondition,
    phone: DEMO.phone,
  });

  const hasLoadedProfile = React.useRef(false);

  useEffect(() => {
    if (userProfile && !hasLoadedProfile.current) {
      hasLoadedProfile.current = true;
      setFormData({
        name: userProfile.name || DEMO.name,
        age: userProfile.age ? String(userProfile.age) : DEMO.age,
        medicalCondition: userProfile.medicalCondition || DEMO.medicalCondition,
        phone: userProfile.phone || DEMO.phone,
      });
    }
  }, [userProfile]);

  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relation: '',
    isPrimary: false,
  });

  const [showTrackingLink, setShowTrackingLink] = useState(false);
  const [trackingLink, setTrackingLink] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewContact(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.age) {
      setError(t('profile.name') + ' ' + t('dashboard.age') + ' required');
      return;
    }
    setError(null);
    setLoading(true);

    const updated = { ...formData, age: parseInt(formData.age) };
    setUserProfile(prev => ({ ...prev, ...updated }));
    hasLoadedProfile.current = true;

    try {
      const result = await updateUserProfile(currentUser.uid, updated);
      if (!result.success) {
        const { setDoc: fsSet, doc: fsDoc } = await import('firebase/firestore');
        const { db: fsDb } = await import('../services/firebase');
        await fsSet(fsDoc(fsDb, 'users', currentUser.uid), { ...updated, updatedAt: new Date() }, { merge: true });
      }
      setSuccessMessage(t('profile.profileSaved'));
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const normalizePhone = (phone) => {
    const cleaned = phone.trim();
    if (!cleaned) return '';
    if (cleaned.startsWith('+')) return cleaned;
    return `+91${cleaned.replace(/^0+/, '')}`;
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedName = newContact.name.trim();
    const trimmedPhone = normalizePhone(newContact.phone);
    const trimmedRelation = newContact.relation.trim();

    if (!trimmedName || !trimmedPhone || !trimmedRelation) {
      setError(t('errors.unknownError'));
      return;
    }

    const newEntry = {
      id: `contact_${Date.now()}`,
      name: trimmedName,
      phone: trimmedPhone,
      relation: trimmedRelation,
      isPrimary: newContact.isPrimary,
      addedAt: new Date().toISOString(),
    };

    const existing = userProfile?.emergencyContacts || [];
    
    // Add the new entry
    let updatedContacts = [...existing, newEntry];
    
    // Enforce strict single-primary rule
    if (newContact.isPrimary) {
      // If new is primary, disable all others
      updatedContacts = updatedContacts.map(c => ({ ...c, isPrimary: c.id === newEntry.id }));
    } else if (!updatedContacts.some(c => c.isPrimary) && updatedContacts.length > 0) {
      // If NO primary exists at all (e.g., first contact), force the first one
      updatedContacts[0].isPrimary = true;
    }

    setUserProfile(prev => ({ ...prev, emergencyContacts: updatedContacts }));
    setNewContact({ name: '', phone: '', relation: '', isPrimary: false });
    setShowAddContact(false);
    setLoading(true);

    try {
      const { setDoc: fsSet, doc: fsDoc } = await import('firebase/firestore');
      const { db: fsDb } = await import('../services/firebase');
      await fsSet(fsDoc(fsDb, 'users', currentUser.uid), { emergencyContacts: updatedContacts, updatedAt: new Date() }, { merge: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm(t('messages.confirmDelete'))) return;
    setError(null);

    const updatedContacts = (userProfile?.emergencyContacts || []).filter(c => (c.id) !== String(contactId));
    setUserProfile(prev => ({ ...prev, emergencyContacts: updatedContacts }));
    setLoading(true);

    try {
      const { setDoc: fsSet, doc: fsDoc } = await import('firebase/firestore');
      const { db: fsDb } = await import('../services/firebase');
      await fsSet(fsDoc(fsDb, 'users', currentUser.uid), { emergencyContacts: updatedContacts, updatedAt: new Date() }, { merge: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTrackingLink = async () => {
    setError(null);
    setTrackingLoading(true);

    try {
      const session = await createTrackingSession(currentUser.uid);
      if (session && session.token) {
        const baseUrl = window.location.origin;
        setTrackingLink(`${baseUrl}/track/${currentUser.uid}?token=${session.token}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleNavigation = (item) => {
    const routes = {
      'home': '/dashboard',
      'contacts': '/profile',
      'navigate': '/navigate',
      'settings': '/settings',
    };
    navigate(routes[item] || '/dashboard');
  };

  const getInitials = () => {
    return (formData.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const sectionHeaderClass = "text-[13px] font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5";

  return (
    <div className="min-h-screen bg-transparent flex flex-col pb-24 p-5">
      
      {/* 1. PROFILE HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-[52px] h-[52px] rounded-full text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-sm"
            style={{ background: '#2563eb' }}
          >
            {getInitials()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">{formData.name}</h1>
            <p className="text-[15px] font-medium text-gray-500">{formData.phone}</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-[#f8fafc] text-[#475569] border border-[#e2e8f0] rounded-[10px] text-[13px] font-medium hover:bg-[#f1f5f9] transition-colors active:scale-95 flex items-center gap-1.5"
        >
          <Edit3 size={14} /> {isEditing ? t('profile.cancelEdit') : t('profile.editProfile')}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-[12px] text-sm font-semibold">{error}</div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-[12px] text-sm font-semibold">{successMessage}</div>
      )}

      {/* Profile Form Content */}
      <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto pb-6">
        
        {/* 2. PERSONAL INFO */}
        <div className="card mb-5">
          <h2 className={sectionHeaderClass}>
            <User size={15} /> {t('profile.personalInfo')}
          </h2>
          
          {!isEditing ? (
            <div className="space-y-0.5">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 hover:bg-[#fafafa] px-1 rounded-sm transition-colors">
                <span className="text-gray-500 text-sm font-medium">{t('profile.name')}</span>
                <span className="font-bold text-gray-900 text-[15px]">{formData.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 hover:bg-[#fafafa] px-1 rounded-sm transition-colors">
                <span className="text-gray-500 text-sm font-medium">{t('profile.age')}</span>
                <span className="font-bold text-gray-900 text-[15px]">{formData.age}</span>
              </div>
              <div className="flex justify-between items-center py-2 hover:bg-[#fafafa] px-1 rounded-sm transition-colors">
                <span className="text-gray-500 text-sm font-medium">{t('profile.phone')}</span>
                <span className="font-bold text-gray-900 text-[15px]">{formData.phone}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:border-blue-500 focus:bg-white outline-none" type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder={t('profile.name')} />
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:border-blue-500 focus:bg-white outline-none" type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder={t('profile.age')} />
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:border-blue-500 focus:bg-white outline-none" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder={t('profile.phone')} />
            </div>
          )}
        </div>

        {/* 3. MEDICAL INFO */}
        <div className="card mb-5" style={{ background: '#ffffff', border: '1px solid #fde68a' }}>
          <h2 className={`text-[13px] font-bold text-orange-800 uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5`}>
            <HeartPulse size={15} /> {t('profile.medicalInfo')}
          </h2>
          
          {!isEditing ? (
            <div className="flex justify-between items-center px-1">
              <span className="text-orange-900 text-sm font-medium opacity-80">{t('profile.condition')}</span>
              <span className="font-bold text-orange-900 text-[15px]">{formData.medicalCondition || t('profile.none')}</span>
            </div>
          ) : (
            <input className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm bg-orange-50 focus:border-orange-400 focus:bg-white outline-none text-orange-900" type="text" name="medicalCondition" value={formData.medicalCondition} onChange={handleInputChange} placeholder={t('profile.medicalCondition')} />
          )}
        </div>

        {isEditing && (
          <div className="mb-5 flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#2563eb] text-white rounded-[12px] font-medium active:scale-95" style={{ boxShadow: 'none' }}>
              {t('profile.saveChanges')}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 bg-[#f1f5f9] text-[#1f2937] rounded-[12px] font-medium active:scale-95">
              {t('common.cancel')}
            </button>
          </div>
        )}
      </form>

      {/* 4. EMERGENCY CONTACTS */}
      {!isEditing && (
        <div className="card mb-5 mt-1">
          <div className="flex justify-between items-center mb-3">
             <h2 className={sectionHeaderClass.replace('mb-3', 'mb-0')}>
               <Phone size={15} /> {t('profile.contacts')}
             </h2>
             <button 
               onClick={() => setShowAddContact(!showAddContact)} 
               className="text-[#2563eb] font-medium text-[13px] flex items-center gap-1 bg-[#eff6ff] px-3 py-1.5 rounded-[8px] hover:bg-[#dbeafe] active:scale-95 transition-all"
             >
               + {t('profile.addContact')}
             </button>
          </div>

          {/* Add Contact Form Inline */}
          {showAddContact && (
            <div className="bg-gray-50 border border-gray-100 rounded-[12px] p-3 mb-4 space-y-3">
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" type="text" name="name" value={newContact.name} onChange={handleContactChange} placeholder={t('profile.contactName')} />
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" type="tel" name="phone" value={newContact.phone} onChange={handleContactChange} placeholder="+91 Phone" />
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" type="text" name="relation" value={newContact.relation} onChange={handleContactChange} placeholder={t('profile.relation')} />
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer pl-1">
                <input type="checkbox" name="isPrimary" checked={newContact.isPrimary} onChange={handleContactChange} className="w-4 h-4 accent-blue-600" />
                {t('profile.primaryContact')}
              </label>
              <div className="flex gap-2 pt-1">
                <button onClick={handleAddContact} disabled={loading} className="flex-1 bg-[#2563eb] text-white py-2.5 rounded-[10px] text-sm font-medium active:scale-95">{t('profile.saveContact')}</button>
                <button onClick={() => setShowAddContact(false)} className="px-4 py-2.5 bg-[#f1f5f9] text-[#1f2937] rounded-[10px] text-sm font-medium active:scale-95">{t('common.cancel')}</button>
              </div>
            </div>
          )}

          {/* Contact List */}
          {userProfile?.emergencyContacts?.length > 0 ? (() => {
            const sortedContacts = [...userProfile.emergencyContacts].sort((a, b) => (b.isPrimary === true ? 1 : 0) - (a.isPrimary === true ? 1 : 0));
            return (
              <div className="space-y-4">
                {sortedContacts.map((contact, idx) => (
                  <div key={contact.id || idx} className="border-b border-gray-100 last:border-0 pb-4 mb-2 last:mb-0 last:pb-0">
                     <div className="flex justify-between items-start mb-3 px-1">
                         <div>
                            <h4 className="font-bold text-gray-900 text-[15px]">
                              {contact.name} 
                              {contact.isPrimary && <span className="ml-2 text-[11px] uppercase tracking-wide bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-[4px] font-bold">⭐ {t('profile.primary')}</span>}
                            </h4>
                            <p className="text-gray-500 text-sm font-medium mt-0.5">{contact.relation}</p>
                            <p className="text-gray-900 font-mono text-[13px] font-bold mt-1 opacity-80">{contact.phone}</p>
                         </div>
                     </div>
                     <div className="flex gap-3">
                        <a 
                          href={`tel:${contact.phone}`} 
                          className="flex-1 flex items-center justify-center py-2.5 rounded-[10px] font-medium text-sm active:scale-[0.96] transition-transform"
                          style={{ background: '#e6f4ea', color: '#166534' }}
                        >
                          {t('profile.call')}
                        </a>
                        <button 
                          onClick={() => handleDeleteContact(contact.id || idx)}
                          disabled={loading}
                          className="w-24 flex items-center justify-center py-2.5 rounded-[10px] font-medium text-sm active:scale-[0.96] transition-transform"
                          style={{ background: '#fee2e2', color: '#991b1b' }}
                        >
                          {t('profile.delete')}
                        </button>
                     </div>
                  </div>
                ))}
              </div>
            );
          })() : (
            <div className="text-center py-4 bg-gray-50 rounded-[12px] border border-dashed border-gray-200">
              <p className="text-sm font-medium text-gray-500">{t('profile.noContacts')}</p>
            </div>
          )}
        </div>
      )}

      {/* 5. GUARDIAN TRACKING */}
      {!isEditing && (
        <div className="mb-6 rounded-[12px] p-4" style={{ background: '#f8fafc', border: '1px solid #e5e7eb'}}>
          <h2 className={sectionHeaderClass}>
            <Share2 size={15} /> {t('profile.liveTracking')}
          </h2>
          <p className="text-sm font-medium text-gray-600 mb-4 px-1 leading-snug">
            {t('profile.liveTrackingDesc')}
          </p>
          
          {trackingLink ? (
             <div className="space-y-3">
               <div className="flex items-center gap-2 bg-white p-2 rounded-[10px] border border-gray-200">
                 <input type="text" readOnly value={trackingLink} className="flex-1 text-[13px] text-gray-600 outline-none bg-transparent font-mono truncate" />
                 <button onClick={() => { navigator.clipboard.writeText(trackingLink); setSuccessMessage(t('messages.actionSuccessful')); }} className="p-2 text-[#2563eb] hover:bg-gray-100 rounded-[8px] active:scale-95">
                   <Copy size={16} />
                 </button>
               </div>
               <div className="flex gap-2">
                  <button 
                    onClick={() => navigator.share({ url: trackingLink }).catch(() => navigator.clipboard.writeText(trackingLink))}
                    className="flex-1 font-medium text-[15px] text-white py-3 rounded-[12px] active:scale-[0.96]" style={{ background: '#2563eb' }}
                  >
                    {t('profile.shareLink')}
                  </button>
                  <button onClick={() => setTrackingLink(null)} className="px-4 py-3 bg-[#e5e7eb] text-gray-800 font-medium rounded-[12px] text-[15px] active:scale-95">
                    {t('common.close')}
                  </button>
               </div>
             </div>
          ) : (
            <button 
              onClick={handleGenerateTrackingLink}
              disabled={trackingLoading}
              className="w-full py-3 rounded-[12px] font-medium text-white mb-3 active:scale-[0.96] flex justify-center items-center gap-2"
              style={{ background: '#2563eb' }}
            >
              {trackingLoading ? t('profile.generating') : t('profile.generateLink')}
            </button>
          )}

          <div className="text-[#6b7280] text-[12px] px-1 leading-relaxed mt-1 font-medium">
            {t('profile.privacyNote')}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav activeItem="contacts" onItemClick={handleNavigation} />
    </div>
  );
}
