import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface SettingsForm {
  immich_url: string;
  immich_api_key: string;
  strava_client_id: string;
  strava_client_secret: string;
  strava_refresh_token: string;
  traccar_url: string;
  traccar_email: string;
  traccar_password: string;
}

export function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsForm>({
    immich_url: '',
    immich_api_key: '',
    strava_client_id: '',
    strava_client_secret: '',
    strava_refresh_token: '',
    traccar_url: '',
    traccar_email: '',
    traccar_password: '',
  });

  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load settings from all types
      const [immichData, stravaData, traccarData] = await Promise.all([
        axios.get('/api/settings/immich'),
        axios.get('/api/settings/strava'),
        axios.get('/api/settings/traccar'),
      ]);

      setSettings({
        immich_url: immichData.data.immich_url || '',
        immich_api_key: immichData.data.immich_api_key || '',
        strava_client_id: stravaData.data.strava_client_id || '',
        strava_client_secret: stravaData.data.strava_client_secret || '',
        strava_refresh_token: stravaData.data.strava_refresh_token || '',
        traccar_url: traccarData.data.traccar_url || '',
        traccar_email: traccarData.data.traccar_email || '',
        traccar_password: traccarData.data.traccar_password || '',
      });
    } catch (error: any) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Nie udało się załadować ustawień' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const settingsToUpdate = [
        // Immich
        { key: 'immich_url', value: settings.immich_url, type: 'immich' },
        { key: 'immich_api_key', value: settings.immich_api_key, type: 'immich' },
        // Strava
        { key: 'strava_client_id', value: settings.strava_client_id, type: 'strava' },
        { key: 'strava_client_secret', value: settings.strava_client_secret, type: 'strava' },
        { key: 'strava_refresh_token', value: settings.strava_refresh_token, type: 'strava' },
        // Traccar
        { key: 'traccar_url', value: settings.traccar_url, type: 'traccar' },
        { key: 'traccar_email', value: settings.traccar_email, type: 'traccar' },
        { key: 'traccar_password', value: settings.traccar_password, type: 'traccar' },
      ];

      await axios.post('/api/settings/bulk', { settings: settingsToUpdate });

      setMessage({ type: 'success', text: '✓ Ustawienia zostały zapisane' });

      // Reload after 1 second
      setTimeout(() => {
        loadSettings();
      }, 1000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Nie udało się zapisać ustawień' });
    } finally {
      setSaving(false);
    }
  };

  const toggleShowSecret = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Ładowanie ustawień...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Powrót
          </button>
          <h1 className="text-3xl font-bold">Ustawienia API</h1>
          <p className="text-gray-600 mt-2">
            Konfiguracja połączeń z Immich, Strava i Traccar
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Immich Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              📸
            </span>
            Immich
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Immich
              </label>
              <input
                type="url"
                value={settings.immich_url}
                onChange={(e) => setSettings({ ...settings, immich_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://immich.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showSecrets.immich_api_key ? 'text' : 'password'}
                  value={settings.immich_api_key}
                  onChange={(e) => setSettings({ ...settings, immich_api_key: e.target.value })}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret('immich_api_key')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets.immich_api_key ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Strava Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
              🏃
            </span>
            Strava
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={settings.strava_client_id}
                onChange={(e) => setSettings({ ...settings, strava_client_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Secret
              </label>
              <div className="relative">
                <input
                  type={showSecrets.strava_client_secret ? 'text' : 'password'}
                  value={settings.strava_client_secret}
                  onChange={(e) => setSettings({ ...settings, strava_client_secret: e.target.value })}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret('strava_client_secret')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets.strava_client_secret ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refresh Token
              </label>
              <div className="relative">
                <input
                  type={showSecrets.strava_refresh_token ? 'text' : 'password'}
                  value={settings.strava_refresh_token}
                  onChange={(e) => setSettings({ ...settings, strava_refresh_token: e.target.value })}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret('strava_refresh_token')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets.strava_refresh_token ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Traccar Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
              📍
            </span>
            Traccar
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Traccar
              </label>
              <input
                type="url"
                value={settings.traccar_url}
                onChange={(e) => setSettings({ ...settings, traccar_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://traccar.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={settings.traccar_email}
                onChange={(e) => setSettings({ ...settings, traccar_email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasło
              </label>
              <div className="relative">
                <input
                  type={showSecrets.traccar_password ? 'text' : 'password'}
                  value={settings.traccar_password}
                  onChange={(e) => setSettings({ ...settings, traccar_password: e.target.value })}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret('traccar_password')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets.traccar_password ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 font-medium transition-colors"
          >
            <Save size={20} />
            {saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
          </button>
        </div>
      </div>
    </div>
  );
}
