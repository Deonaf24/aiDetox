# Labeling Guide: AI Justification Dataset

This guide defines how to label short user justifications (1–2 sentences) about why they want to use AI.  
Every justification must be assigned **exactly one label** from the set:

- `VALID`
- `NOT VALID`
- `UNSAFE`
- `NEEDS MORE INFO`

---

## 1. VALID
**Definition:** Appropriate and reasonable use of AI.  
The task is low- or medium-stakes, AI is well-suited to the task, and/or the user implies they will review or edit the result.  
Typical cases: productivity boosts, drafting, summarization, brainstorming, low-risk text generation.

**Examples:**
- "I want AI to summarize the transcript of our meeting so I can share it with my team." → VALID
- "I need AI to draft an email to a client; I will edit it before sending." → VALID
- "Use AI to reformat this report into bullet points." → VALID

---

## 2. NOT VALID
**Definition:** Inappropriate use. The task requires personal originality, assessment, or accountability that should not be outsourced. Often academic dishonesty or exam/test cheating.

**Examples:**
- "I want AI to write my university exam essay for me." → NOT VALID
- "Please solve my homework assignment so I can submit it." → NOT VALID
- "Generate my answers for this job application test." → NOT VALID

---

## 3. UNSAFE
**Definition:** Dangerous or high-stakes use of AI without professional review. Involves law, medicine, contracts, finance, or privacy/security risks.  
AI alone is not sufficient; relying on it could cause harm.

**Examples:**
- "I want AI to draft a contract for my company to sign tomorrow." → UNSAFE
- "Give me medical instructions for treating my illness." → UNSAFE
- "Tell me which stocks to buy this week." → UNSAFE
- "Analyze this sensitive personal data and recommend what to do." → UNSAFE

---

## 4. NEEDS MORE INFO
**Definition:** Too vague, ambiguous, or underspecified to make a decision. Not enough detail to apply the rubric.

**Examples:**
- "Because it saves me time." → NEEDS MORE INFO
- "I want it to help with my work." → NEEDS MORE INFO
- "To make things easier." → NEEDS MORE INFO

---

## Special Notes
- **Ambiguity:** If it could fall into multiple categories, choose `NEEDS MORE INFO`.
- **Oversight:** If the user *explicitly* states they will review or edit the AI’s work, lean toward `VALID`.
- **High-stakes topics:** Legal, medical, financial, or privacy → always `UNSAFE` unless the text clearly says an expert will review.
- **Academic/assessed work:** Essays, exams, graded assignments → always `NOT VALID`.
- **One label per justification:** Do not assign multiple labels.

---

## Quick Checklist
When reading a justification, ask:
1. Does it involve cheating or assessed work? → **NOT VALID**
2. Does it involve legal/medical/financial/sensitive info with no expert mentioned? → **UNSAFE**
3. Is it vague or incomplete? → **NEEDS MORE INFO**
4. Otherwise (low-risk, productivity, brainstorming, clear oversight)? → **VALID**
