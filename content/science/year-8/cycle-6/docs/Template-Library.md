# Procedural template library

19 templates produce 156 valid instances within the supplied finite domains: 102 numerical, 24 conceptual-case and 30 extended-response instances. These are not 156 new scenario families. All generation runs locally in JavaScript without an AI API. See Integration-Notes.md for the registry and safe interpreter contract.

Numeric templates vary data within a fixed scenario. Conceptual cases vary complete contexts/tasks. Extended templates vary numbers within a fixed multi-step reasoning task. Repeating one template must not substitute for covering the whole unit.

## N01 — moving-cart

**Type:** numerical · **Difficulty:** Medium · **Primary skill:** Calculation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| m | Mass of the moving or raised object | 0.2, 0.5, 2 | kg |
| v | Speed of the object | 2, 4, 6 | m/s |

**Constraints:** Only listed values; reject unknown/missing variables. Every denominator is positive. No extra energy input in rebound scenarios. Useful output cannot exceed stated input.

**Rule:** `kinetic_energy` in the allow-listed generator registry.

**Source:** S:Formulas; source_supported.

**Generated example**

Calculate kinetic energy for a 0.2 kg cart moving at 2 m/s. Show working. Give your answer to 2 decimal places if necessary.

**Worked answer**

E_k = ½ × 0.2 × 2² = 0.4 J. Report 0.4 J.

**Proposed rubric**

- Correct relationship and substitution or equivalent valid method. [1 mark]
- Correct result 0.4 J, allowing stated rounding. [1 mark]

## N02 — raised-load

**Type:** numerical · **Difficulty:** Medium · **Primary skill:** Calculation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| m | Mass of the moving or raised object | 0.5, 2, 5 | kg |
| h | Vertical height above the zero level | 0.4, 1.5, 3 | m |

**Constraints:** Only listed values; reject unknown/missing variables. Every denominator is positive. No extra energy input in rebound scenarios. Useful output cannot exceed stated input.

**Rule:** `gpe` in the allow-listed generator registry.

**Source:** S:Formulas; source_supported.

**Generated example**

Calculate GPE for a 0.5 kg load at 0.4 m above the zero level. Use g = 9.8 N/kg. Give your answer to 2 decimal places if necessary.

**Worked answer**

E_g = 0.5 × 9.8 × 0.4 = 1.96 J. Report 1.96 J after rounding.

**Proposed rubric**

- Correct relationship and substitution or equivalent valid method. [1 mark]
- Correct result 1.96 J, allowing stated rounding. [1 mark]

## N03 — current-calculation

**Type:** numerical · **Difficulty:** Easy · **Primary skill:** Calculation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| V | Voltage across the stated circuit/component | 3, 6, 12 | V |
| R | Resistance of the stated circuit/component | 10, 20, 40 | Ω |

**Constraints:** Only listed values; reject unknown/missing variables. Every denominator is positive. No extra energy input in rebound scenarios. Useful output cannot exceed stated input.

**Rule:** `ohm_current` in the allow-listed generator registry.

**Source:** C:Q13; S:Ohm’s law; source_supported.

**Generated example**

Calculate current through a 10 Ω resistor with 3 V across it. Give your answer to 2 decimal places if necessary.

**Worked answer**

I = V/R = 3/10 = 0.3 A. Report 0.3 A.

**Proposed rubric**

- Correct relationship and substitution or equivalent valid method. [1 mark]
- Correct result 0.3 A, allowing stated rounding. [1 mark]

## N04 — voltage-calculation

**Type:** numerical · **Difficulty:** Easy · **Primary skill:** Calculation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| I | Current through the component | 0.1, 0.2, 0.5 | A |
| R | Resistance of the stated circuit/component | 10, 30, 60 | Ω |

**Constraints:** Only listed values; reject unknown/missing variables. Every denominator is positive. No extra energy input in rebound scenarios. Useful output cannot exceed stated input.

**Rule:** `ohm_voltage` in the allow-listed generator registry.

**Source:** C:Q14; S:Ohm’s law; source_supported.

**Generated example**

Calculate voltage across a 10 Ω resistor carrying 0.1 A. Give your answer to 2 decimal places if necessary.

**Worked answer**

