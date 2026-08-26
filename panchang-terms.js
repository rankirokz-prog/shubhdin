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
    /* disha — the eight directions, for Disha Shool. I wired sdTerm('disha',…)
       into three call sites before this table existed; the bridge fell through
       to the engine's Hindi and reported nothing. Keyed by what the engine
       emits. Telugu only for now — the other six need the translator. */
    /* Named muhurtas. SD_UI.muhurta turned out to hold UI LABELS, not names,
       so sdWindow() missed on Abhijit and Brahma and rendered them in Latin.
       Found only because a miss is now loud. Telugu matches the app sheet
       (అభిజిత్ ముహూర్తం, బ్రహ్మ ముహూర్తం) so the two never disagree. */
    muhurtaName: {
      "Abhijit":  { en:"Abhijit",  hi:"अभिजित",     te:"అభిజిత్", kn:"ಅಭಿಜಿತ್", ta:"அபிஜித்" },
      "Brahma":   { en:"Brahma",   hi:"ब्रह्म",      te:"బ్రహ్మ", kn:"ಬ್ರಹ್ಮ", ta:"பிரம்ம" },
      "Amrit":    { en:"Amrit",    hi:"अमृत",       te:"అమృత", kn:"ಅಮೃತ", ta:"அமிர்த" },
      "Godhuli":  { en:"Godhuli",  hi:"गोधूलि",     te:"గోధూళి", kn:"ಗೋಧೂಳಿ", ta:"கோதூளி" },
      "Vijaya":   { en:"Vijaya",   hi:"विजय",       te:"విజయ", kn:"ವಿಜಯ", ta:"விஜய" },
      "Nishita":  { en:"Nishita",  hi:"निशीथ",      te:"నిశీథ", kn:"ನಿಶೀಥ", ta:"நிசீத" },
      "Sayahna":  { en:"Sayahna",  hi:"सायाह्न",    te:"సాయాహ్న", kn:"ಸಾಯಾಹ್ನ", ta:"சாயாஹ்ன" },
      "Pratah":   { en:"Pratah",   hi:"प्रातः",      te:"ప్రాతః", kn:"ಪ್ರಾತಃ", ta:"பிராத" }
    },
    /* Tarabala — the nine taras, and their verdicts. Rendered as
       "Janma · Not Good" in Latin on a Telugu screen because no table existed:
       the same shape as choghadiya before the bridge, on a screen the gate was
       not testing. Keyed by what the engine emits. */
    tara: {
      "Janma":     { en:"Janma",     hi:"जन्म",      te:"జన్మ", kn:"ಜನ್ಮ", ta:"ஜென்ம" },
      "Sampata":   { en:"Sampata",   hi:"संपत",      te:"సంపత్", kn:"ಸಂಪತ್", ta:"சம்பத்" },
      "Vipata":    { en:"Vipata",    hi:"विपत",      te:"విపత్", kn:"ವಿಪತ್", ta:"விபத்" },
      "Kshema":    { en:"Kshema",    hi:"क्षेम",     te:"క్షేమ", kn:"ಕ್ಷೇಮ", ta:"க்ஷேம" },
      "Pratyari":  { en:"Pratyari",  hi:"प्रत्यरि",  te:"ప్రత్యరి", kn:"ಪ್ರತ್ಯರಿ", ta:"பிரத்யரி" },
      "Sadhaka":   { en:"Sadhaka",   hi:"साधक",      te:"సాధక", kn:"ಸಾಧಕ", ta:"சாதக" },
      "Naidhana":  { en:"Naidhana",  hi:"नैधन",      te:"నైధన", kn:"ನೈಧನ", ta:"நைதன" },
      "Mitra":     { en:"Mitra",     hi:"मित्र",     te:"మిత్ర", kn:"ಮಿತ್ರ", ta:"மித்ர" },
      "Param Mitra":{en:"Param Mitra",hi:"परम मित्र",te:"పరమ మిత్ర", kn:"ಪರಮ ಮಿತ್ರ", ta:"பரம மித்ர" }
    },
    taraVerdict: {
      "Very Good":   { en:"Very Good",   hi:"बहुत शुभ",   te:"చాలా శుభం", kn:"ತುಂಬಾ ಶುಭ", ta:"மிகவும் சுபம்" },
      "Good":        { en:"Good",        hi:"शुभ",        te:"శుభం", kn:"ಶುಭ", ta:"சுபம்" },
      "Not Good":    { en:"Not Good",    hi:"अशुभ",       te:"అశుభం", kn:"ಅಶುಭ", ta:"அசுபம்" },
      "Bad":         { en:"Bad",         hi:"बुरा",       te:"చెడు", kn:"ಕೆಟ್ಟದು", ta:"கெட்டது" },
      "Totally Bad": { en:"Totally Bad", hi:"पूर्ण अशुभ", te:"పూర్తిగా అశుభం", kn:"ಸಂಪೂರ್ಣ ಅಶುಭ", ta:"முழுக்க அசுபம்" }
    },
    /* Rashi quality on the Lagna table — Movable / Fixed / Dual. */
    rashiQuality: {
      "Movable": { en:"Movable", hi:"चर",    te:"చర", kn:"ಚರ", ta:"சர" },
      "Fixed":   { en:"Fixed",   hi:"स्थिर", te:"స్థిర", kn:"ಸ್ಥಿರ", ta:"ஸ்திர" },
      "Dual":    { en:"Dual",    hi:"द्विस्वभाव", te:"ద్విస్వభావ", kn:"ದ್ವಿಸ್ವಭಾವ", ta:"உபய" }
    },
    disha: {
      "East":      { en:"East",      hi:"पूर्व",     te:"తూర్పు", kn:"ಪೂರ್ವ", ta:"கிழக்கு" },
      "West":      { en:"West",      hi:"पश्चिम",    te:"పడమర", kn:"ಪಶ್ಚಿಮ", ta:"மேற்கு" },
      "North":     { en:"North",     hi:"उत्तर",     te:"ఉత్తరం", kn:"ಉತ್ತರ", ta:"வடக்கு" },
      "South":     { en:"South",     hi:"दक्षिण",    te:"దక్షిణం", kn:"ದಕ್ಷಿಣ", ta:"தெற்கு" },
      "North-East":{ en:"North-East",hi:"ईशान",     te:"ఈశాన్యం", kn:"ಈಶಾನ್ಯ", ta:"வடகிழக்கு" },
      "North-West":{ en:"North-West",hi:"वायव्य",    te:"వాయవ్యం", kn:"ವಾಯವ್ಯ", ta:"வடமேற்கு" },
      "South-East":{ en:"South-East",hi:"आग्नेय",    te:"ఆగ్నేయం", kn:"ಆಗ್ನೇಯ", ta:"தென்கிழக்கு" },
      "South-West":{ en:"South-West",hi:"नैऋत्य",    te:"నైరుతి", kn:"ನೈಋತ್ಯ", ta:"தென்மேற்கு" }
    },
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
