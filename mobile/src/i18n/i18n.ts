import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'user_preferred_language';

const resources = {
  en: {
    translation: {
      // ── General ──
      welcome: "Welcome",
      welcome_sub: "Your Trusted Elder Care Companion",
      login: "Login",
      signup: "Sign Up",
      logout: "Log Out",
      email: "Email Address",
      password: "Password",
      save: "Save",
      cancel: "Cancel",
      back: "Back",
      select_language: "Select Language",
      
      // ── Elder Navigation / Dashboard ──
      home: "Home",
      medicines: "Medicines",
      tasks: "Tasks",
      mood: "Mood",
      sos: "SOS Emergency",
      journal: "Journal",
      profile: "Profile",
      settings: "Settings",
      
      // ── Emergency / SOS ──
      emergency_title: "EMERGENCY ASSISTANCE",
      emergency_sub: "Press the button below or say 'HELP' to send immediate alert to your guardian",
      press_sos: "PRESS FOR HELP",
      listening_voice: "Listening for emergency voice commands...",
      confirm_sos: "Confirm Emergency",
      cancel_sos: "Cancel Emergency",
      sos_sent: "Emergency Alert Sent!",
      
      // ── Medication ──
      medication_title: "Today's Medications",
      add_medication: "Add Medication",
      taken: "Taken",
      missed: "Missed",
      pending: "Pending",
      time: "Time",
      dosage: "Dosage",
      
      // ── Mood ──
      mood_title: "How are you feeling today?",
      happy: "Happy",
      neutral: "Normal",
      sad: "Sad",
      anxious: "Anxious",
      angry: "Angry",
      log_mood: "Log Mood",
      
      // ── Settings & Guardian ──
      language_preference: "Language Preference",
      english: "English",
      sinhala: "සිංහල (Sinhala)",
      tamil: "தமிழ் (Tamil)",
      guardian_dashboard: "Care Center Dashboard",
      safety_status: "Elder Safety Status",
      health_score: "Health Score",
      recent_activity: "Recent Activity",
      risk_level: "Risk Level",
      offline_sync: "Offline Sync Status",
      offline_cached: "Offline — Local storage active",
      syncing: "Synchronizing clinical records...",
      synced: "All records synchronized",
    }
  },
  si: {
    translation: {
      // ── General ──
      welcome: "ආයුබෝවන්",
      welcome_sub: "ඔබගේ විශ්වාසනීය වැඩිහිටි සරණ සහයකයා",
      login: "ඇතුළු වන්න",
      signup: "ලියාපදිංචි වන්න",
      logout: "නික්මෙන්න",
      email: "විද්‍යුත් තැපෑල",
      password: "මුරපදය",
      save: "සුරකින්න",
      cancel: "අවලංගු කරන්න",
      back: "ආපසු",
      select_language: "භාෂාව තෝරන්න",
      
      // ── Elder Navigation / Dashboard ──
      home: "මුල් පිටුව",
      medicines: "බෙහෙත්",
      tasks: "කාර්යයන්",
      mood: "මානසික සුවය",
      sos: "අදිසි හදිසි ඇමතුම්",
      journal: "සටහන් පොත",
      profile: "මගේ විස්තර",
      settings: "සැකසුම්",
      
      // ── Emergency / SOS ──
      emergency_title: "හදිසි උපකාර සේවාව",
      emergency_sub: "ඔබගේ භාරකරුට වහාම පණිවිඩයක් යැවීමට පහත බොත්තම ඔබන්න නැතහොත් 'බේරගන්න' යැයි කියන්න",
      press_sos: "උපකාර සඳහා ඔබන්න",
      listening_voice: "හදිසි කටහඬ විධානයන්ට සවන් දෙමින් පවතී...",
      confirm_sos: "හදිසි අවස්ථාව තහවුරු කරන්න",
      cancel_sos: "අවලංගු කරන්න",
      sos_sent: "හදිසි පණිවිඩය යවන ලදී!",
      
      // ── Medication ──
      medication_title: "අද දින ලබාගත යුතු බෙහෙත්",
      add_medication: "බෙහෙත් එකතු කරන්න",
      taken: "ලබාගත්තා",
      missed: "මගහැරුණා",
      pending: "ලබාගැනීමට ඇත",
      time: "වේලාව",
      dosage: "මාත්‍රාව",
      
      // ── Mood ──
      mood_title: "අද දින ඔබට කෙසේ හැඟේද?",
      happy: "සතුටින්",
      neutral: "සාමාන්‍යයි",
      sad: "කණගාටුවෙන්",
      anxious: "බියෙන්/සැකයෙන්",
      angry: "කෝපයෙන්",
      log_mood: "තත්ත්වය සටහන් කරන්න",
      
      // ── Settings & Guardian ──
      language_preference: "භාෂා තේරීම",
      english: "English",
      sinhala: "සිංහල (Sinhala)",
      tamil: "தமிழ் (Tamil)",
      guardian_dashboard: "භාරකරු පාලන පුවරුව",
      safety_status: "වැඩිහිටි ආරක්ෂිත තත්ත්වය",
      health_score: "සෞඛ්‍ය අගය",
      recent_activity: "මෑත කාලීන සිදුවීම්",
      risk_level: "අවදානම් මට්ටම",
      offline_sync: "නොබැඳි සමමුහුර්තකරණය",
      offline_cached: "නොබැඳි — දත්ත සුරක්ෂිතව ඇත",
      syncing: "දත්ත සමමුහුර්ත වෙමින් පවතී...",
      synced: "සියලු දත්ත යාවත්කාලීනයි",
    }
  },
  ta: {
    translation: {
      // ── General ──
      welcome: "வரவேற்கிறோம்",
      welcome_sub: "உங்கள் நம்பகமான முதியோர் பராமரிப்பு உதவியாளர்",
      login: "உள்நுழைக",
      signup: "பதிவு செய்க",
      logout: "வெளியேறு",
      email: "மின்னஞ்சல் முகவரி",
      password: "கடவுச்சொல்",
      save: "சேமி",
      cancel: "ரத்து செய்",
      back: "பின்னால்",
      select_language: "மொழியைத் தேர்ந்தெடுக்கவும்",
      
      // ── Elder Navigation / Dashboard ──
      home: "முகப்பு",
      medicines: "மருந்துகள்",
      tasks: "பணிகள்",
      mood: "மனநிலை",
      sos: "அவசர உதவி (SOS)",
      journal: "குறிப்பேடு",
      profile: "சுயவிவரம்",
      settings: "அமைப்புகள்",
      
      // ── Emergency / SOS ──
      emergency_title: "அவசர உதவி சேவை",
      emergency_sub: "உடனடி உதவிக்கு கீழே உள்ள பொத்தானை அழுத்தவும் அல்லது 'காப்பாற்றுங்கள்' என்று கூறவும்",
      press_sos: "உதவிக்கு அழுத்தவும்",
      listening_voice: "அவசர குரல் கட்டளைகளைக் கேட்கிறது...",
      confirm_sos: "அவசரநிலையை உறுதிப்படுத்தவும்",
      cancel_sos: "ரத்து செய்",
      sos_sent: "அவசர எச்சரிக்கை அனுப்பப்பட்டது!",
      
      // ── Medication ──
      medication_title: "இன்றைய மருந்துகள்",
      add_medication: "மருந்தைச் சேர்க்கவும்",
      taken: "எடுத்துக்கொள்ளப்பட்டது",
      missed: "தவறவிட்டது",
      pending: "நிலுவையில் உள்ளது",
      time: "நேரம்",
      dosage: "அளவு",
      
      // ── Mood ──
      mood_title: "இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?",
      happy: "மகிழ்ச்சியாக",
      neutral: "சாதாரணமாக",
      sad: "கவலையாக",
      anxious: "பயத்துடன்",
      angry: "கோபமாக",
      log_mood: "மனநிலையைப் பதிவு செய்",
      
      // ── Settings & Guardian ──
      language_preference: "மொழி விருப்பம்",
      english: "English",
      sinhala: "සිංහල (Sinhala)",
      tamil: "தமிழ் (Tamil)",
      guardian_dashboard: "பராமரிப்பாளர் கட்டுப்பாட்டு மையம்",
      safety_status: "முதியோர் பாதுகாப்பு நிலை",
      health_score: "சுகாதார மதிப்பீடு",
      recent_activity: "சமீபத்திய நடவடிக்கைகள்",
      risk_level: "அபாய நிலை",
      offline_sync: "ஆஃப்லைன் ஒத்திசைவு",
      offline_cached: "ஆஃப்லைன் — தரவு பாதுகாப்பாக உள்ளது",
      syncing: "தரவு ஒத்திசைக்கப்படுகிறது...",
      synced: "அனைத்து தரவுகளும் புதுப்பிக்கப்பட்டன",
    }
  }
};

// Language Detector & Persistence
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLang) {
        return callback(savedLang);
      }
    } catch (e) {
      console.log('AsyncStorage not ready, using fallback language');
    }
    callback('en'); // default fallback
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (e) {
      console.log('Error caching language', e);
    }
  }
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export const changeLanguage = async (lang: 'en' | 'si' | 'ta') => {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
};

export default i18n;