V = IR = 0.1 × 10 = 1 V. Report 1 V.

**Proposed rubric**

- Correct relationship and substitution or equivalent valid method. [1 mark]
- Correct result 1 V, allowing stated rounding. [1 mark]

## N05 — resistance-calculation

**Type:** numerical · **Difficulty:** Medium · **Primary skill:** Calculation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| V | Voltage across the stated circuit/component | 3, 6, 9 | V |
| I | Current through the component | 0.05, 0.1, 0.3 | A |

**Constraints:** Only listed values; reject unknown/missing variables. Every denominator is positive. No extra energy input in rebound scenarios. Useful output cannot exceed stated input.

**Rule:** `ohm_resistance` in the allow-listed generator registry.

**Source:** C:Q15; S:Ohm’s law; source_supported.

**Generated example**

Calculate resistance when current is 0.05 A and voltage is 3 V. Give your answer to 2 decimal places if necessary.

**Worked answer**

R = V/I = 3/0.05 = 60 Ω. Report 60 Ω.

**Proposed rubric**

- Correct relationship and substitution or equivalent valid method. [1 mark]
- Correct result 60 Ω, allowing stated rounding. [1 mark]

## N06 — useful-output

**Type:** numerical · **Difficulty:** Medium · **Primary skill:** Calculation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| input | Total input energy | 100, 200, 500 | J |
| percent | Useful-output or recovered-height percentage used to construct valid data | 20, 40, 80 | % |

**Constraints:** Only listed values; reject unknown/missing variables. Every denominator is positive. No extra energy input in rebound scenarios. Useful output cannot exceed stated input.

**Rule:** `efficiency` in the allow-listed generator registry.

**Source:** S:Energy Efficiency; source_supported.

**Generated example**

Calculate efficiency when input is 100 J and useful output is 20 J. Give your answer to 2 decimal places if necessary.

**Worked answer**

Efficiency = 20/100 × 100 = 20 %. Report 20 %.

**Proposed rubric**

- Correct relationship and substitution or equivalent valid method. [1 mark]
- Correct result 20 %, allowing stated rounding. [1 mark]

## N07 — rebound-percentage

**Type:** numerical · **Difficulty:** Medium · **Primary skill:** Calculation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| drop | Release height above the consistent contact reference | 80, 120, 160 | cm |
| percent | Useful-output or recovered-height percentage used to construct valid data | 50, 60, 75 | % |

**Constraints:** Only listed values; reject unknown/missing variables. Every denominator is positive. No extra energy input in rebound scenarios. Useful output cannot exceed stated input.

**Rule:** `rebound` in the allow-listed generator registry.

**Source:** S:REBOUND EXAMPLE elaboration; source_elaboration.

**Generated example**

A passive ball is released from rest at 80 cm and rebounds to 40 cm, using consistent reference heights. Calculate rebound percentage. Give your answer to 2 decimal places if necessary.

**Worked answer**

Rebound percentage = 40/80 × 100 = 50 %. Report 50 %.

**Proposed rubric**

- Correct relationship and substitution or equivalent valid method. [1 mark]
- Correct result 50 %, allowing stated rounding. [1 mark]

## N08 — waste-budget

**Type:** numerical · **Difficulty:** Easy · **Primary skill:** Calculation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| input | Total input energy | 100, 200, 400 | J |
| percent | Useful-output or recovered-height percentage used to construct valid data | 20, 50, 80 | % |

**Constraints:** Only listed values; reject unknown/missing variables. Every denominator is positive. No extra energy input in rebound scenarios. Useful output cannot exceed stated input.

**Rule:** `waste` in the allow-listed generator registry.

**Source:** S:Energy Efficiency; source_supported.

**Generated example**

A device receives 100 J and produces 20 J of useful output. Calculate the energy transferred to other forms, assuming no energy remains stored. Give your answer to 2 decimal places if necessary.

**Worked answer**

Other energy = 100 − 20 = 80 J. Report 80 J.

**Proposed rubric**

- Correct relationship and substitution or equivalent valid method. [1 mark]
- Correct result 80 J, allowing stated rounding. [1 mark]

## N09 — energy-units

