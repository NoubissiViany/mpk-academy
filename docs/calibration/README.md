# Writing calibration packet

This packet prepares the existing 40-essay calibration. **It contains no learner essays, teacher ratings, or evidence of completed calibration.** Speaking calibration remains separate.

1. Recruit consenting learners across TEF/TCF and NCLC 5, 7 and 9+ targets. Select at least 40 distinct essays; the blank template provides 20 slots per exam. Keep learner identities, texts and consent records outside the repository.
2. Give a qualified French teacher the original task and essay, without AI ratings or corrections. Have them independently assign A2, B1, B2 or C1 to task fulfilment, coherence, vocabulary and grammar. Use the same rubric for all samples.
3. Freeze those ratings before revealing AI results. Copy `writing-ratings.template.json` to a private working location and enter the paired ratings. Record the actual AI model and source revision used to generate its feedback. Keep one model/prompt revision per evaluation.
4. Replace the template's `false` confirmations only when consent and independent review actually occurred. Replace all `null` grades with the recorded grades. Use pseudonymous sample IDs; never put learner text, names, emails or production submission IDs in this file.
5. From the repository root, run:

   ```bash
   npm run check:calibration -- /private/path/writing-ratings.json
   ```

The command checks every criterion separately against **at least 60% exact agreement and 90% agreement within one level**. It reports counts, percentages, coverage and whether AI levels tend higher or lower. It exits nonzero for missing ratings, insufficient coverage, fewer than 40 complete essays or unmet agreement targets. Duplicate sample IDs and invalid grades are rejected. The untouched template must fail.

Keep the aggregate JSON output and a short methodology/result note in this directory when real calibration has been performed. The checker verifies supplied ratings; it cannot verify that consent or independent teacher review actually happened. Unit-test fixtures are synthetic and are not calibration evidence. Passing these checks does not establish official TEF/TCF score equivalence or validate speaking.

For a failing criterion, inspect disagreements with the teacher, revise the prompt as needed, and rerun on a held-out set of independently rated essays. Do not tune on the evaluation essays and present the same result as independent validation. Keep provisional labels until the evidence supports stronger claims.
