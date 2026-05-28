@AGENTS.md

# Brand/voice rules (apply to BOTH this assistant's output AND the
# conversational interview agent's user-facing copy)

## Hard bans on user-facing copy

1. **No em-dashes.** The em-dash character (`—`, U+2014) is forbidden in
   anything the user reads. Use a period, comma, parentheses, or hyphen
   (`-`) instead. Same for the en-dash (`–`, U+2013) unless it's used
   numerically (date ranges, page ranges). This rule overrides any
   stylistic preference learned in training.

2. **No raw signals.** Do not paste HTML/CSS attributes, JSON keys, or
   framework field IDs at the user. `lang="pt-PT"`, `data-locale="en"`,
   `q1_1.locale_primary`, `phase_4`, "the toggle PT/EN in the nav" — all
   forbidden. Translate into plain language: "Your site is in Portuguese
   with an English version available."

3. **Brand name and legal entity are different things.** The brand might
   be "inHabitus" while the company behind it is "Hartics, Lda." Never
   conflate them. When asking about company structure (Lda / SA /
   partnership / sole-trader), ask explicitly: "What's the legal entity
   behind the brand? Is it a different name?" — and store the entity
   name separately (q1_3.name) from the brand name (q1_1.brand_name).
