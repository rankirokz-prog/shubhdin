/* ritu and ayana in nine languages — the ONLY two panchang tables that exist
   nowhere else. Keyed by exactly what the engine emits (RITU_EN, ayanaFromLong).

   CHOGHADIYA IS NOT HERE, DELIBERATELY. I wrote one, then found ui-strings.js
   already carried SD_UI.chogh — and the two disagreed in seven Tamil entries:
   I had bare stems (சர, லாப), the report layer has the nominal form
   (சரம், லாபம்). The reports have shipped with those words. Two tables for one
   term is exactly the drift this project keeps fighting, so mine is deleted
   and the bridge reads the report layer's. One source, one word, everywhere. */
(function (g) {
  g.SD_PANCHANG_TERMS = {
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
