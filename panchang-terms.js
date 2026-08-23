/* Choghadiya and ritu in nine languages — the two panchang tables the report
   layer never needed, keyed by the exact strings the engine emits
   (CHOG_CYCLE_EN, RITU_EN), verified against panchang-engine.js.
   Transliterated, not translated: లాభ is what a Telugu reader looks for, not a
   descriptive word for "gain". Same ruling as tithi and nakshatra. */
(function (g) {
  g.SD_PANCHANG_TERMS = {
    choghadiya: {
      "Udveg": { en: "Udveg", hi: "उद्वेग", te: "ఉద్వేగ", kn: "ಉದ್ವೇಗ", ta: "உத்வேக", bn: "উদ্বেগ", mr: "उद्वेग", gu: "ઉદ્વેગ", as: "উদ্বেগ" },
      "Char":  { en: "Char",  hi: "चर",     te: "చర",     kn: "ಚರ",     ta: "சர",     bn: "চর",     mr: "चर",     gu: "ચર",     as: "চৰ" },
      "Labh":  { en: "Labh",  hi: "लाभ",    te: "లాభ",    kn: "ಲಾಭ",    ta: "லாப",    bn: "লাভ",    mr: "लाभ",    gu: "લાભ",    as: "লাভ" },
      "Amrit": { en: "Amrit", hi: "अमृत",   te: "అమృత",   kn: "ಅಮೃತ",   ta: "அமிர்த", bn: "অমৃত",   mr: "अमृत",   gu: "અમૃત",   as: "অমৃত" },
      "Kaal":  { en: "Kaal",  hi: "काल",    te: "కాల",    kn: "ಕಾಲ",    ta: "கால",    bn: "কাল",    mr: "काल",    gu: "કાળ",    as: "কাল" },
      "Shubh": { en: "Shubh", hi: "शुभ",    te: "శుభ",    kn: "ಶುಭ",    ta: "சுப",    bn: "শুভ",    mr: "शुभ",    gu: "શુભ",    as: "শুভ" },
      "Rog":   { en: "Rog",   hi: "रोग",    te: "రోగ",    kn: "ರೋಗ",    ta: "ரோக",    bn: "রোগ",    mr: "रोग",    gu: "રોગ",    as: "ৰোগ" }
    },
    /* ayana — the last panchang term with no entry anywhere. Keyed by exactly
       what ayanaFromLong() returns. Transliterated like choghadiya and ritu:
       a Telugu reader looks for ఉత్తరాయణం, not a phrase about northward motion. */
    ayana: {
      "Uttarayana":   { en: "Uttarayana",   hi: "उत्तरायण",  te: "ఉత్తరాయణం",  kn: "ಉತ್ತರಾಯಣ",  ta: "உத்தராயணம்",   bn: "উত্তরায়ণ",  mr: "उत्तरायण",  gu: "ઉત્તરાયણ",  as: "উত্তৰায়ণ" },
      "Dakshinayana": { en: "Dakshinayana", hi: "दक्षिणायन", te: "దక్షిణాయనం", kn: "ದಕ್ಷಿಣಾಯಣ", ta: "தட்சிணாயணம்", bn: "দক্ষিণায়ণ", mr: "दक्षिणायन", gu: "દક્ષિણાયન", as: "দক্ষিণায়ণ" }
    },
    ritu: {
      "Vasanta":  { en: "Vasanta",  hi: "वसंत",   te: "వసంతం",   kn: "ವಸಂತ",   ta: "வசந்தம்",   bn: "বসন্ত",  mr: "वसंत",   gu: "વસંત",   as: "বসন্ত" },
      "Grishma":  { en: "Grishma",  hi: "ग्रीष्म", te: "గ్రీష్మం", kn: "ಗ್ರೀಷ್ಮ", ta: "கிரீஷ்மம்", bn: "গ্রীষ্ম", mr: "ग्रीष्म", gu: "ગ્રીષ્મ", as: "গ্ৰীষ্ম" },
      "Varsha":   { en: "Varsha",   hi: "वर्षा",   te: "వర్షం",   kn: "ವರ್ಷ",   ta: "வர்ஷம்",   bn: "বর্ষা",  mr: "वर्षा",  gu: "વર્ષા",  as: "বৰ্ষা" },
      "Sharad":   { en: "Sharad",   hi: "शरद",    te: "శరత్తు",  kn: "ಶರತ್",   ta: "சரத்",     bn: "শরৎ",   mr: "शरद",   gu: "શરદ",   as: "শৰৎ" },
      "Hemanta":  { en: "Hemanta",  hi: "हेमंत",   te: "హేమంతం",  kn: "ಹೇಮಂತ",  ta: "ஹேமந்தம்", bn: "হেমন্ত", mr: "हेमंत",  gu: "હેમંત",  as: "হেমন্ত" },
      "Shishira": { en: "Shishira", hi: "शिशिर",  te: "శిశిరం",  kn: "ಶಿಶಿರ",  ta: "சிசிரம்",   bn: "শিশির",  mr: "शिशिर",  gu: "શિશિર",  as: "শিশিৰ" }
    }
  };
})(typeof window !== 'undefined' ? window : global);
