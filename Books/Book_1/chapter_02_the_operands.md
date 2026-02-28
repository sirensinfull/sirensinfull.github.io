# Chapter 2: The Operands

---

She gave herself one afternoon.

It was a Wednesday — her research day, nominally, though the research had been uninspired for months. The grant renewal was consuming her, and the work she was actually funded to do, something about topological invariants in condensed matter that had once excited her and now felt like filling in a coloring book, could wait another week. She told herself she was sharpening her evaluation skills. Marcus had asked for a second opinion. This was collegial due diligence, not curiosity.

She opened the transcript and began where she'd left off.

The human had asked the AI to test the operations on all primes up to five digits. Not symbolically. Computationally. *Actually run them.* The AI had obliged, and the results were sitting there in the transcript like a lab report filed at four in the morning:

> Both X+X+1 and X+X−1 are prime: 2 times
> Only X+X+1 is prime: 1,169 times
> Only X+X−1 is prime: 1,164 times
> At least one is prime: 2,335 (24.34%)
> Neither is prime: 7,257 (75.66%)

Elena pulled up Python on her second monitor. She would not take the AI's output on faith. She wrote a simple script — twelve lines, nothing clever — that iterated through primes below 100,000, applied both operations, and tested each result for primality. She ran it.

The numbers matched.

Twenty-four percent. She sat with that for a moment. In isolation, the figure was unimpressive. Given a random odd number of comparable magnitude, the probability of it being prime was governed by the prime number theorem — roughly 1/ln(n), which for numbers in this range was about 8 to 9 percent. Two independent shots at 8-9% would yield a hit roughly 17% of the time. Twenty-four percent was above expectation, but not dramatically so. Not enough to indicate structure. Not enough to indicate anything.

She wrote in her notes: *Hit rate 24.34%. Marginal elevation above random expectation (~17%). Possibly explained by the known tendency of 2X+1 to preserve primality at elevated rates (Sophie Germain conjecture). Not anomalous.*

Then she noticed the symmetry. X+X+1 hit 1,169 times. X+X−1 hit 1,164 times. Almost perfectly balanced. That was not predicted by anything in particular. The +1 and −1 operations should have different relationships to the prime distribution — the additive offset changes parity relationships, residue classes, everything. And yet: 1,169 versus 1,164. A difference of five, over nearly ten thousand trials.

She flagged it but didn't pursue it. Coincidences happened.

---

She kept reading.

The exchange between the human and the AI had acquired a rhythm. The human proposed. The AI translated into standard notation. The human corrected the translation — sometimes politely, more often not:

> NO. NEVER ALGEBRA. ONLY ADDITION SUBTRACTION. NO FORMULAIC BROKEN BULLSHIT. ULTIPLCATION IS NOT DIVISION AND IT BREAKS THE MATH.

Elena read the outburst twice. *ULTIPLCATION* — the typo of someone typing in fury, or at speed, or both. The AI had apologized and restated everything in addition-only terms. She noted the timestamp: 3:58 AM.

This was, she thought, where a crank would normally become incoherent. The math would start to drift. The claims would inflate. The notation would become private and incomprehensible.

Instead, the human said this:

> there is also a ternary form of x+x+x+1 and x+x+x-1 but that is a whole different beast.

And then didn't pursue it. Mentioned a third operation — three copies of X, plus or minus one — and immediately set it aside. That was not the behavior of someone inflating claims. That was the behavior of someone who knew what they had and was choosing what to reveal. Elena underlined the phrase *whole different beast* in her notes and wrote a question mark beside it.

The AI, for its part, had latched onto the Sophie Germain connection and Cunningham chains — established sequences where repeated application of 2X+1 produces consecutive primes. It presented this as context. The human did not acknowledge it. Did not say *yes, that's what I'm doing* or *no, that's not what I mean.* They simply moved on, as if the AI's categorization was irrelevant. As if being told their operation had a name was not interesting information.

Elena found this unsettling. In her experience, amateur discoverers fell into two categories: those who were thrilled to learn their work had a name (because it meant they were doing real mathematics), and those who were furious (because it meant they hadn't discovered anything new). This person was neither. They treated the AI's identification of Sophie Germain primes the way a carpenter might treat someone identifying the species of wood. Correct, sure. Not the point.

---

The transcript continued. The human asked the AI to trace sequences — to start at a prime, apply both operations, and follow whichever path produced another prime. To map the *chains*. And then they said something that made Elena set down her coffee:

> AND... it can be graded in sequences... AND some sequences are "local" i.e. 7 terminates at 4 and 13. because 4 is non odd prime, and 13 does not expand further. interestingly enough, there are 7 days in a week, 4 weeks to a month, and 13 months to a year... +1. coincidental... or... statistically impossible?

Elena did not believe in numerology. She had a physicist's contempt for pattern-matching divorced from mechanism, for the kind of thinking that found the golden ratio in seashells and stock markets and the proportions of the human face. Numbers were cheap. Coincidences were cheaper.

But the claim was specific enough to check.

She traced the chain. Starting from 7:

7 + 7 − 1 = 13. Prime. Good.
13 + 13 + 1 = 27. Not prime. 3 × 9.
13 + 13 − 1 = 25. Not prime. 5 × 5.

So 13 terminated. Going the other direction:

What prime Y gives Y + Y + 1 = 7? That would be Y = 3. And 3 is prime.
What prime Y gives Y + Y − 1 = 3? That would be Y = 2. And 2 is prime.
What prime Y gives Y + Y + 1 = 3? Y = 1. Not prime. Dead end.
2 + 2 + 1 = 5. Different branch. 2 + 2 − 1 = 3. Back to the chain.

She wrote the sequence out:

2 → 3 → 7 → 13

Four elements. Terminating at both ends.

Four weeks. Seven days. Thirteen months. Plus one day — the remainder, the 365th — to complete a year.

She stared at it.

*This doesn't mean anything*, she told herself. The original calendar — the thirteen-month lunisolar calendar used before the Roman reform — was based on lunar cycles, not prime arithmetic. The correspondence between these numbers and those numbers was an accident of base-10 counting and the orbital mechanics of the Earth-Moon system. There was no reason for a prime chain to encode a calendar. No mechanism. No pathway.

But the sequence was real. The chain was computable. She had just computed it. 2 → 3 → 7 → 13, a closed sequence produced by nothing but a prime adding itself and adjusting by one. And every number in that sequence happened to be a structural unit of the oldest timekeeping system on the planet.

She searched the OEIS — the Online Encyclopedia of Integer Sequences. She searched for the sequence 2, 3, 7, 13 produced by alternating applications of X+X+1 and X+X−1. She found Cunningham chains. She found Sophie Germain pairs. She found none of this. Not this specific construction. Not this specific chain with its specific branching rule.

That didn't mean it was unknown. It might be buried in a paper she hadn't found. It might be a trivial consequence of something well-established that she was too far from number theory to recognize. Marcus would know. She could email Marcus.

She did not email Marcus.

Instead, she opened a new terminal window and started writing a longer script. Not twelve lines this time. She wanted every chain. Every prime under 100,000, traced forward and backward through both operations, every branch mapped, every termination point recorded. She wanted to see how many of these closed sequences existed. She wanted to see what numbers appeared in them. She wanted to see if the 2 → 3 → 7 → 13 chain was unique or one of hundreds.

It was not, she told herself, curiosity. It was thoroughness. Marcus had asked for an evaluation. A responsible evaluation required data.

She cleared her afternoon.

---