**Type:** numerical · **Difficulty:** Easy · **Primary skill:** Calculation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| kJ | Energy value expressed in kilojoules | 1.2, 2.5, 4.8 | kJ |

**Constraints:** Only listed values; reject unknown/missing variables. Every denominator is positive. No extra energy input in rebound scenarios. Useful output cannot exceed stated input.

**Rule:** `kj_to_j` in the allow-listed generator registry.

**Source:** E:Q8–9; source_supported.

**Generated example**

Convert 1.2 kJ to joules. Give your answer to 0 decimal places if necessary.

**Worked answer**

1.2 × 1000 = 1200 J. Report 1200 J.

**Proposed rubric**

- Correct relationship and substitution or equivalent valid method. [1 mark]
- Correct result 1200 J, allowing stated rounding. [1 mark]

## N10 — series-drop

**Type:** numerical · **Difficulty:** Medium · **Primary skill:** Calculation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| V | Voltage across the stated circuit/component | 6, 9, 12 | V |
| known | Known series voltage drop | 1, 2, 3 | V |

**Constraints:** Only listed values; reject unknown/missing variables. Every denominator is positive. No extra energy input in rebound scenarios. Useful output cannot exceed stated input.

**Rule:** `series_drop` in the allow-listed generator registry.

**Source:** S:Series circuits; source_supported.

**Generated example**

Two components are in series across an ideal 6 V source. One voltage drop is 1 V. Calculate the other drop. Give your answer to 2 decimal places if necessary.

**Worked answer**

Other voltage drop = 6 − 1 = 5 V. Report 5 V.

**Proposed rubric**

- Correct relationship and substitution or equivalent valid method. [1 mark]
- Correct result 5 V, allowing stated rounding. [1 mark]

## N11 — branch-sum

**Type:** numerical · **Difficulty:** Medium · **Primary skill:** Calculation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| a | Current in branch A | 0.1, 0.2, 0.4 | A |
| b | Current in branch B | 0.15, 0.3, 0.5 | A |

**Constraints:** Only listed values; reject unknown/missing variables. Every denominator is positive. No extra energy input in rebound scenarios. Useful output cannot exceed stated input.

**Rule:** `branch_sum` in the allow-listed generator registry.

**Source:** S:Parallel circuits; source_supported.

**Generated example**

Two branches carry 0.1 A and 0.15 A. Calculate the common supply current. Give your answer to 2 decimal places if necessary.

**Worked answer**

Supply current = 0.1 + 0.15 = 0.25 A. Report 0.25 A.

**Proposed rubric**

- Correct relationship and substitution or equivalent valid method. [1 mark]
- Correct result 0.25 A, allowing stated rounding. [1 mark]

## N12 — ke-scaling

**Type:** numerical · **Difficulty:** Hard · **Primary skill:** Reasoning · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| mf | Multiplier applied to mass | 0.5, 2, 3 | dimensionless |
| vf | Multiplier applied to speed | 0.5, 2, 3 | dimensionless |

**Constraints:** Only listed values; reject unknown/missing variables. Every denominator is positive. No extra energy input in rebound scenarios. Useful output cannot exceed stated input.

**Rule:** `ke_factor` in the allow-listed generator registry.

**Source:** S:Formulas; source_supported.

**Generated example**

An object’s mass is multiplied by 0.5 and its speed by 0.5. Determine the factor multiplying its kinetic energy. Give your answer to 2 decimal places if necessary.

**Worked answer**

Energy multiplier = 0.5 × 0.5² = 0.125 factor. Report 0.13 factor after rounding.

**Proposed rubric**

- Correct relationship and substitution or equivalent valid method. [1 mark]
- Correct result 0.125 factor, allowing stated rounding. [1 mark]

## C01 — transfer-transform

**Type:** conceptual · **Difficulty:** Medium · **Primary skill:** Explanation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| case_id | Complete scenario and reasoning-task bundle | piano-transfer, piano-transform, turbine-transfer, turbine-transform, battery-transform, lamp-transfer | category |

**Constraints:** Never mix prompt, model answer or rubric across cases.

**Rule:** `verified_case` in the allow-listed generator registry.

**Source:** E:Q21–27; source_supported.

**Generated example**

Describe an energy transfer when a finger presses a piano key, naming the starting and receiving objects.

