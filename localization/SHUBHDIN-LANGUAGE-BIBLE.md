# SHUBHDIN LANGUAGE BIBLE
### The localization constitution for all Shubh Din content
**Version 1.3 · Created on Fable 5 · Status: GOVERNING DOCUMENT — read before any localization work**
**v1.1 changelog:** Hindi Love report scored 9.4–9.6/10 (up from 8.2). Added §H5 rulings and §10 Indic typography law.
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
4. **Fallback chain:** chosen language → Hindi → English. A missing key must never
   crash or show blank; it falls back.
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
