import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { updateUserProfile } from '../services/authService';
import { createUserProfile, addEmergencyContact } from '../services/firestoreService';
import { isValidPhone } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import PhoneInput from '../components/PhoneInput';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1); // Step 1: Basic, Step 2: Contacts
  
  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [medicalCondition, setMedicalCondition] = useState('');
  
  // Step 2: Emergency Contacts
  const [contacts, setContacts] = useState([
    { name: '', phone: '', relation: '', isPrimary: true },
    { name: '', phone: '', relation: '', isPrimary: false },
    { name: '', phone: '', relation: '', isPrimary: false },
  ]);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Validate Step 1
  const validateStep1 = () => {
    setError(null);

    if (!name.trim()) {
      setError('Full name is required');
      return false;
    }

    if (!age) {
      setError('Please enter an age');
      return false;
    }

    if (!isValidPhone(phone)) {
      setError('Invalid phone number');
      return false;
    }

    if (!medicalCondition.trim()) {
      setError('Please enter a medical condition');
      return false;
    }

    return true;
  };

  // Validate Step 2
  const validateStep2 = () => {
    setError(null);

    const validContacts = contacts.filter(c => c.name.trim() || c.phone.trim());
    
    if (validContacts.length < 1) {
      setError('At least 1 emergency contact is required');
      return false;
    }

    for (const contact of validContacts) {
      if (!contact.name.trim()) {
        setError('Please enter name for all emergency contacts');
        return false;
      }
      if (!isValidPhone(contact.phone)) {
        setError('Invalid phone number for: ' + contact.name);
        return false;
      }
      if (!contact.relation.trim()) {
        setError('Please enter relation for: ' + contact.name);
        return false;
      }
    }

    return true;
  };

  // Handle Step 1 Submit
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    setStep(2);
  };

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setError(null);

    try {
      if (!currentUser) {
        throw new Error('User not authenticated. Please log in first.');
      }

      // Update auth user profile name
      await updateUserProfile(name);

      // Create user profile in Firestore with basic info
      const profileResult = await createUserProfile(currentUser.uid, {
        uid: currentUser.uid,
        phone,
        name,
        age: parseInt(age),
        medicalCondition,
      });

      if (!profileResult.success) {
        throw new Error(profileResult.error);
      }

      // Add emergency contacts
      let validContacts = contacts.filter(c => c.name.trim() && c.phone.trim());
      
      const primaryExists = validContacts.some(c => c.isPrimary);
      if (!primaryExists && validContacts.length > 0) {
        validContacts[0].isPrimary = true;
      }
      
      for (const contact of validContacts) {
        const contactResult = await addEmergencyContact(currentUser.uid, {
          name: contact.name.trim(),
          phone: contact.phone.trim(),
          relation: contact.relation.trim(),
          isPrimary: contact.isPrimary,
        });
        
        if (!contactResult.success) {
          console.warn(`Failed to add contact ${contact.name}:`, contactResult.error);
        }
      }

      console.log('✅ Profile created successfully with emergency contacts');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update emergency contact
  const handleContactChange = (index, field, value) => {
    const newContacts = [...contacts];
    newContacts[index][field] = value;
    setContacts(newContacts);
  };

  const setPrimaryContact = (index) => {
    const updatedContacts = contacts.map((c, i) => ({
      ...c,
      isPrimary: i === index
    }));
    setContacts(updatedContacts);
  };

  // Step 1: Basic Information
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 text-center space-y-2 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">{t('profile.editProfile')}</h1>
          <p className="text-sm text-gray-600">Step 1 of 2: {t('profile.profile')}</p>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-4">
          {error && (
            <div className="w-full p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <p className="text-base font-semibold text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleStep1Submit} className="space-y-4">
            {/* Form Card */}
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-gray-900">
                  {t('profile.name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full h-14 px-4 py-3 text-lg text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Age */}
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-gray-900">
                  {t('dashboard.age')}
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="75"
                  className="w-full h-14 px-4 py-3 text-lg text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-gray-900">{t('auth.phoneNumber')}</label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                />
              </div>

              {/* Medical Condition */}
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-gray-900">
                  {t('profile.medicalCondition')}
                </label>
                <input
                  type="text"
                  value={medicalCondition}
                  onChange={(e) => setMedicalCondition(e.target.value)}
                  placeholder="Diabetes, Hypertension, Asthma..."
                  className="w-full h-14 px-4 py-3 text-lg text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Action Buttons - Bottom */}
        <div className="px-4 py-4 space-y-3 bg-white border-t border-gray-200">
          <button
            type="submit"
            onClick={handleStep1Submit}
            className="w-full min-h-[56px] py-4 px-6 text-xl font-bold text-white bg-blue-600 rounded-xl border-2 border-blue-700 hover:bg-blue-700 shadow-md transition-all active:scale-95"
          >
            {t('common.next')}
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Emergency Contacts
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col pb-32">
      {/* Header */}
      <div className="px-4 py-4 text-center space-y-2 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">{t('profile.emergencyContacts')}</h1>
        <p className="text-sm text-gray-600">Step 2 of 2: Add at least 1 contact</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-4">
        {error && (
          <div className="w-full p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <p className="text-base font-semibold text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {contacts.map((contact, index) => (
            <div key={index} className="p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact {index + 1}</h3>

              {/* Name */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">
                  {t('profile.name')}
                </label>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                  placeholder="Mom, Doctor, Friend"
                  className="w-full h-14 px-4 py-3 text-lg text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">{t('auth.phoneNumber')}</label>
                <PhoneInput
                  value={contact.phone}
                  onChange={(val) => handleContactChange(index, 'phone', val)}
                />
              </div>

              {/* Relation */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">
                  {t('profile.relation')}
                </label>
                <input
                  type="text"
                  value={contact.relation}
                  onChange={(e) => handleContactChange(index, 'relation', e.target.value)}
                  placeholder="Mother, Doctor, Sister"
                  className="w-full h-14 px-4 py-3 text-lg text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Primary Contact Radio */}
              <label className="flex items-center gap-3 pt-2 cursor-pointer">
                <input
                  type="radio"
                  name="primaryContact"
                  checked={contact.isPrimary}
                  onChange={() => setPrimaryContact(index)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
                <span className="text-base font-semibold text-gray-900">
                  {t('profile.primaryContact')}
                </span>
                {contact.isPrimary && <span className="ml-auto text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-sm uppercase tracking-wide">⭐ Primary</span>}
              </label>
            </div>
          ))}
        </form>
      </div>

      {/* Action Buttons - Bottom (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 space-y-3 bg-white border-t border-gray-200">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full min-h-[56px] py-4 px-6 text-base font-semibold text-gray-900 bg-gray-100 rounded-xl border-2 border-gray-300 hover:bg-gray-200 transition-all active:scale-95"
        >
          {t('common.back')}
        </button>
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full min-h-[56px] py-4 px-6 text-xl font-bold text-white bg-green-600 rounded-xl border-2 border-green-700 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-95"
        >
          {loading ? t('common.loading') : t('profile.saveProfile')}
        </button>
      </div>
    </div>
  );
}