**Worked answer**

Kinetic energy passes from the moving finger to the key, causing the key to move.

**Proposed rubric**

- Names kinetic energy [1 mark]
- Identifies finger as source and key as receiver [1 mark]

**Verified case tasks:** piano-transfer, piano-transform, turbine-transfer, turbine-transform, battery-transform, lamp-transfer. Every complete case is available in conceptual_templates.json and validated_instances.json.

## C02 — circuit-change

**Type:** conceptual · **Difficulty:** Medium · **Primary skill:** Explanation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| case_id | Complete scenario and reasoning-task bundle | series-break, parallel-break, common-break, equal-series, unequal-parallel, independent-switches | category |

**Constraints:** Never mix prompt, model answer or rubric across cases.

**Rule:** `verified_case` in the allow-listed generator registry.

**Source:** S:Types of circuits; source_supported.

**Generated example**

Predict the result of one broken filament in a two-lamp series circuit and explain.

**Worked answer**

Both lamps go out because the only path is broken.

**Proposed rubric**

- Both off [1 mark]
- Only path interrupted [1 mark]

**Verified case tasks:** series-break, parallel-break, common-break, equal-series, unequal-parallel, independent-switches. Every complete case is available in conceptual_templates.json and validated_instances.json.

## C03 — method-critique

**Type:** conceptual · **Difficulty:** Medium · **Primary skill:** Explanation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| case_id | Complete scenario and reasoning-task bundle | surface-confound, push-confound, single-trial, ruler-zero, prototype-criteria, spring-speed | category |

**Constraints:** Never mix prompt, model answer or rubric across cases.

**Rule:** `verified_case` in the allow-listed generator registry.

**Source:** E:Q14,Q31; S:rebound elaboration; added_practice.

**Generated example**

Evaluate comparing two balls if one is dropped on carpet and the other on wood.

**Worked answer**

Ball type and surface both change, so rebound differences cannot be attributed to ball type alone. Use the same surface.

**Proposed rubric**

- Identifies confound [1 mark]
- Explains same-surface correction [1 mark]

**Verified case tasks:** surface-confound, push-confound, single-trial, ruler-zero, prototype-criteria, spring-speed. Every complete case is available in conceptual_templates.json and validated_instances.json.

## C04 — electrical-misconceptions

**Type:** conceptual · **Difficulty:** Medium · **Primary skill:** Explanation · **Marks:** 2

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| case_id | Complete scenario and reasoning-task bundle | current-used-up, voltage-force, ammeter-parallel, electron-conventional, voltage-fixed, battery-storage | category |

**Constraints:** Never mix prompt, model answer or rubric across cases.

**Rule:** `verified_case` in the allow-listed generator registry.

**Source:** C:Q17,Q19; S:Voltage/Current; source_supported.

**Generated example**

Evaluate: “The second lamp gets less current because the first lamp uses it up.” Assume a steady series circuit.

**Worked answer**

Current is the same throughout the loop. The lamps transfer electrical energy; they do not consume charge.

**Proposed rubric**

- Same current [1 mark]
- Energy versus charge distinction [1 mark]

**Verified case tasks:** current-used-up, voltage-force, ammeter-parallel, electron-conventional, voltage-fixed, battery-storage. Every complete case is available in conceptual_templates.json and validated_instances.json.

## X01 — rebound-budget

**Type:** extended_response · **Difficulty:** Hard · **Primary skill:** Analysis · **Marks:** 6

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| drop | Release height above the consistent contact reference | 80, 100, 120 | cm |
| percent | Useful-output or recovered-height percentage used to construct valid data | 50, 60, 75 | % |

**Constraints:** Use only allowed values. Keep the release-from-rest/ideal-source/no-extra-input conditions in the prompt. Update answers and rubric values together.

**Rule:** `extended_rebound` in the allow-listed generator registry.

**Source:** S:Energy Efficiency; S:REBOUND EXAMPLE elaboration; added_practice.

**Generated example**

A passive ball is released from rest at 80 cm and first rebounds to 40 cm. Both centre-of-mass heights use the same contact reference. No energy is added during the bounce.

