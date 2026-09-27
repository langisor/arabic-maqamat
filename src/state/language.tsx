/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type Language = "en" | "ar"

const messages = {
  en: {
    language: "Language",
    studioNavigation: "Maqam studio navigation",
    selectMaqam: "Select maqam",
    audioSettings: "Audio settings",
    audioDsp: "Audio DSP",
    drone: "Drone",
    droneOn: "Drone on",
    audioStarting: "Starting audio",
    audioReady: "Audio ready",
    audioIdle: "Audio idle",
    audioActive: "Audio active",
    audioStartupFailed: "Audio could not start. Check that this site can use audio, then try again.",
    retryAudio: "Retry audio",
    stopAudio: "Stop audio",
    currentSession: "Current session",
    tonic: "Tonic / qarar",
    ghammaz: "Ghammaz",
    scale: "Scale",
    quickLinks: "Quick links",
    explore: "Explore",
    practice: "Practice",
    score: "Score",
    maqamFamilies: "Maqam & 8 Families",
    transposition: "Transposition Lab",
    violin: "Violin Fingerboard",
    sayr: "Sayr & Qafla",
    notation: "Score & MusicXML",
    tuning: "24-EDO Tuning",
    detector: "Jins Classifier",
    training: "Practice & Training",
    dspTitle: "Tone.js Audio DSP Engine",
    dspDescription: "Microtonal sound synthesis and acoustic space simulation",
    masterVolume: "Master volume",
    chamberReverb: "Acoustic chamber reverb",
    wetDry: "Wet / dry",
    reverbHelp: "Adjusts the simulated room reflections.",
    concertPitch: "Concert reference pitch (A4)",
    instrumentModel: "Instrument acoustic model",
    instrumentViolin: "Violin (كمان)",
    instrumentOud: "Oud (عود)",
    instrumentKanun: "Kanun (قانون)",
    auditionPhrase: "Audition tone: Dukah, Sikah, Husayni",
    done: "Done",
    themeSelection: "Theme selection",
    toggleTheme: "Toggle theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeAuto: "System",
    currentTheme: "Current theme",
    offline: "Offline",
    cachedOffline: "Cached for offline use",
    updateReady: "Update ready",
    reloading: "Reloading",
    installApp: "Install Arabic Maqamat app",
    install: "Install",
    installed: "Installed",
    installFailed: "The app could not be installed. Try again from your browser menu.",
    iosInstallTitle: "Install on iOS (iPhone / iPad)",
    iosInstallDescription: "Add to Home Screen for offline use",
    tapShare: "Tap the Share button",
    lookFor: "Look for",
    safariToolbar: "in the Safari toolbar.",
    addHomeScreen: "Select Add to Home Screen",
    scrollTap: "Scroll down and tap",
    launchOffline: "Launch offline anytime",
    iosOfflineDescription: "Open the app full-screen with cached assets and audio synthesis.",
    gotIt: "Got it",
    backOnline: "Back online",
    offlineMode: "Offline mode: using cached app assets",
    scorePipeline: "Score and notation pipeline",
    musicXmlStandard: "MusicXML 4.0 standard",
    microtonalScore: "Microtonal score",
    scoreDescription: "24-EDO quarter-tone notation with MusicXML accidental encoding",
    sheetMusic: "Sheet music",
    xmlView: "MusicXML 4.0",
    copyXml: "Copy MusicXML",
    copied: "Copied",
    downloadXml: "Download",
    clipboardCopyFailed: "Clipboard copy failed",
    clipboardBlocked: "Clipboard access was blocked. Use the XML view to select and copy the score.",
    copySucceeded: "MusicXML copied to clipboard.",
    copyFailed: "Copy failed.",
    renderSheet: "Rendering sheet music",
    sheetUnavailable: "Sheet rendering is unavailable. The scale is shown below instead.",
    notationCompatibility: "Some browsers block SVG or embedded notation rendering. Update the browser, then retry; the MusicXML view and download remain available.",
    scaleDegrees: "Scale degrees",
    ascending: "Ascending",
    osmdAnchor: "OSMD anchor",
    retryRendering: "Retry rendering",
    fidelityAudit: "Fidelity & Validation",
    auditPassed: "Fidelity Audit Passed (100% Roundtrip)",
    runFidelityAudit: "Run Roundtrip Audit",
    quarterTonesPreserved: "quarter-tones preserved",
    pitchSpellingVerified: "Pitch spelling verified",
    validationEmptyPhrase: "Cannot generate notation: phrase is empty.",
    validationUnsupportedPitch: "Phrase contains unsupported pitch data.",
    validationUnusualDuration: "Note duration exceeds standard metric limits.",
    scaleDegree: "Scale degree",
    playing: "playing",
    play: "Play",
    atFrequency: "at",
    phraseStart: "phrase start",
    cadence: "cadence",
    removePhrasePitch: "Remove",
    fromPhrase: "from phrase",
    addPitch: "Add",
    toPhrase: "to phrase",
  },
  ar: {
    language: "اللغة",
    studioNavigation: "التنقل بين مختبرات المقامات",
    selectMaqam: "اختر المقام",
    audioSettings: "إعدادات الصوت",
    audioDsp: "معالجة الصوت",
    drone: "قرار مستمر",
    droneOn: "القرار يعمل",
    audioStarting: "جارٍ تشغيل الصوت",
    audioReady: "الصوت جاهز",
    audioIdle: "الصوت متوقف",
    audioActive: "جلسات صوتية نشطة",
    audioStartupFailed: "تعذر تشغيل الصوت. تحقق من سماح المتصفح بالصوت ثم أعد المحاولة.",
    retryAudio: "إعادة المحاولة",
    stopAudio: "إيقاف الصوت",
    currentSession: "الجلسة الحالية",
    tonic: "القرار",
    ghammaz: "الغمّاز",
    scale: "السلم",
    quickLinks: "روابط سريعة",
    explore: "استكشاف",
    practice: "تمرين",
    score: "تدوين",
    maqamFamilies: "المقامات والعائلات الثماني",
    transposition: "مختبر النقل",
    violin: "لوحة الكمان",
    sayr: "السير والقفلة",
    notation: "التدوين وMusicXML",
    tuning: "ضبط ٢٤ نغمة",
    detector: "كاشف الجنس",
    training: "التدريب والتمرين",
    dspTitle: "محرك معالجة الصوت Tone.js",
    dspDescription: "توليد النغمات الدقيقة ومحاكاة الصدى الصوتي",
    masterVolume: "مستوى الصوت الرئيسي",
    chamberReverb: "صدى الحجرة الصوتية",
    wetDry: "الصدى / الجاف",
    reverbHelp: "يضبط محاكاة انعكاسات الصوت في المكان.",
    concertPitch: "طبقة الضبط المرجعية (لا ٤)",
    instrumentModel: "النموذج الصوتي للآلة",
    instrumentViolin: "الكمان (Violin)",
    instrumentOud: "العود (Oud)",
    instrumentKanun: "القانون (Kanun)",
    auditionPhrase: "استمع إلى النغمات: دوكاه، سيكاه، حسيني",
    done: "تم",
    themeSelection: "اختيار المظهر",
    toggleTheme: "تبديل المظهر",
    themeLight: "فاتح",
    themeDark: "داكن",
    themeAuto: "النظام",
    currentTheme: "المظهر الحالي",
    offline: "غير متصل",
    cachedOffline: "محفوظ للاستخدام دون اتصال",
    updateReady: "التحديث جاهز",
    reloading: "جارٍ إعادة التحميل",
    installApp: "تثبيت تطبيق المقامات العربية",
    install: "تثبيت",
    installed: "تم التثبيت",
    installFailed: "تعذر تثبيت التطبيق. حاول من قائمة المتصفح.",
    iosInstallTitle: "التثبيت على iOS (iPhone / iPad)",
    iosInstallDescription: "أضف التطبيق إلى الشاشة الرئيسية لاستخدامه دون اتصال",
    tapShare: "اضغط زر المشاركة",
    lookFor: "ابحث عن",
    safariToolbar: "في شريط أدوات Safari.",
    addHomeScreen: "اختر الإضافة إلى الشاشة الرئيسية",
    scrollTap: "مرر للأسفل ثم اضغط",
    launchOffline: "افتح التطبيق دون اتصال في أي وقت",
    iosOfflineDescription: "استخدم التطبيق بملء الشاشة مع الملفات المحفوظة وتوليد الصوت.",
    gotIt: "حسنًا",
    backOnline: "عاد الاتصال بالإنترنت",
    offlineMode: "وضع عدم الاتصال: استخدام الملفات المحفوظة",
    scorePipeline: "مسار التدوين الموسيقي",
    musicXmlStandard: "معيار MusicXML 4.0",
    microtonalScore: "تدوين المقام الدقيق",
    scoreDescription: "تدوين ربع النغمة بنظام ٢٤ نغمة مع ترميز العلامات في MusicXML",
    sheetMusic: "النوتة الموسيقية",
    xmlView: "MusicXML 4.0",
    copyXml: "نسخ MusicXML",
    copied: "تم النسخ",
    downloadXml: "تنزيل",
    clipboardCopyFailed: "تعذر النسخ إلى الحافظة",
    clipboardBlocked: "منع المتصفح الوصول إلى الحافظة. استخدم عرض XML لتحديد التدوين ونسخه.",
    copySucceeded: "تم نسخ MusicXML إلى الحافظة.",
    copyFailed: "فشل النسخ.",
    renderSheet: "جارٍ عرض النوتة الموسيقية",
    sheetUnavailable: "تعذر عرض النوتة. يظهر السلم الموسيقي أدناه بديلًا.",
    notationCompatibility: "قد تمنع بعض المتصفحات عرض SVG أو التدوين المضمّن. حدّث المتصفح ثم أعد المحاولة؛ يظل عرض MusicXML وتنزيله متاحين.",
    scaleDegrees: "درجات السلم",
    ascending: "تصاعديًا",
    osmdAnchor: "مرجع OSMD",
    retryRendering: "إعادة عرض التدوين",
    fidelityAudit: "فحص الدقة والتحقق",
    auditPassed: "تم اجتياز فحص الدقة (١٠٠٪ توافق عكسي)",
    runFidelityAudit: "تشغيل فحص التحويل العكسي",
    quarterTonesPreserved: "أرباع نغمات محفوظة بدقة",
    pitchSpellingVerified: "تم التحقق من تسمية النغمات وعلامات التحويل",
    validationEmptyPhrase: "تعذر إنشاء التدوين: الجملة اللحنية فارغة.",
    validationUnsupportedPitch: "تحتوي الجملة على بيانات نغمية غير مدعومة.",
    validationUnusualDuration: "مدة النوتة تتجاوز الحدود المترية القياسية.",
    scaleDegree: "درجة السلم",
    playing: "قيد العزف",
    play: "تشغيل",
    atFrequency: "بتردد",
    phraseStart: "بداية العبارة",
    cadence: "القفلة",
    removePhrasePitch: "إزالة",
    fromPhrase: "من العبارة",
    addPitch: "إضافة",
    toPhrase: "إلى العبارة",
  },
} as const

type MessageKey = keyof typeof messages.en

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: MessageKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)
const STORAGE_KEY = "arabic-maqamat-language"

function getInitialLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === "ar" ? "ar" : "en"
  } catch {
    return "en"
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage)
    try {
      localStorage.setItem(STORAGE_KEY, nextLanguage)
    } catch {
      // Locale remains usable for the current session when storage is unavailable.
    }
  }, [])

  const t = useCallback((key: MessageKey) => messages[language][key], [language])
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
  }, [language])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider")
  return context
}