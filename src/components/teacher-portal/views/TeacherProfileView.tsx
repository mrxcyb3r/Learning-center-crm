import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  User,
  Mail,
  Phone,
  Globe,
  Camera,
  Plus,
  Trash2,
  ExternalLink,
  Link2,
  Save,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { updateUserProfile } from '../../../services/firestore';
import { TeacherProfile, SocialLink } from '../../../types/teacher';

const SOCIAL_PLATFORMS = [
  'Telegram',
  'Instagram',
  'Facebook',
  'LinkedIn',
  'YouTube',
  'WhatsApp',
  'Website',
];

export const TeacherProfileView: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { teacherUid } = useTeacherPortal();

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [isPublicProfile, setIsPublicProfile] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newPlatform, setNewPlatform] = useState(SOCIAL_PLATFORMS[0]);
  const [newUrl, setNewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPhotoURL(currentUser.photoURL || '');
    }
  }, [currentUser]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleAddSocialLink = () => {
    if (!newUrl.trim()) {
      toast.error('URL is required');
      return;
    }
    setSocialLinks([...socialLinks, { platform: newPlatform, url: newUrl.trim() }]);
    setNewUrl('');
  };

  const handleRemoveSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!teacherUid) return;
    setIsSaving(true);
    try {
      await updateUserProfile(teacherUid, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim(),
        phoneNumber: phoneNumber.trim(),
        bio: bio.trim(),
        isPublicProfile,
        socialLinks,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2.5 rounded-2xl border ${
            theme === 'dark'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
          }`}
        >
          <User className="w-5 h-5" />
        </div>
        <div>
          <h2
            className={`text-lg font-extrabold ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            My Profile
          </h2>
          <p
            className={`text-xs font-semibold ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Manage your public profile information
          </p>
        </div>
      </div>

      {/* Profile Photo + Basic Info */}
      <div
        className={`p-6 rounded-2xl border ${
          theme === 'dark'
            ? 'bg-slate-900/50 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Photo Preview */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-white">
                  {getInitials(displayName || currentUser?.displayName || 'T')}
                </span>
              )}
            </div>
            <div
              className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Camera className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          <div className="flex-1 w-full space-y-3">
            {/* Display Name */}
            <div>
              <label
                className={`block text-xs font-bold mb-1.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Photo URL */}
            <div>
              <label
                className={`block text-xs font-bold mb-1.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Photo URL
              </label>
              <input
                type="url"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://..."
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info (Read-only) */}
      <div
        className={`p-5 rounded-2xl border ${
          theme === 'dark'
            ? 'bg-slate-900/50 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <h3
          className={`text-sm font-extrabold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}
        >
          Account Info
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'
              }`}
            >
              <Mail className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p
                className={`text-xs font-bold ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Email
              </p>
              <p
                className={`text-sm font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                {currentUser?.email || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'
              }`}
            >
              <UserCircle className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p
                className={`text-xs font-bold ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Role
              </p>
              <p
                className={`text-sm font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                Teacher
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div
        className={`p-5 rounded-2xl border ${
          theme === 'dark'
            ? 'bg-slate-900/50 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <h3
          className={`text-sm font-extrabold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}
        >
          Additional Info
        </h3>
        <div className="space-y-3">
          <div>
            <label
              className={`block text-xs font-bold mb-1.5 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+998 90 123 45 67"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-xs font-bold mb-1.5 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell students about your experience..."
              rows={3}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition resize-none ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div
        className={`p-5 rounded-2xl border ${
          theme === 'dark'
            ? 'bg-slate-900/50 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-sm font-extrabold ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            Social Links
          </h3>
          <Link2
            className={`w-4 h-4 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}
          />
        </div>

        {/* Existing Links */}
        {socialLinks.length > 0 && (
          <div className="space-y-2 mb-4">
            {socialLinks.map((link, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 border-slate-700'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                      theme === 'dark'
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {link.platform}
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-semibold truncate ${
                      theme === 'dark'
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {link.url}
                  </a>
                </div>
                <button
                  onClick={() => handleRemoveSocialLink(index)}
                  className={`p-1.5 rounded-lg transition cursor-pointer flex-shrink-0 ${
                    theme === 'dark'
                      ? 'text-slate-600 hover:text-rose-400 hover:bg-slate-700'
                      : 'text-slate-300 hover:text-rose-500 hover:bg-slate-200'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Link */}
        <div className="flex items-center gap-2">
          <select
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold outline-none transition ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
            }`}
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
            className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none transition ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
            }`}
          />
          <button
            onClick={handleAddSocialLink}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-emerald-50 border-emerald-500/20 text-emerald-600 hover:bg-emerald-100'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Public Profile */}
      <div
        className={`p-5 rounded-2xl border ${
          theme === 'dark'
            ? 'bg-slate-900/50 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3
              className={`text-sm font-extrabold ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Public Profile
            </h3>
            <p
              className={`text-xs font-semibold ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Allow others to view your profile
            </p>
          </div>
          <button
            onClick={() => setIsPublicProfile(!isPublicProfile)}
            className={`relative w-11 h-6 rounded-full transition cursor-pointer ${
              isPublicProfile ? 'bg-emerald-500' : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                isPublicProfile ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {isPublicProfile && (
          <div
            className={`mt-3 p-3 rounded-xl border ${
              theme === 'dark'
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-emerald-50 border-emerald-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              <span
                className={`text-xs font-bold ${
                  theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              >
                Public profile is enabled
              </span>
            </div>
            <a
              href={`/teacher/${currentUser?.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold ${
                theme === 'dark'
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-emerald-600 hover:text-emerald-700'
              }`}
            >
              <ExternalLink className="w-3 h-3" />
              View public profile
            </a>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
};