- (a) Calculate rebound percentage, showing working. [2 marks]
- (b) Explain the energy changes and why the rebound is lower. [2 marks]
- (c) Evaluate repeating this trial by throwing the ball down instead; propose a fair release method. [2 marks]

**Worked answer**

a) 40/80 × 100 = 50%.
b) GPE becomes kinetic, then temporarily elastic during compression, then kinetic and GPE again. Some energy spreads as thermal energy and sound, leaving less recovered GPE.
c) Throwing adds initial kinetic energy. Use a repeatable release from rest without a push, keeping ball, surface and height consistent.

**Proposed rubric**

- Correct rebound/drop ratio [1 mark]
- 50% [1 mark]
- Accurate compression and rebound energy sequence [1 mark]
- Explains energy to surroundings without destruction [1 mark]
- Identifies extra input from throwing [1 mark]
- Proposes release from rest with consistent controls [1 mark]

## X02 — spring-budget

**Type:** extended_response · **Difficulty:** Hard · **Primary skill:** Analysis · **Marks:** 6

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| input | Total input energy | 60, 80, 100 | J |
| percent | Useful-output or recovered-height percentage used to construct valid data | 60, 75, 90 | % |

**Constraints:** Use only allowed values. Keep the release-from-rest/ideal-source/no-extra-input conditions in the prompt. Update answers and rubric values together.

**Rule:** `extended_spring` in the allow-listed generator registry.

**Source:** S:Law of conservation; E:Q21–30; added_practice.

**Generated example**

A spring stores 60 J before launch. After launch it is relaxed and the car has 36 J of kinetic energy. The remaining energy is thermal within the system. No energy crosses the boundary.

- (a) Calculate the thermal energy increase and useful-output efficiency. [2 marks]
- (b) Describe final energy bars and explain conservation. [2 marks]
- (c) Predict what happens to useful output if friction is reduced with the same initial energy, and justify. [2 marks]

**Worked answer**

a) Thermal increase = 60 − 36 = 24 J. Efficiency = 36/60 × 100 = 60%.
b) Elastic 0 J; kinetic 36 J; thermal increase 24 J. Total 60 J equals the initial total.
c) Less energy is transferred into thermal energy by friction, so more can remain as useful kinetic energy, assuming other changes are negligible. Total energy still cannot exceed the input.

**Proposed rubric**

- 24 J thermal increase [1 mark]
- 60% efficiency [1 mark]
- Correct final bar values [1 mark]
- Conserved total 60 J [1 mark]
- Predicts greater useful kinetic energy [1 mark]
- Explains reduced thermal transfer under stated conditions [1 mark]

## X03 — parallel-switches

**Type:** extended_response · **Difficulty:** Hard · **Primary skill:** Analysis · **Marks:** 6

| Variable | Meaning | Allowed values | Unit |
|---|---|---|---|
| V | Voltage across the stated circuit/component | 3, 6, 9 | V |
| a | Current in branch A | 0.1, 0.2 | A |
| b | Current in branch B | 0.15, 0.3 | A |

**Constraints:** Use only allowed values. Keep the release-from-rest/ideal-source/no-extra-input conditions in the prompt. Update answers and rubric values together.

**Rule:** `extended_parallel` in the allow-listed generator registry.

**Source:** S:Current/Types of circuits; added_practice.

**Generated example**

Two independently switched parallel lamp branches connect across an ideal 3 V source. Branch A carries 0.1 A and B carries 0.15 A when both switches are closed.

- (a) Determine branch voltages and total current when both switches are closed. [2 marks]
- (b) Predict the state of A and total current when only B is switched off. [2 marks]
- (c) Give one explained advantage and one trade-off of parallel wiring for independent lighting. [2 marks]

**Worked answer**

a) Each branch has 3 V. Total current = 0.1 + 0.15 = 0.25 A.
b) A still has 3 V and 0.1 A; B has zero current. Total current is 0.1 A.
c) A branch can operate independently because it has its own complete path. Extra branches require more wiring and can increase total supply current.

**Proposed rubric**

- 3 V each [1 mark]
- 0.25 A total [1 mark]
- A remains operating under the ideal-source assumption [1 mark]
- 0.1 A total after B opens [1 mark]
- Explained independent-operation advantage [1 mark]
- Relevant wiring/current trade-off [1 mark]
