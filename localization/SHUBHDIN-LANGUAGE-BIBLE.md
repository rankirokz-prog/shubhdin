# SHUBHDIN LANGUAGE BIBLE
### The localization constitution for all Shubh Din content
**Version 2.4 · Created on Fable 5 · Status: GOVERNING DOCUMENT — read before any localization work**
**v1.1 changelog:** Hindi Love report scored 9.4–9.6/10 (up from 8.2). Added §H5 rulings and §10 Indic typography law.
**v2.5 changelog:** Added §9.3 Tamil Constitution — language 5. Native Tamil review still required before go-live (Ram is not a native Tamil speaker).
**v2.4 changelog:** Added §9.2 Kannada Constitution — language 4.
**v2.3 changelog:** §17 added — never text-extract JS string literals containing \\uXXXX escapes; and the free Kundli Hindi still needs the full Bible rewrite.
**v2.2 changelog:** §16 — the harness now scans the RENDERED OUTPUT for English, exactly as the native reviewer does. This closes the recurring-leak pattern at its root.
**v2.1 changelog:** §15 added — every report must pass `node test-reports.js`, which executes the real page script in every language. Data-level checks are insufficient.
**v2.0 changelog:** §13 refined (mantra label follows report language) and §14.1 added — the audit must catch FIELD-REFERENCE ternaries, not just quoted literals.
**v1.9 changelog:** §12 extended — engine ARRAY data indexed by [LANG] is a fourth source of text and a crash risk, not just a translation gap.
**v1.8 changelog:** Fallback chain CHANGED to lang→en→hi (§1.4 rationale) and §14 stale-file detection added, after a stale content file rendered a Telugu report in Hindi.
**v1.7 changelog:** §13 — mantras and their deity labels are never localized (native-reviewer ruling).
**v1.6 changelog:** §12.3 — SD_UI is now INLINED into each report page by embed-ui.js; no separate upload exists to forget. Two rounds of review were spent reviewing the English fallback because ui-strings.js never reached the server.
**v1.5 changelog:** §12.2 added — localization helpers must degrade to English, never to blank; a missing shared file must be loud, not silent.
**v1.4 changelog:** Telugu review (7.8–8.2) exposed that ~35% of a report is NOT in content.js — added §12 THREE SOURCES OF TEXT + the ui-strings.js terms/UI layer.
**v1.3 changelog:** Added §9.1 Telugu Constitution (గ్రాంథిక vs వ్యావహారిక — Telugu's equivalent of the शुद्ध-हिंदी trap) and §11 variation-pool design for cross-report phrase repetition.
**v1.2 changelog:** Root cause of broken Devanagari found — Latin-first font stacks force per-character fallback. §10 rewritten with the definitive fix + loanword ruling (प्राइवेट सेक्टर).

---

## 0. THE FIRST LAW

> **We never translate. We localize.**
>
> Every piece of content is REWRITTEN by (or as) a native writer of the target
> language, using the English text only as a *meaning source*. English sentence
> structure, idioms, and emotional phrasing are to be IGNORED. The output must
> read as if it was originally composed in the target language for that
> language's reader.

The test for every paragraph: *"Would a native writer, given only the meaning,
have written this sentence?"* If no — rewrite it.

**The canonical failure example (never repeat this pattern):**
- English: *"You communicate beautifully."*
- Translation (WRONG): *"आप सुंदर संवाद करते हैं।"* ← grammatically fine, humanly dead
- Localization (RIGHT): *"आप दिल की बात खुलकर कह पाते हैं।"* ← same meaning, native soul

---

## 1. ARCHITECTURE RULES (apply to every language)

1. **English is the canonical source.** All meaning originates in
   `master-strings.en.json`. Other languages derive from it, never from each other.
2. **Engine and language never mix.** All prose lives in content files keyed by
   stable IDs. The engine computes; content files speak. No language logic in
   panchang-engine.js, ever.
3. **One source of truth per language:** `master-strings.<lang>.json`, regenerated
   into `*-content.<lang>.js` files by script. Hand-editing generated JS files is
   forbidden — edit the master JSON, regenerate.
4. **Fallback chain:** chosen language → **English** → Hindi. A missing key must
   never crash or show blank; it falls back.
   *(Changed in v1.8. Falling back to Hindi made a Telugu report render as Hindi,
   which reads as a wrong-language bug rather than a missing string. English is
   universally legible to the audience; another Indic script is not.)*
5. **Terms dictionary is separate from prose.** Planet names, rashi names,
   dignities, weekdays, months, and UI labels live in a per-language TERMS table
   (~100 entries, hand-curated once). Prose blocks reference meaning; the terms
   table guarantees no English leaks like "Venus · Tula (Own Sign)".
6. **Delta discipline:** any new content added in future sessions goes into master
   EN first. A checker script lists missing keys per language. Translations never
   silently fall behind.
7. **Paid reports first.** Phase 1 scope = the seven paid reports (Love, Marriage,
   Career, Muhurta, Annual, Life Roadmap, Child). Free Kundli (~400 blocks) is
   localized ONLY after the pipeline is proven on the paid set, so any style
   discovery costs a 250-block redo, not 650.

---

## 2. AUDIENCE PERSONA (all languages)

A 22–35 year old in a Tier-1/Tier-2 city (Delhi, Lucknow, Indore, Hyderabad,
Vijayawada, Pune, Kolkata...). Smartphone-first. Devotional but modern. Reads
their language the way people actually speak it — mixed with everyday English
tech words. They should feel the report was **written for them**, not translated
at them.

---

## 3. TONE CONSTITUTION (all languages)

- **Warm** — like a wise, affectionate elder who is happy for you
- **Hopeful** — every challenge is paired with agency and remedy
- **Respectful** — of the tradition, of the reader, of their intelligence
- **Never fear-based** — no doom, no dosha-terror, no "your stars are against you"
- **Honest** — mixed results stay mixed; we never inflate (this is the brand)
- **Modern-devotional register** — reverent about astrology, conversational about life

---

## 4. UNIVERSAL KEEP-IN-ENGLISH LIST

These stay in Latin script in every language (young India reads them natively):

- **DNA** (as in "Love DNA" / "प्रेम DNA")
- **PDF**
- **Score** (when used as a UI element; prose may use native equivalents)
- **Dashboard**
- App/product names: **Shubh Din**, **shubhdin.app**
- Numerals: always Arabic digits (1, 2, 3 — never देवनागरी अंक)

---

## 5. UNIVERSAL KEEP-IN-SANSKRIT LIST (astrology terms)

These are the premium vocabulary of Jyotish. They stay Sanskrit in EVERY Indian
language (with native script rendering):

कुंडली · लग्न · दशा · अंतर्दशा · गोचर · भाव · राशि · नक्षत्र · योग · दोष ·
मुहूर्त · तिथि · वार · करण · पंचांग · वर्षफल · मुंथा · वर्षेश · नवांश ·
सप्तांश · दशांश · अष्टकवर्ग · गुण मिलान · मंगल दोष · साढ़े साती · तारा बल ·
चंद्र बल · अभिजित · अमृत काल · महादशा

Planet names: सूर्य · चंद्र · मंगल · बुध · गुरु · शुक्र · शनि · राहु · केतु

**The rule:** astrology Sanskrit sounds premium. Conversational Sanskrit sounds
like a literature exam. Keep the first, kill the second.

---

# ═══════════════ HINDI CONSTITUTION ═══════════════
### (The reference implementation — other languages follow this template)

## H1. AVOID LIST (शुद्ध-हिंदी words that killed the 8.2 score)

Never use these in prose. Each with its everyday replacement:

| ❌ Avoid | ✅ Use instead |
|---|---|
| प्रणय | प्यार / प्रेम |
| उत्कटता | जोश / गहराई |
| सुभेद्यता | खुलापन / दिल खोलना |
| अंतरंगता | नज़दीकी / गहरा रिश्ता |
| विस्मय | हैरानी / आश्चर्य (or drop) |
| उष्मा से बहता है | (rewrite entirely — see H3) |
| विकास-किनारा | प्रेम में सीख / जहाँ आप और बेहतर हो सकते हैं |
| संवाद करते हैं | बात कह पाते हैं / खुलकर बात करते हैं |
| अभिव्यंजक | खुलकर बोलने वाला |
| सहजबोध | अंदर से समझना / महसूस कर लेना |
| कार्यसाध्य | ठीक-ठाक / काम चलाने लायक |
| परिहार (in user-facing prose) | दोष का कटना / दोष समाप्त होना (keep परिहार only in table headers) |

**General rule:** if a 26-year-old in Indore would have to pause and decode the
word, replace it.

## H2. PREFERRED EVERYDAY VOCABULARY

The words modern Hindi speakers actually use — build sentences from these:

प्यार · रिश्ता · भावनाएँ · बातचीत · भरोसा · समझ · साथ · दिल · अपनापन ·
ख़ुशी · सुकून · मज़बूत · ईमानदारी · परवाह · अहसास · जुड़ाव · ज़िंदगी ·
सही समय · अच्छे दिन · शुभ संकेत · मन

## H3. FEW-SHOT EXAMPLES (the constitution's case law — use verbatim in prompts)

**Example 1 — headline:**
- ❌ अपना संबंध व्यक्तित्व जानें
- ✅ जानिए आपका प्रेम व्यक्तित्व  *(or)*  आपका प्रेम व्यक्तित्व कैसा है?

**Example 2 — astrology statement:**
- ❌ प्रेम आपकी कुंडली में उष्मा से बहता है
- ✅ आपकी कुंडली में प्रेम के प्रबल योग हैं।  *(or)*  आपकी कुंडली प्रेम के लिए अत्यंत शुभ संकेत देती है।
- *Lesson: astrology statements should SOUND like astrology (योग, शुभ संकेत), not like translated poetry.*

**Example 3 — poetic metaphor:**
- ❌ आप वैसे प्रेम करते हैं जैसे पवन प्रेम करती है...
- ✅ आपके लिए प्यार की शुरुआत अच्छी बातचीत से होती है।
- *Lesson: relatable beats poetic. If a metaphor needs decoding, replace it with the plain truth it was decorating.*

**Example 4 — section title:**
- ❌ आपका विकास-किनारा
- ✅ प्रेम में सीख  *(or)*  जहाँ आपको बढ़ने की ज़रूरत है

**Example 5 — trait sentence:**
- ❌ आप सुंदर संवाद करते हैं।
- ✅ आप दिल की बात खुलकर कह पाते हैं।

**Example 6 — section title:**
- ❌ जिसे आप पाने को हैं
- ✅ आपका आदर्श साथी  *(or)*  कैसा होगा आपका जीवनसाथी

**Example 7 — KEEP decisions (don't over-localize):**
- ✅ आपका प्रेम DNA — KEEP (young India reads DNA natively)
- ✅ प्रेम कब खिलता है — KEEP (naturally beautiful Hindi, not translationese)

**Example 8 — chemistry section title:**
- ❌ प्रणय रसायन
- ✅ आपका प्रेम स्वभाव  *(or)*  आपका प्रेम संतुलन

## H5. REVIEW ROUND 2 RULINGS (from 9.4–9.6 scoring pass)

Additional avoid/prefer pairs discovered in the Love report review:

| ❌ Avoid | ✅ Use instead | Why |
|---|---|---|
| बली | मज़बूत / बलवान | "बली" is uncommon in everyday Hindi |
| प्रेम कथा | प्रेम कहानी / लव स्टोरी / प्रेम यात्रा | "कथा" reads literary/formal |
| प्रेम में सीख | आपके लिए एक सलाह / प्रेम में क्या सीखना है | warmer, less instructional |

**Confirmed-good patterns to reuse in all future Hindi work** (reviewer praised
these explicitly — treat as positive case law):
- `आपकी कुंडली में प्रेम के प्रबल योग हैं।` — astrology register done right
- `आपके लिए प्यार की शुरुआत अच्छी बातचीत से होती है।` — sounds like a real person
- `कुछ समय ऐसे होते हैं जब सितारे प्यार के लिए ख़ास मेहरबान रहते हैं।` — natural warmth
- `आपका प्रेम DNA` — keep English loanwords young readers already use
- `जानिए आपका प्रेम व्यक्तित्व` — imperative "जानिए" beats noun-phrase headlines

## H4. LOCALIZED TERMS TABLE (spec — fixes "Venus · Tula (Own Sign)" leaks)

Hand-curated once, used by all reports:

- Planets: Venus→शुक्र, Moon→चंद्र, ... (all 9)
- Dignities: Own Sign→स्वराशि, Exalted→उच्च, Debilitated→नीच, Neutral→सम
- house N → भाव N
- Weekdays, months, paksha (शुक्ल/कृष्ण), star-labels (Strong→प्रबल, Moderate→मध्यम, Mild→अल्प)
- Verdict words: Excellent→उत्तम, Very Good→अति शुभ, Favourable→अनुकूल, Take care→सावधानी

---

## 6. THE REWRITE PROMPT TEMPLATE (use for every batch, every language)

```
You are a native <LANGUAGE> content writer for Shubh Din, a devotional
astrology app. You are NOT a translator.

Below are content blocks. For each, you receive the MEANING in English.
IGNORE the English sentence structure completely. Rewrite each block
naturally, as if you were composing it originally in <LANGUAGE> for a
25-year-old reader in <CITY EXAMPLES>.

Follow the ShubhDin Language Bible strictly:
- Tone: warm, hopeful, respectful, never fear-based, honest.
- KEEP in English: DNA, PDF, Score, Dashboard, digits.
- KEEP in Sanskrit: all astrology terms (कुंडली, दशा, गोचर, भाव, ...).
- AVOID these words entirely: <language avoid-list>.
- PREFER this everyday vocabulary: <language prefer-list>.
- Match these examples of right vs wrong: <language few-shots verbatim>.

Context for tone: these blocks belong to the <REPORT NAME> report,
section: <SECTION>. (Love = warm/romantic; Career = crisp/confident;
Child = tender/hopeful; Muhurta/Annual = reverent/practical.)

Return STRICT JSON: { "<key>": "<rewritten text>", ... }
Same keys, nothing added, nothing omitted. No markdown, no commentary.
```

---

## 7. HUMAN REVIEW PROTOCOL (per language)

Reviewer = native READER with good taste (not an astrologer). Their brief:
*"Mark every line that sounds translated, bookish, or unnatural. Suggest how
you'd say it."* Checklist:
1. Does each paragraph pass the First Law test?
2. Any avoid-list words that slipped through?
3. Any English leaks outside the keep-list?
4. Does astrology still sound like astrology (योग/दशा/शुभ संकेत register)?
5. Is every challenge still paired with hope/agency (tone constitution)?

Reviewer feedback → update THIS document (new avoid entries, new few-shots) →
regenerate affected blocks. The Bible is living; version it (1.0 → 1.1 ...).

## 8. LANGUAGE ROLLOUT ORDER

1. **Hindi** — flagship, already shipped, biggest quality gap to close (8.2→9.8)
2. **Telugu** — home market; Ram is the native reviewer (zero review cost, fastest validation of the whole pipeline)
3. Tamil · Kannada · Marathi · Bengali — by user analytics
- English remains canonical source, always.

---

## 10. INDIC TYPOGRAPHY LAW (applies to ALL Indian languages)

### 10.1 The root cause of broken conjuncts

**Never let a font without the target script sit first in a `font-family` stack.**

If a Latin display font (e.g. `'Cormorant Garamond'`) precedes the Indic font,
the browser performs **per-character fallback**. A syllable cluster then gets
shaped across two font runs and splits apart:

- करियर → "करि यर" · बातचीत → "बा तची त" · विवाह → "वि वा ह" · धार्मिक → "धा र्मि क"

Adding the Indic font *after* the Latin one does NOT fix this — the Latin font
must not apply to Indic text at all.

### 10.2 The definitive fix (implemented in all 8 reports)

1. Tag the rendered report with a language class and `lang` attribute:
   `rep.className='lang-hi'; rep.setAttribute('lang','hi');`
2. In that mode, force ONE complete Indic font on every element:
   `#report.lang-hi, #report.lang-hi *{font-family:'Noto Serif Devanagari','Nirmala UI','Mangal',serif !important;}`
3. In the same rule, neutralise everything that can insert space inside a
   cluster: `letter-spacing:normal`, `word-spacing:normal`, `word-break:normal`,
   `overflow-wrap:normal`.
4. `font-synthesis:none` — faux-bold synthesis can break conjunct shaping.
5. Avoid `text-align:justify` for Indic prose (use `left`).
6. Repeat the rule inside `@media print` — print engines re-resolve fonts.
7. Wait for webfonts before printing: `document.fonts.ready.then(...window.print())`.
   An unloaded font makes the PDF engine substitute and break shaping.
8. `letter-spacing` may remain ONLY on pure-symbol spans (★★★☆☆).

### 10.3 Per-language font (when adding a language)

Load the matching Noto family and repeat 10.2: Devanagari (Hindi, Marathi),
Noto Serif Telugu, Kannada, Tamil, Bengali.

### 10.4 Loanword ruling

Where an English term is what users actually think in, keep the loanword in
native script rather than coining pure-Sanskrit equivalents:

- ❌ निजी क्षेत्र अनुकूलता → ✅ **प्राइवेट सेक्टर में सफलता**
- ❌ शासकीय अनुकूलता → ✅ **सरकारी नौकरी में सफलता**
- Also natural: सर्टिफ़िकेशन, प्रमोशन, कमिटमेंट, रोमांस, DNA, PDF

---

## 9.1 TELUGU CONSTITUTION (తెలుగు)

**Reviewer: Ram (native speaker) — zero review cost, fastest validation loop.**

### T1. The Telugu trap: గ్రాంథిక vs వ్యావహారిక

Telugu has a formal literary register (గ్రాంథిక) and a spoken/modern register
(వ్యావహారిక). Writing గ్రాంథిక is *exactly* the same mistake as over-Sanskritised
Hindi — technically correct, humanly cold. **All Shubh Din prose uses వ్యావహారిక.**

| ❌ Avoid (గ్రాంథిక) | ✅ Use (వ్యావహారిక) |
|---|---|
| కలదు / గలదు | ఉంది |
| చున్నది / యున్నది | ఉంది / అవుతోంది |
| ఒసగును | ఇస్తుంది |
| ప్రణయము | ప్రేమ |
| హృదయము | గుండె / మనసు |
| -ము endings (ప్రేమము, బంధము) | -ం endings (ప్రేమ, బంధం) |
| వివాహము | పెళ్లి (prose) / వివాహం (formal headings) |
| సంభాషణము | మాటలు / మాట్లాడటం |
| ధనము | డబ్బు |
| అభిలాష | కోరిక |

**Rule of thumb:** if it sounds like a 1950s Telugu textbook or a stage drama,
rewrite it the way a Hyderabad or Vijayawada 26-year-old would actually say it.

### T2. Preferred everyday vocabulary

ప్రేమ · బంధం · అనుబంధం · నమ్మకం · మనసు · గుండె · మాటలు · కలిసి · తోడు ·
జీవితం · ఆనందం · అర్థం చేసుకోవడం · భరోసా · ఓపిక · మంచి సమయం · అదృష్టం

### T3. Keep in Sanskrit (astrology register — sounds premium in Telugu too)

జాతకం · లగ్నం · దశ · అంతర్దశ · గోచారం · భావం · రాశి · నక్షత్రం · యోగం · దోషం ·
ముహూర్తం · తిథి · వారం · పంచాంగం · వర్షఫలం · నవాంశ · సప్తాంశ · దశాంశ ·
అష్టకవర్గం · గుణ మిలనం · తారాబలం · చంద్రబలం

Planets: సూర్యుడు · చంద్రుడు · కుజుడు · బుధుడు · గురువు · శుక్రుడు · శని · రాహువు · కేతువు

*Note:* Telugu speakers say **జాతకం** far more naturally than కుండలి for the
birth chart — prefer జాతకం in prose, జాతక చక్రం for the diagram.

### T4. Keep in English (same as universal list, plus)

DNA · PDF · Score · Dashboard · ప్రైవేట్ · సెక్టార్ · ప్రమోషన్ · సర్టిఫికేషన్ ·
కమిట్‌మెంట్ · రొమాన్స్ — young Telugu speakers use these daily; coining pure
Telugu equivalents sounds stilted (mirrors Hindi ruling §10.4).

### T5. Few-shot examples

- ❌ మీ జాతకమునందు ప్రేమ యోగములు కలవు → ✅ **మీ జాతకంలో ప్రేమకు మంచి యోగాలు ఉన్నాయి.**
- ❌ మీరు సుందరముగా సంభాషించెదరు → ✅ **మీ మనసులో ఉన్నది మీరు స్పష్టంగా చెప్పగలరు.**
- ❌ ప్రణయ రసాయనము → ✅ **మీ ప్రేమ స్వభావం**
- ❌ మీరు వాయువు ప్రేమించునట్లు ప్రేమింతురు → ✅ **మీకు ప్రేమ మంచి మాటలతో మొదలవుతుంది.**

### T6. Typography

Load `Noto Serif Telugu`; apply §10.2's single-font rule with `lang-te`.
Telugu also breaks under per-character fallback — same law applies.

---

## 9.2 KANNADA CONSTITUTION (ಕನ್ನಡ)

### K1. The Kannada trap: ಗ್ರಾಂಥಿಕ vs ಆಡುಮಾತು

Kannada has a literary/written register (ಗ್ರಾಂಥಿಕ) and the spoken register
(ಆಡುಮಾತು / ವ್ಯಾವಹಾರಿಕ). Written Kannada in newspapers and books is *already*
fairly formal, so the trap here is subtler than in Hindi or Telugu: it is not
archaic verb forms so much as **piling on Sanskrit tatsama words where a native
Kannada word exists**. All Shubh Din prose uses everyday written Kannada.

| ❌ Avoid (over-Sanskritised / archaic) | ✅ Use (everyday Kannada) |
|---|---|
| ಹೃದಯ (in prose) | ಮನಸ್ಸು / ಎದೆ |
| ಪ್ರಣಯ | ಪ್ರೀತಿ |
| ಧನ (in prose) | ಹಣ |
| ವಿವಾಹ (in prose) | ಮದುವೆ |
| ಸಂಭಾಷಣೆ | ಮಾತು / ಮಾತುಕತೆ |
| ಗೃಹ | ಮನೆ |
| ಪುತ್ರ / ಸಂತತಿ | ಮಕ್ಕಳು |
| ಕಾರ್ಯ | ಕೆಲಸ |
| ಇರ್ಪುದು / ಗೈಯ್ಯುವುದು / ಒಪ್ಪುವುದು (archaic) | ಇದೆ / ಮಾಡುವುದು |
| ಆಗಿರ್ಪುದು | ಆಗಿದೆ |
| ಅಭಿಲಾಷೆ | ಆಸೆ |
| ಶ್ರವಣ (as "listening") | ಕೇಳುವುದು |

**Rule of thumb:** if it reads like a textbook or a temple inscription rather
than a well-written Kannada newspaper feature, rewrite it.

### K2. Preferred everyday vocabulary

ಪ್ರೀತಿ · ಬಂಧ · ಸಂಬಂಧ · ನಂಬಿಕೆ · ಮನಸ್ಸು · ಮಾತು · ಜೊತೆ · ಬದುಕು · ಸಂತೋಷ ·
ಅರ್ಥ ಮಾಡಿಕೊಳ್ಳುವುದು · ಭರವಸೆ · ತಾಳ್ಮೆ · ಒಳ್ಳೆಯ ಸಮಯ · ಅದೃಷ್ಟ · ಶಕ್ತಿ · ಬೆಳವಣಿಗೆ

### K3. Keep in Sanskrit (astrology register — premium in Kannada too)

ಜಾತಕ · ಲಗ್ನ · ದಶಾ · ಅಂತರ್ದಶಾ · ಗೋಚಾರ · ಭಾವ · ರಾಶಿ · ನಕ್ಷತ್ರ · ಯೋಗ · ದೋಷ ·
ಮುಹೂರ್ತ · ತಿಥಿ · ವಾರ · ಪಂಚಾಂಗ · ವರ್ಷಫಲ · ನವಾಂಶ · ಸಪ್ತಾಂಶ · ದಶಾಂಶ ·
ಅಷ್ಟಕವರ್ಗ · ಗುಣ ಮಿಲನ · ತಾರಾಬಲ · ಚಂದ್ರಬಲ

Planets: ಸೂರ್ಯ · ಚಂದ್ರ · ಕುಜ · ಬುಧ · ಗುರು · ಶುಕ್ರ · ಶನಿ · ರಾಹು · ಕೇತು

*Note:* Kannada speakers say **ಜಾತಕ** for the birth chart (as in Telugu), not
ಕುಂಡಲಿ — prefer ಜಾತಕ in prose, ಜಾತಕ ಚಕ್ರ for the diagram.

### K4. Keep in English

DNA · PDF · Score · ಪ್ರೈವೇಟ್ · ಸೆಕ್ಟರ್ · ಪ್ರಮೋಷನ್ · ಸರ್ಟಿಫಿಕೇಶನ್ ·
ಕಮಿಟ್‌ಮೆಂಟ್ · ರೊಮ್ಯಾನ್ಸ್ — young Kannada speakers use these daily.

### K5. Few-shot examples

- ❌ ನಿಮ್ಮ ಜಾತಕದಲ್ಲಿ ಪ್ರಣಯ ಯೋಗಂಗಳು ಇರ್ಪುವು → ✅ **ನಿಮ್ಮ ಜಾತಕದಲ್ಲಿ ಪ್ರೀತಿಗೆ ಒಳ್ಳೆಯ ಯೋಗಗಳಿವೆ.**
- ❌ ನೀವು ಸುಂದರವಾಗಿ ಸಂಭಾಷಿಸುವಿರಿ → ✅ **ನಿಮ್ಮ ಮನಸ್ಸಿನಲ್ಲಿ ಇರುವುದನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಬಲ್ಲಿರಿ.**
- ❌ ಪ್ರಣಯ ರಸಾಯನ → ✅ **ನಿಮ್ಮ ಪ್ರೀತಿಯ ಸ್ವಭಾವ**
- ❌ ವಾಯುವಿನಂತೆ ಪ್ರೇಮಿಸುವಿರಿ → ✅ **ನಿಮ್ಮ ಪ್ರೀತಿ ಒಳ್ಳೆಯ ಮಾತುಕತೆಯಿಂದ ಶುರುವಾಗುತ್ತದೆ.**

### K6. Typography

Load `Noto Serif Kannada`; apply §10.2's single-font rule with `lang-kn`.
Kannada breaks under per-character fallback exactly like Devanagari and Telugu.

---

## 9.3 TAMIL CONSTITUTION (தமிழ்)

**Reviewer: Ram is NOT a native Tamil speaker. The harness zero-leak pass is
necessary but not sufficient — a native Tamil eye must review rendered PDFs
before go-live. Flag every Tamil report "harness-clean, awaiting native review."**

### T1. The Tamil trap: செந்தமிழ் vs நடைமுறைத் தமிழ்

Tamil has the widest literary/spoken gap of the four languages. High literary
Tamil (செந்தமிழ்) piles on archaic verb endings (உளது · ஆகும் · ஆகியுள்ளது) and
Sanskrit tatsama, while Tamil also has a proud native-word tradition, so
over-Sanskritising reads as alien. All Shubh Din prose uses everyday written
Tamil — the warm, clear register of a good Ananda Vikatan / Dinamani feature.

| ❌ Avoid (over-literary / over-Sanskritised) | ✅ Use (everyday Tamil) |
|---|---|
| இதயம் (in prose) | மனசு / மனம் |
| பிரணயம் / காதல் ரசாயனம் | காதல் / அன்பு |
| தனம் (in prose for money) | பணம் |
| விவாகம் (in prose) | திருமணம் / கல்யாணம் |
| சம்பாஷணை | பேச்சு / உரையாடல் |
| கிருஹம் / மனை (archaic) | வீடு |
| புத்திரன் / சந்ததி | குழந்தைகள் / பிள்ளைகள் |
| கார்யம் | வேலை |
| உளது / ஆகியுள்ளது (piled archaic) | இருக்கிறது |
| அபிலாஷை | ஆசை |

**Rule of thumb:** if it reads like a palm-leaf grantha or a government gazette
rather than a warm magazine feature, rewrite it.

### T2. Preferred everyday vocabulary

காதல் · அன்பு · பிணைப்பு · உறவு · நம்பிக்கை · மனசு · பேச்சு · உடன் · வாழ்க்கை ·
சந்தோஷம் · புரிந்துகொள்வது · பொறுமை · நல்ல நேரம் · அதிர்ஷ்டம் · ஆற்றல் · வளர்ச்சி

### T3. Keep in Tamil astrology register (Sanskrit-derived but naturalised)

ஜாதகம் · லக்னம் · தசை · அந்தர்தசை · கோசாரம் · பாவம் / ஸ்தானம் · ராசி · நட்சத்திரம் ·
யோகம் · தோஷம் · முகூர்த்தம் · திதி · வாரம் · பஞ்சாங்கம் · வர்ஷபலன் · நவாம்சம் ·
அஷ்டகவர்க்கம் · பொருத்தம் / குண மிலனம் · தாராபலம் · சந்திரபலம்

**Planets — use the common Tamil names, NOT Sanskrit குஜ/மங்கள்:**
சூரியன் · சந்திரன் · செவ்வாய் · புதன் · குரு · சுக்கிரன் · சனி · ராகு · கேது

**CRITICAL — Tamil nakshatra names are traditionally DIFFERENT, not Sanskrit
transliterations.** Use the Tamil names:
அசுவினி · பரணி · கார்த்திகை · ரோகிணி · மிருகசீரிடம் · திருவாதிரை · புனர்பூசம் ·
பூசம் · ஆயில்யம் · மகம் · பூரம் · உத்திரம் · அஸ்தம் · சித்திரை · சுவாதி · விசாகம் ·
அனுஷம் · கேட்டை · மூலம் · பூராடம் · உத்திராடம் · திருவோணம் · அவிட்டம் · சதயம் ·
பூரட்டாதி · உத்திரட்டாதி · ரேவதி

**Weekdays — native Tamil:** ஞாயிறு · திங்கள் · செவ்வாய் · புதன் · வியாழன் · வெள்ளி · சனி

*Note:* Tamil uses **ஜாதகம்** for the birth chart, **ராசி** for the sign,
**ஜாதக சக்கரம்** for the diagram. For marriage matching, **பொருத்தம்** is the
everyday Tamil word; the app's 8-koota guna-milan is shown as குண மிலனம் / பொருத்தம்.

### T4. Keep in English

DNA · PDF · Score · ப்ரைவேட் · செக்டர் · ப்ரமோஷன் · சர்டிஃபிகேஷன் · கமிட்மென்ட் ·
ரொமான்ஸ் — young Tamil speakers use these daily.

### T5. Few-shot examples

- ❌ உங்கள் ஜாதகத்தில் பிரணய யோகங்கள் உள்ளன → ✅ **உங்கள் ஜாதகத்தில் காதலுக்கு நல்ல யோகங்கள் இருக்கின்றன.**
- ❌ நீங்கள் அழகாக சம்பாஷிப்பீர்கள் → ✅ **மனசில் இருப்பதை தெளிவாகச் சொல்லத் தெரிந்தவர் நீங்கள்.**
- ❌ காதல் ரசாயனம் → ✅ **உங்கள் காதலின் சுபாவம்**
- ❌ வாயுவைப் போல் பிரேமிப்பீர்கள் → ✅ **உங்கள் காதல் நல்ல புரிதலோடு தொடங்கும்.**

### T6. Typography

Load `Noto Serif Tamil`; apply §10.2's single-font rule with `lang-ta`. Tamil
breaks under Latin-first per-character fallback like the other Indic scripts, and
relies heavily on the pulli (்) — ensure clusters (க்ஷ · ற்ற · ஞ்ச) render.

### T7. Review-round rulings (native Love pass)

- **Do not overuse அரவணைப்பு.** It is a distinctive/poetic word, so repetition
  across a report reads as "trying to sound poetic." Rotate with everyday
  alternatives: அன்பான · பாசமுள்ள · அக்கறையுள்ள · மனதைப் புரிந்துகொள்ளும் · and the
  verb அரவணைக்கும் (which is fine). Common words like அன்பு repeat invisibly.
- **Avoid காதல் பாய்கிறது** ("love flows") — forced. Prefer காதல் இயல்பாக மலர்கிறது,
  or காதலுக்கான நல்ல யோகங்கள் உள்ளன.
- **Avoid literary நிலையாக(வும்)** in prose → use உறுதியாகவும் / நிலைத்ததாகவும்.
- Confirmed native and not to be "corrected": காதல் மொழி · காதல் சுபாவம் · the
  closing quote register.
- **Avoid the "X நேசிப்பது போல் நேசிக்கிறீர்கள்" calque** ("you love the way X
  loves") — it is English grammar. Use "X போல [adverbs] காதலிக்கிறீர்கள்" instead
  (e.g. காற்றைப் போல இலகுவாக நீங்கள் காதலிக்கிறீர்கள்).
- **பாய்/பாய்கிறது ("flows") is banned for abstract nouns** (love, attraction),
  everywhere — not just headlines → வெளிப்படுகின்றன · மலர்கின்றன · இருக்கிறது.
- **Use மனம் / மனதின் consistently throughout — not மனசு.** For a premium report
  மனம் reads elegant and neutral; mixing மனம் and மனசு within one report looks
  inconsistent. Oblique stem is மனத்-: மனம் · மனதின் · மனதில் · மனதை · மனதோடு ·
  மனமான · மனமே. (Supersedes the earlier headings-only split.) **Plural is மனங்கள், never மனம்கள்.**
- **Avoid "நீங்கள் நினைப்பதை விட அரிது"** (translated) → "இது பலர் நினைப்பதை விட
  அரிதான குணம்" / "எல்லோரிடமும் காணப்படும் குணமல்ல".
- **Avoid முன்செல்/முன்செல்வதற்கு** (calque of "move forward / proceed") →
  முன்னேறு · முன்னேறுவதற்கு முன் · திருமண முடிவை எடுப்பதற்கு முன்.
- **Method/verify lines:** prefer "இவை அனைத்தும் கணிக்கப்பட்ட தரவுகளின் அடிப்படையில்
  வழங்கப்படுகின்றன" over the blunt "எதுவும் கற்பனையல்ல".

---

## 9. TELUGU / TAMIL / KANNADA / MARATHI / BENGALI CONSTITUTIONS

*(To be authored per-language before that language's generation begins — same
template as the Hindi Constitution: avoid-list, prefer-list, few-shots, terms
table. The universal sections 0–7 already apply to all.)*

---
*This document is the constitution for every localization decision. When in
doubt: rewrite, don't translate; relatable beats poetic; astrology Sanskrit
stays, exam Sanskrit goes.*

## 11. VARIATION POOLS (planned — repeat-customer polish)

**Problem:** a customer buying several reports may meet the same sentence twice
(e.g. a "mixed year" line in Forecast and a similar band line in Annual). Not
wrong, but it weakens the feeling of a bespoke reading.

**Design (not yet implemented):**

1. A string value may be an **array of equivalent phrasings** instead of a single
   string, in the `-strings.<lang>.json` source:
   `"forecast.ratings.mixed.en": ["...", "...", "..."]`
2. Selection is **deterministic from the chart**, never random — e.g.
   `idx = (birthJulianDay + keyHash) % pool.length`. The same person regenerating
   the same report always sees identical text (trust), while different people —
   and the same person's *different* reports — see different phrasings.
3. Pools are only worth adding to high-frequency, cross-report keys: year/score
   band descriptions, generic action lines, closing lines. Never to
   chart-specific analysis, which is already unique.
4. Write 3 variants per pooled key, all obeying the same Constitution.

Reviewer-suggested Hindi variants to seed the "mixed year" pool:
*"यह वर्ष नए अनुभव देगा…"* · *"इस वर्ष धीरे-धीरे प्रगति होगी…"* ·
*"इस साल धैर्य सबसे बड़ा साथी रहेगा…"*

---


## 13. MANTRAS ARE NEVER LOCALIZED

Mantras stay in **Sanskrit, in Devanagari**, in every language edition — their
power is held to be in the exact sound, so transliterating or translating them
is both religiously wrong and commercially wrong (users expect the Sanskrit).

The **mantra text** never changes. The **deity label** attached to it follows the
report's language, using that language's name for the same deity (never a
translation of the planet's astronomical name):

- EN: `Guru — ॐ बृं बृहस्पतये नमः` (Sanskrit-romanized, not "Jupiter")
- HI: `गुरु — ॐ बृं बृहस्पतये नमः`
- TE: `గురువు — ॐ बृं बृहस्पतये नमः`

*(Revised in v2.0 on native-reviewer feedback: a Sanskrit-romanized label inside
an otherwise fully-Telugu report reads as an untranslated leftover. The deity is
the same; only its written form follows the reader.)* Implemented as
`SD_UI.mantraLabel[planet]`.

This applies to all nine graha mantras, Santan Gopal, and any stotra or
sankalpa text added later. **Only the surrounding guidance prose is localized.**

---


## 14. STALE-FILE DETECTION (fail loudly)

Three review rounds were lost to a file that never reached the server — twice
`ui-strings.js`, once `<report>-content.js`. In each case the page degraded
silently and the reviewer scored the fallback, not the work.

**Required in every report page:**
1. At generate time, probe a known key for the selected language:
   `if (LANG!=='en' && !SD_X.labels.title[LANG]) alert(...)`.
   The alert must **name the exact file** to upload and say the report will
   render in English until then.
2. Combined with the §1.4 chain (lang→en→hi), a stale file now produces
   *English + an explicit warning* — obviously wrong, never quietly wrong.
3. Shared data is inlined (§12.3), so the only per-report deployment artifacts
   are: `<report>-report.html` + `<report>-content.js`. Nothing else.

**Reviewer protocol:** if a review reports whole sections in the wrong language,
suspect deployment before translation. Ask for one screenshot of the cover; if
the inline-sourced strings are correct but content-sourced strings are not, the
content file is stale.

---

### 14.1 The audit must catch field-reference ternaries

The English-leak audit originally matched only ternaries ending in a **quoted
literal**: `LANG==='hi' ? 'हिंदी' : 'English'`. It missed the equally common
**field-reference** form:

```js
(LANG==='hi' ? hint.focusHi : hint.focusEn)   // Telugu data exists but is never read
```

This shipped an Annual report whose month grid showed English hints while the
rest of the page was Telugu — the `focusTe` values existed in the content file
and were simply never accessed.

**Both patterns must be swept:**
```
LANG==='hi'\s*\?\s*'[^']*'\s*:\s*'[^']*'                    # quoted literals
LANG==='hi'\s*\?\s*[\w.\[\]]*(?:Hi|hi)\s*:\s*[\w.\[\]]*(?:En|en)   # field references
```

**Correct fix:** a language-suffix helper, never a two-way ternary —
`hint[field + LangSuffix] || hint[field + 'En']`.

**Exception:** a field-reference ternary is acceptable *only* as the final
fallback inside an overlay expression, e.g.
`SD_UI.remedy[k][LANG] || (LANG==='hi' ? r.hi : r.en)`.

**And simulate the page's real access path.** My simulation read
`monthHint[k].focusTe` directly and passed, while the page read `focusEn`.
Simulations must replicate the page's actual helpers verbatim.

---


## 15. THE ONLY SUFFICIENT TEST: execute the real page

Three separate bug classes reached the reviewer despite passing my checks:

| Bug | Why data checks missed it |
|---|---|
| `CAREER_FIELDS[planet]['te']` undefined → crash | data existed; the *indexing* threw |
| `hint.focusEn` read instead of `focusTe` | data existed; the *access path* was wrong |
| `var U = SD_MUHURTA` shadowing the `U()` helper | helpers were correct in isolation; *scope* broke them |

Each was invisible to a check that inspected content files or re-implemented the
page's helpers. Only running the page's own code exposes them.

**`test-reports.js` is mandatory before any handoff.** It:
1. extracts each report's real inline + main `<script>`;
2. runs it inside `with(window){…}` — reproducing browser global scope, so
   shadowing and bare-global bugs behave exactly as in production;
3. stubs `document`/`window`, fills the real input IDs;
4. calls the page's own `setLang()`, `confirmStep()`, `generate()` for **every**
   supported language;
5. fails on any thrown error, any unexpected `alert()`, or an empty report.

`node test-reports.js` runs all reports; `node test-reports.js career` runs one.
**Adding a language means adding it to `LANGS` and re-running.** A syntax check,
a data audit, and a hand-written simulation are all necessary but none is
sufficient.

---


## 16. OUTPUT-LANGUAGE SCAN (why leaks kept recurring, and the fix)

Five rounds of native review each found English the previous fix missed. The
root cause was structural: **every check I ran verified a *source* of text
(content files, inline strings, engine data, scope), while the reviewer reads
the *output*.** Each newly-discovered source class leaked once before being
fixed: content → inline ternaries → title pairs → engine strings → engine
arrays → field-reference ternaries → scope shadowing → engine reason templates
→ date formatting → a role string the engine had never emitted in testing
("D7 5th lord").

The source list is open-ended. The output is not.

**Rule: `test-reports.js` scans the generated HTML of every non-English render
and FAILS on any Latin-script phrase** not on the allowlist (DNA, PDF, D-charts,
AM/PM, brand, user-typed names/places). The scan prints surrounding context so
single-word leaks are diagnosable. No report ships until the scan is clean in
every language.

Categories this forced into the terms table, now available to all languages:
muhurta reason templates (10) · panchaka types (5) · paksha (2) · koota names
(8) · parihara reason strings · localized short months + weekdays for date
formatting · mantra deity labels · the Dhanishta spelling alias (engine
spelling ≠ classical spelling — always take terms from engine output, never
from memory).

**Answer to "are we learning?":** each individual fix was real, but fixing
sources one at a time could never terminate — only checking the artifact the
reviewer checks could. That check now exists and runs before every handoff.

---


## 17. NEVER TEXT-EXTRACT JS ESCAPE SEQUENCES

Auto-extracting the Kundli page's 106 ternaries by **regex over the file text**
captured Hindi that was stored as JavaScript escapes (`\u0906\u092A…`) as
*literal characters*. Re-emitting them through an escaper that doubles
backslashes produced `\\u0906`, which renders on screen as the literal text
`\u0906`. 1070 strings shipped corrupted.

**Rules:**
1. To harvest strings from a page, **evaluate** the file (or decode escapes
   explicitly) — never treat `\uXXXX` as content.
2. After any generated-file write, grep for `\\u[0-9a-f]{4}`; a non-zero count
   is always a bug.
3. `test-reports.js` counts backslash-u sequences in rendered output — but the
   scan only catches Latin leaks, so a corrupted **Devanagari** string passes the
   language check. Grep the artifact as well as scanning the render.

## 18. FREE KUNDLI HINDI: STILL PRE-BIBLE

The seven paid reports had their Hindi **rewritten** under this Bible. The free
Kundli's Hindi is the *original* literary prose and was only ever extended, never
rewritten. A vocabulary scan found 37 literary/over-Sanskritised terms
(प्रणय ×12, मर्यादित ×5, परिष्कृत ×5, आजीवन ×4, सुदृढ़ ×3, स्व-आसन, शय्या,
द्विशुभ, चतुर्थांश …). Terminology also drifted (glossary headword पाद but body
पद — now consistent).

**This is the acquisition funnel and must read like the paid reports.**
Workflow: add keys to `report-strings.hi.json` → `node apply-kundli-hi.js` →
`node embed-ui.js all` → `node test-reports.js kundli`.

---
