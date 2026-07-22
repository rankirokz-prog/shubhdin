# SHUBHDIN LANGUAGE BIBLE
### The localization constitution for all Shubh Din content
**Version 1.1 · Created on Fable 5 · Status: GOVERNING DOCUMENT — read before any localization work**
**v1.1 changelog:** Hindi Love report scored 9.4–9.6/10 by native reviewer (up from 8.2). Added §H5 review-round-2 rulings and §10 Indic typography law.

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

**Never apply `letter-spacing` to text that may contain Indic script.**

CSS letter-spacing inserts space between glyph clusters. In Latin script this
looks elegant; in Devanagari (and Telugu, Kannada, Tamil, Bengali) it separates
a consonant from its matra/conjunct, producing broken output:

- दिल → "दि ल"  ·  बातचीत → "बा तची त"  ·  मुलाक़ात → "मु ला क़ा त"

This was caught in the first Hindi PDF review and fixed suite-wide (11 removals
across 8 reports). Star-rating spans (★★★☆☆) may keep letter-spacing — those are
Latin/symbol glyphs.

**Companion rules:**
1. Every `font-family` stack that may render Indic text MUST include the script's
   font before the generic fallback — e.g. `'Cormorant Garamond','Noto Serif
   Devanagari',serif`. A display font with no Indic coverage silently falls back
   to a system font with poor shaping.
2. Each report carries a `devanagari-print-safety` CSS guard that resets
   letter-spacing globally and enables ligature/kerning features in print.
3. When adding a new language, load its Noto font (Noto Serif Telugu, Kannada,
   Tamil, Bengali, Devanagari for Marathi) and repeat rule 1.

---

## 9. TELUGU / TAMIL / KANNADA / MARATHI / BENGALI CONSTITUTIONS

*(To be authored per-language before that language's generation begins — same
template as the Hindi Constitution: avoid-list, prefer-list, few-shots, terms
table. The universal sections 0–7 already apply to all.)*

---
*This document is the constitution for every localization decision. When in
doubt: rewrite, don't translate; relatable beats poetic; astrology Sanskrit
stays, exam Sanskrit goes.*
