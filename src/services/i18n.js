import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// LIST OF LANGUAGES
// DİL LİSTESİ
export const LANGUAGES = [
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'pl', label: 'Polski', flag: '🇵🇱' },
];

const resources = {
    en: {
        translation: {
            app_title: "Diarize AI",
            app_subtitle: "Live audio now converts to text",
            menu: "Menu",
            saved_recordings: "Saved Recordings",
            settings: "Settings",
            process: "Process",
            processing: "Processing...",
            save: "Save",
            tap_to_record: "Tap to Record",
            select_audio: "Select Audio File",
            language: "Language",
            storage: "Storage",
            manage_recordings: "Manage recordings",
            about: "About",
            version: "Version 1.0.0",
            close: "Close",
            no_recordings: "No recordings found.",
            
            // Storage & About
            total_files: "Total Files",
            file_list: "File List",
            clear_all: "Clear All Data",
            clear_all_confirm: "Are you sure? This will delete ALL recordings.",
            developer: "Developer",
            developer_name: "Efe & Ozan",
            
            // Alerts
            alert_error: "Error",
            alert_success: "Success",
            alert_ready: "Ready",
            alert_delete_title: "Delete Recording",
            alert_delete_msg: "Recording will be deleted. Are you sure?",
            alert_simulation: "Simulation Mode",
            alert_backend_down: "Backend unreachable. Showing demo results.",
            alert_saved: "Saved to library!",
            alert_renamed: "File renamed.",
            alert_sending: "Sending to API...",
            btn_cancel: "Cancel",
            btn_delete: "Delete",
            btn_yes: "Yes, Delete"
        }
    },
    tr: {
        translation: {
            app_title: "Diarize AI",
            app_subtitle: "Canlı ses şimdi metne dönüşüyor",
            menu: "Menü",
            saved_recordings: "Kaydedilenler",
            settings: "Ayarlar",
            process: "İşle",
            processing: "İşleniyor...",
            save: "Kaydet",
            tap_to_record: "Kaydetmek için dokun",
            select_audio: "Ses Dosyası Seç",
            language: "Dil",
            storage: "Depolama",
            manage_recordings: "Kayıtları yönet",
            about: "Hakkında",
            version: "Sürüm 1.0.0",
            close: "Kapat",
            no_recordings: "Kayıt bulunamadı.",
            
            // Storage & About
            total_files: "Toplam Dosya",
            file_list: "Dosya Listesi",
            clear_all: "Tüm Verileri Sil",
            clear_all_confirm: "Emin misiniz? TÜM kayıtlar silinecek.",
            developer: "Geliştirici",
            developer_name: "Efe & Ozan",

            // Alerts
            alert_error: "Hata",
            alert_success: "Başarılı",
            alert_ready: "Hazır",
            alert_delete_title: "Kaydı Sil",
            alert_delete_msg: "Kayıt silinecek. Emin misiniz?",
            alert_simulation: "Simülasyon Modu",
            alert_backend_down: "Sunucuya ulaşılamadı. Demo sonuçlar gösteriliyor.",
            alert_saved: "Kütüphaneye kaydedildi!",
            alert_renamed: "Dosya yeniden adlandırıldı.",
            alert_sending: "API'ye gönderiliyor...",
            btn_cancel: "İptal",
            btn_delete: "Sil",
            btn_yes: "Evet, Sil"
        }
    }
};

const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: async (callback) => {
        try {
            const storedLanguage = await AsyncStorage.getItem('user-language');
            callback(storedLanguage || 'en');
        } catch (error) { callback('en'); }
    },
    init: () => {},
    cacheUserLanguage: async (language) => { try { await AsyncStorage.setItem('user-language', language); } catch (e) {} },
};

i18next.use(languageDetector).use(initReactI18next).init({ compatibilityJSON: 'v3', resources, fallbackLng: 'en', interpolation: { escapeValue: false }, });

export default i18next;