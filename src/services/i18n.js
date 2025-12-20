import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// LIST OF LANGUAGES (Flags and Native Names)
// DİL LİSTESİ (Bayraklar ve Yerel İsimler)
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

// TRANSLATION DICTIONARY
// ÇEVİRİ SÖZLÜĞÜ
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
            select_audio: "Select Audio File", // NEW / YENİ
            language: "Language",
            storage: "Storage",
            manage_recordings: "Manage recordings",
            about: "About",
            version: "Version 1.0.0",
            close: "Close",
            no_recordings: "No recordings found.",
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
            select_audio: "Ses Dosyası Seç", // NEW / YENİ
            language: "Dil",
            storage: "Depolama",
            manage_recordings: "Kayıtları yönet",
            about: "Hakkında",
            version: "Sürüm 1.0.0",
            close: "Kapat",
            no_recordings: "Kayıt bulunamadı.",
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
    },
    // Updated other languages with 'select_audio'
    // Diğer diller 'select_audio' ile güncellendi
    de: { translation: { app_title: "Diarize AI", app_subtitle: "Live-Audio wird jetzt in Text umgewandelt", menu: "Menü", saved_recordings: "Aufnahmen", settings: "Einstellungen", process: "Verarbeiten", processing: "Verarbeitung...", save: "Speichern", tap_to_record: "Zum Aufnehmen tippen", select_audio: "Audiodatei auswählen", language: "Sprache", storage: "Speicher", manage_recordings: "Aufnahmen verwalten", about: "Über", version: "Version 1.0.0", close: "Schließen", no_recordings: "Keine Aufnahmen.", alert_simulation: "Simulationsmodus", alert_backend_down: "Server nicht erreichbar.", alert_delete_title: "Löschen", alert_delete_msg: "Sicher?", btn_cancel: "Abbrechen", btn_yes: "Ja" } },
    fr: { translation: { app_title: "Diarize AI", app_subtitle: "L'audio en direct est converti en texte", menu: "Menu", saved_recordings: "Enregistrements", settings: "Paramètres", process: "Traiter", processing: "Traitement...", save: "Sauvegarder", tap_to_record: "Appuyez pour enregistrer", select_audio: "Choisir un fichier", language: "Langue", storage: "Stockage", manage_recordings: "Gérer", about: "À propos", version: "Version 1.0.0", close: "Fermer", no_recordings: "Aucun enregistrement.", alert_simulation: "Mode Simulation", alert_backend_down: "Serveur inaccessible.", alert_delete_title: "Supprimer", alert_delete_msg: "Êtes-vous sûr ?", btn_cancel: "Annuler", btn_yes: "Oui" } },
    es: { translation: { app_title: "Diarize AI", app_subtitle: "El audio en vivo ahora se convierte en texto", menu: "Menú", saved_recordings: "Grabaciones", settings: "Ajustes", process: "Procesar", processing: "Procesando...", save: "Guardar", tap_to_record: "Toque para grabar", select_audio: "Seleccionar archivo", language: "Idioma", storage: "Almacenamiento", manage_recordings: "Gestionar", about: "Acerca de", version: "Versión 1.0.0", close: "Cerrar", no_recordings: "No se encontraron grabaciones.", alert_simulation: "Modo Simulación", alert_backend_down: "Servidor inalcanzable.", alert_delete_title: "Borrar", alert_delete_msg: "¿Estás seguro?", btn_cancel: "Cancelar", btn_yes: "Sí" } },
    zh: { translation: { app_title: "Diarize AI", app_subtitle: "实时音频现在转换为文本", menu: "菜单", saved_recordings: "已保存的录音", settings: "设置", process: "处理", processing: "处理中...", save: "保存", tap_to_record: "点击录音", select_audio: "选择音频文件", language: "语言", storage: "存储", manage_recordings: "管理录音", about: "关于", version: "版本 1.0.0", close: "关闭", no_recordings: "未找到录音。", alert_simulation: "模拟模式", alert_backend_down: "无法连接后台。", alert_delete_title: "删除", alert_delete_msg: "你确定吗？", btn_cancel: "取消", btn_yes: "是的" } },
    ru: { translation: { app_title: "Diarize AI", app_subtitle: "Живой звук теперь преобразуется в текст", menu: "Меню", saved_recordings: "Записи", settings: "Настройки", process: "Обработать", processing: "Обработка...", save: "Сохранить", tap_to_record: "Нажмите для записи", select_audio: "Выбрать файл", language: "Язык", storage: "Хранилище", manage_recordings: "Управление записями", about: "О приложении", version: "Версия 1.0.0", close: "Закрыть", no_recordings: "Записи не найдены.", alert_simulation: "Режим симуляции", alert_backend_down: "Сервер недоступен.", alert_delete_title: "Удалить запись", alert_delete_msg: "Вы уверены?", btn_cancel: "Отмена", btn_yes: "Да, удалить" } },
};

// LANGUAGE DETECTOR (Reads from storage)
// DİL ALGILAYICI (Hafızadan okur)
const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: async (callback) => {
        try {
            // Check if user has a saved language preference
            // Kullanıcının kayıtlı bir dil tercihi olup olmadığını kontrol et
            const storedLanguage = await AsyncStorage.getItem('user-language');
            callback(storedLanguage || 'en');
        } catch (error) {
            console.log('Error reading language', error);
            callback('en');
        }
    },
    init: () => {},
    cacheUserLanguage: async (language) => {
        try {
            // Save selected language to storage
            // Seçilen dili hafızaya kaydet
            await AsyncStorage.setItem('user-language', language);
        } catch (error) {}
    },
};

i18next
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v3',
        resources,
        fallbackLng: 'en', // Default to English if translation missing / Çeviri eksikse varsayılan İngilizce
        interpolation: {
            escapeValue: false,
        },
    });

export default i18next;