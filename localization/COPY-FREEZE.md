# COPY FREEZE — read before changing any text in the app

**Applies from the moment translation starts, to everyone who edits user-facing text.**

## The rule

Once a string has been sent for translation, **its English wording is frozen.**

Changing one word in a caption is not a small edit. Translation keys are minted
from the English text, so rewording a caption creates a **new key** and orphans
the translations already bought against the old one — in every language.

## What this costs, measured

Tested on the real sheet, not assumed:

| change | result |
|---|---|
| Refactor, reorder, move a string between files | **safe** — 460 strings, 0 new keys |
| Add or remove unrelated strings | **safe** |
| **Reword the English** | **new key + orphaned translation**, verified |

Renaming `"All 16 slots"` to `"All sixteen slots of the day"` produced exactly
one new key and one orphan. In nine languages that is nine translations lost
for one word changed.

## If a caption genuinely must change

1. Run `node extract-app-strings.js`. It prints `keys no longer used in code`.
2. Take the orphaned key and hand it to whoever maintains `app-strings-todo.json`,
   with the new key it should map to.
3. The translations are carried across by hand. They are not re-bought.

Orphans are **printed, never silently dropped**, precisely so this is possible.
But it is manual work, so it is cheaper to get the English right before sending
than to reword afterwards.

## Why this is not fixed in code

The permanent fix is a key written in the source (`t('home.hero.title')`)
rather than derived from the text. That is a large refactor of every call site
and is not worth doing before the first language lands. Once Telugu is proven
and the rollout is under way, it becomes worth reconsidering.

## The short version, for a message

> Don't change any English text in the app without telling me first. Editing a
> caption after translation starts throws away that string's translation in
> every language. Refactoring and moving code around is completely safe — it's
> only the words themselves that are frozen.

## What is NOT frozen

- Hindi wording — Hindi is a translated value like any other and can be corrected
- Layout, styling, ordering of screens
- Anything not shown to a user: comments, variable names, file structure
- New strings, which simply get new keys
