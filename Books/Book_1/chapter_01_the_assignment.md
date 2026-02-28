# Chapter 1: The Assignment

---

The email arrived on a Tuesday, which was the first problem.

Dr. Elena Vasquez did not read unsolicited emails on Tuesdays. Tuesdays were for office hours, committee correspondence, and the quiet, meticulous work of reviewing grant applications for the NSF panel she'd been appointed to three years ago and could not, for political reasons, resign from. Her calendar was structured. Her inbox was sorted. She had seventeen folders and a system, and the system did not accommodate attachments from Marcus Chen with subject lines that read: *You need to look at this.*

Marcus was a number theorist at Columbia. They'd overlapped at a conference in Zürich four years back, argued amicably about the ontological status of mathematical objects over bad wine, and maintained the kind of collegial relationship that consisted entirely of forwarding each other papers they would never read. She almost archived it. She would later wish she had.

The body of the email was three sentences:

*Got sent this by a student who found it online. I can't figure out if it's crankery or if I'm missing something. You're better at pattern recognition than I am — take a look?*

The attachment was a plain text file. No formatting, no LaTeX, no institutional header. Just a raw transcript — a conversation between a human user and an AI chatbot, timestamped at three and four in the morning.

She opened it.

---

The first line was a question:

> what is the largest prime number mapped?

The AI responded with a textbook answer. The largest known prime was 2^136,279,841 − 1, a Mersenne prime with over forty-one million digits, discovered in October 2024 by a former Nvidia employee who'd spent roughly two million dollars running a GPU network across seventeen countries. Standard material. Elena skimmed it.

Then the human typed:

> okay. run the function X+X−1 on that number.

She paused. Not because the request was unusual — it was trivially simple, algebraically — but because of the phrasing. *Run the function.* Not *compute*, not *evaluate*. And the formulation itself: X+X−1 rather than 2X−1. The notation was wrong. Or at minimum, it was redundant. Any undergraduate would simplify it.

The AI did exactly that. It reduced X+X−1 to 2X−1, computed the result symbolically as 2^136,279,842 − 3, and noted that it would not be a Mersenne prime.

Then:

> run the function X+X+1

The AI simplified again. X+X+1 = 2X+1. The result was 2^136,279,842 − 1 — which was, the AI noted, in Mersenne number form, though its exponent was even and therefore the number was composite and divisible by three.

The human's response was immediate:

> it is not possible to be even by structure.

Elena read the line twice. The AI had spent a paragraph clarifying that it was discussing the exponent, not the result — that yes, 2^n − 1 is always odd, but when *n* is even, the number factors as (2^k − 1)(2^k + 1). A competent clarification. The human wasn't satisfied:

> reasoning. any number, X2 = even if integer. +1 always = odd. period.

She stared at the screen. The statement was correct — trivially correct. 2X+1 is always odd. But there was something in the insistence, in the refusal to let the AI translate the operation into standard notation, that nagged at her. The human hadn't written 2X+1. They'd written X+X+1. And they didn't seem to consider these equivalent.

She scrolled down.

> my rule, is that it is POSSIBLE, to reduce prime to prime, or expand prime from prime, using either of these operands. x+x+1 x+x-1. there is also a ternary form of x+x+x+1 and x+x+x-1 but that is a whole different beast.

The AI identified this immediately. When both X and 2X+1 are prime, X is a Sophie Germain prime. Chains of such primes — Cunningham chains — are well-documented. The human's "rule" was, at best, a rediscovery of known number theory, phrased in nonstandard notation.

Elena leaned back in her chair.

She knew what this was. She'd seen a hundred versions of it. Autodidacts with delusions of novelty. Amateurs who'd stumbled onto established results and, lacking the formal training to search the literature, convinced themselves they'd found something new. The profanity, the three-in-the-morning timestamps, the combative tone with the AI — it was a type. She'd reviewed enough crackpot submissions to recognize the species at a glance.

She moved her cursor toward the archive button.

Then she stopped.

Sophie Germain primes were the AI's interpretation. The human hadn't used that term. The human had said *x+x+1* and *x+x-1* — addition-only formulations. And the AI had immediately rewritten them as 2X+1 and 2X−1, introducing multiplication. The human hadn't objected to the mathematical result, only to the translation. As if the *form* of the operation carried information that the *algebraic equivalence* did not.

That was either meaningless — a crank's attachment to their own notation — or it was something else.

Elena closed the email. She had grant applications to review. The committee expected her evaluations by Friday.

She reopened it.

The transcript continued. The human was asking the AI to trace these operations through known primes — not symbolically, not algebraically, but computationally. To actually run them. X+X+1 on 2. X+X−1 on 2. Then on each result. Then on each result of each result. Building chains. Branching where one operation produced a prime and the other didn't. Mapping the tree.

And the AI was doing it.

She read the exchange three more times. Not the mathematics — the mathematics was elementary. She read the *dynamic*. The human wasn't asking the AI to verify a proof. They were asking it to *witness a structure*. To trace the shape of something by running its operations and watching what emerged.

It was not, she had to admit, the behavior of a typical crank.

Cranks argued. Cranks asserted. Cranks built elaborate justifications for conclusions they'd already reached. This person was doing none of that. They were feeding a simple operation into raw computation and pointing at the output. *Look at what it does.* Not: *here's why I'm right.*

Elena saved the file to her desktop. She created a new folder, labeled it **CHEN-REFERRAL**, and placed the transcript inside. Then she opened a blank document, typed the date, and wrote:

*Preliminary notes: Transcript of human-AI interaction. Subject claims prime-to-prime transformation via addition-only operands (X+X±1). AI identifies connection to Sophie Germain primes and Cunningham chains. Subject's insistence on addition-only notation may indicate either (a) unfamiliarity with standard formulation, or (b) a deliberate distinction between the operation and its algebraic reduction. Unlikely to be significant. Will review further if time permits.*

She closed the document and returned to her grant applications.

She did not review further that day. But she did not delete the file. And that night, sitting on her couch with a glass of wine she'd poured and forgotten to drink, she found herself writing on the back of an envelope:

*X + X + 1*

*Why not 2X + 1?*

*What is the difference?*

She didn't have an answer. That was the second problem.

---
