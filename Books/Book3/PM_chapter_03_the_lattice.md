# Chapter 3: The Lattice

---

The function took her four days.

Not because it was difficult. The individual operations were trivial — grouping prime factors by type, counting distinct groups, measuring the ratios between them. Any of her graduate students could have written it in an afternoon. Elena could have written it in an afternoon. She had written harder functions before breakfast on days when the coffee was particularly good and the radiator was not translating cats into steam and the problem was the kind that yielded to direct assault.

This function did not yield to direct assault. This function yielded to something else — a process she had no name for, that operated at the boundary between computation and perception, that required her to sit with each line of code the way she sat with the dream images, not solving but *attending*, letting the structure surface the way a shape surfaces when you stop staring at a stereogram and let your focus go soft.

She wrote it at night. Not because night was better for programming — her best work had always happened between 9 AM and noon, in the office, with coffee and daylight and the productive hum of a building full of people doing the same thing she was doing. She wrote it at night because the dreams kept showing her the answer and she needed to get the answer down before it faded, the way a person who dreams a melody needs to hum it into a phone before the waking mind's noise drowns it out.

Night one: the grouping logic. Given the prime factorization of any integer, group the factors by type and count the repetitions. She had started this in the small hours after Chapter 1's phone call — the first two lines, `const groups = {}`, the for-loop that counted. Now she extended it. 12 = 2² × 3 became two groups: base 2 appearing twice, base 3 appearing once. 30 = 2 × 3 × 5 became three groups: each base appearing once. 8 = 2³ became one group: base 2 appearing three times.

Night two: the gap pattern. This was the part the dreams were teaching her. Gaps existed *between* factor groups — the spaces in the lattice, the voids in the weave. More distinct factors meant more gaps. Same-factor repetition meant regular spacing. She wrote the regularity metric: a ratio of the maximum repeat count to the total factor count, scaled by the inverse square root of the number of distinct factors. She did not know where the formula came from. She wrote it, ran it, compared the output to the dream images of lattice structures she had sketched on the legal pad, and the formula produced numbers that *felt* correct — that matched the visual density and spacing of the dream lattices in the way a well-tuned instrument matched a pitch. She could not prove the formula was right. She could verify that it was not wrong.

Night three: the weave classification. This was the part that stopped her.

She had been coding for two hours. The apartment was dark except for the laptop screen. The mug — ALL IS ONE. ONE IS ALL. — was on the table with cold coffee she had poured at 10 PM and had not drunk because the drinking required a hand and both hands were on the keyboard and the keyboard was the only thing keeping her from falling into the dream while awake. She had six classifications drafted: singular, for primes. Crystalline, for single-factor composites like 8 = 2³ or 27 = 3³. Laminar, for two distinct factors without binary-ternary overlap. Composite, for multi-factor with some regularity. Amorphous, for chaotic factor distributions.

She was missing one. She knew she was missing one because the dream had shown her six types and she had five. The sixth type was the one the dream kept returning to — the interlocking weave, the tight braiding, the structure that appeared when two specific factors wove together in the configuration that produced maximum structural resistance. She had seen it in the dream of iron. She had seen it in the dream of carbon. She had seen it in every dream that showed a lattice that *held* — that did not shed, did not collapse, did not bleed orbitals into the substrate.

Binary-ternary. Factors of 2 and 3. Together. Interlocked. The seed and the ternary kernel woven into a single structure.

She typed `hexagonal`.

She did not know why she typed it. She was not thinking about crystal lattices. She was not thinking about close-packing geometries or honeycomb structures or any of the materials science she had absorbed during the second paper's revision. She typed it because the dream had shown her the shape and the shape was hexagonal — six-sided, six-symmetric, the geometry that emerged when binary and ternary wove at their most efficient — and the word was the word because the word was the shape and the shape was the lattice and the lattice was the dream and the dream was the math.

```
let weave = 'singular';
if (el.prime) {
  weave = 'singular';
} else if (distinctFactors === 1) {
  weave = 'crystalline';
} else if (binaryTernary && distinctFactors === 2) {
  weave = 'hexagonal';
} else if (distinctFactors === 2) {
  weave = 'laminar';
} else if (distinctFactors <= 3 && regularity > 0.3) {
  weave = 'composite';
} else {
  weave = 'amorphous';
}
```

She stared at the classification tree. She stared at the hexagonal branch — the condition that required *both* a factor of 2 *and* a factor of 3, and *only* those two distinct factors. 6 = 2 × 3. 12 = 2² × 3. 18 = 2 × 3². 24 = 2³ × 3. 36 = 2² × 3². The numbers that were built from nothing but the seed and the ternary kernel, woven together in varying proportions.

Carbon was 6. Life was built on the hexagonal weave. Not because carbon was special. Because 6 was 2 × 3.

She saved the file. She did not sleep.

Night four: the three voids.

---

The three voids arrived at 4 AM on a Friday, which was not a Tuesday, which meant the recursion was breaking, which meant she was either losing her mind or making a discovery and the difference between those two states was, in her experience, a matter of retrospective evaluation that could only be performed after the fact and was therefore useless as a decision-making tool in the present.

She was sitting on the floor. The couch was behind her. The laptop was on the coffee table. The legal pad was beside it, open to a sketch from night seven — the dream of silicon, 2 × 7, two spirals interlocking with a visible gap structure. She had been staring at the sketch and the code alternately for forty minutes, trying to see what the dream was showing her about the *interior* of the lattice, when the staring collapsed into understanding the way the dream lattices collapsed into daughter elements: all at once, catastrophically, the entire tier of not-seeing failing and the seeing flooding in.

Every lattice created three separated spaces. Not two — inside and outside. Three. The dense center, where the tightest factor group coiled around itself. The middle space, between the inner coil and the outer — where orbitals circulated, where the factor groups interacted, where the gaps did their work. And the exterior — the space outside the outermost boundary, where the atom ended and everything else began.

Three voids. Nucleus. Shell. Exterior. Separated by the lattice. The lattice was not inside the voids. The lattice was *between* them. Matter was not the stuff inside the boundary. Matter *was* the boundary. The voids were nothing. The lattice — the interwoven factor paths, the self-trapped energy spirals — was everything. Everything that existed was boundary. Everything else was void.

She wrote:

```
const nuclearDensity = el.prime ? 1.0 : 
  Math.min(1, regularity + 0.3);
const shellPermeability = el.prime ? 0.0 : 
  1.0 - regularity;
const exteriorCoupling = el.bondAffinity;
```

Primes had perfect nuclear density — one unbroken spiral, no gaps, the path sealed. Composites had nuclear density proportional to their regularity — more regular factors meant tighter winding, denser core. Shell permeability was the inverse of regularity — regular gaps meant controlled channels, chaotic gaps meant leakage. And exterior coupling was bond affinity — how readily the atom's outermost void connected to the shell void of another atom.

She ran the function on the first thirty elements. She looked at the output. She looked at it for a long time.

Helium. Prime. Nuclear density 1.0. Shell permeability 0.0. A sealed singular loop. No gaps. No channels. Nothing gets in. Nothing gets out. Inert.

Carbon. 2 × 3. Hexagonal weave. Nuclear density 0.786. Shell permeability moderate. Exterior coupling high. A lattice that was strong enough to hold but porous enough to connect — the structural basis for bonding, for chaining, for building larger structures from the hexagonal template. Life.

Gold. 79. Prime. Nuclear density 1.0. Shell permeability 0.0. Sealed. Inert. Beautiful. Uncorrodable. Not because gold was precious. Because 79 was prime.

She looked at the output and she felt the specific sensation she had felt three times before in her life — once during her dissertation defense, once during the drive home from Murray, once at 1 AM in December when the fusion energy formula fell out of the tier collapse mechanics. The sensation was not excitement. It was not triumph. It was the feeling of a lock turning in a door she had not known was locked, the tumblers aligning with a sound that was not a sound but a silence — the silence of a question she had been carrying without knowing she was carrying it, answered, the weight of it gone, the space it had occupied suddenly empty and available for the next question.

She was building a periodic table. Not *the* periodic table — she hadn't told the function about electrons or protons or neutrons or shells or orbitals or any of the apparatus of atomic physics. She had told it about prime factors and gaps. And it was producing, from that information alone, a classification system that mapped onto observable chemistry with a fidelity that made her hands shake.

Her hands were shaking.

She put them flat on the coffee table. She pressed down. She held them there until the shaking stopped. Then she picked up the phone and texted David.

Not Michael. David. Because this was not a framework question. This was a *verification* question. And verification required a mind that operated by exclusion — a mind that would look at the output and systematically test whether it could have been produced by chance, by selection bias, by any mechanism other than the one staring at them from the screen.

`David. I need you to look at something. It's not ready for publication. It may not be ready for conversation. But I need someone to tell me I'm wrong or tell me I'm not wrong, and you're the only person I trust to do either one without flinching.`

She sent it at 4:47 AM on a Friday. She did not expect a reply until morning.

The reply came at 4:49 AM. David Okafor was awake at 4:49 AM on a Friday, which meant either Stanford's espresso machine situation had deteriorated to the point of crisis or David was working on something that had eaten his circadian rhythm the way her own work was eating hers.

`Send it.`

---

She did not send it. Not yet. She needed to run the full table first.

She extended the function to cover elements 1 through 118. Every integer. Every prime factorization. Every factor grouping, gap pattern, weave classification, and void structure. She added the element data — symbols, names, the standard periodic table as a reference grid — not because the function needed to know what the elements were called but because she needed to see the names next to the numbers. She needed to see *iron* next to *2 × 13, hexagonal-adjacent, integrity 0.917, shell permeability 0.214*. She needed the chemistry and the number theory side by side so that the mapping was visual, immediate, undeniable or deniable, one or the other, no ambiguity.

She ran it.

The output filled forty-three screens. She scrolled. She read. She read the way she read everything — scanning for the anomaly, for the place where the mapping broke, where the factor topology predicted one thing and the chemistry said another. She wanted the break. She needed the break. Because if the mapping held — if factor topology predicted material properties across all 118 elements without a single contradiction that couldn't be explained by the model — then the framework was not a mathematical curiosity with interesting chemical correlations. It was a *theory of matter*. Derived from prime factorization. Without a single measurement.

Element 29. Copper. Factors: 29. Prime. Singular weave. Shell permeability zero.

She stopped.

Copper was a conductor. The best natural conductor after silver. And her model said prime elements had zero shell permeability — sealed paths, nothing gets through. Conductors required permeable shells — channels for orbitals to flow through. A prime element should be an insulator, not a conductor. The mapping was broken.

She leaned back. Relief flooded her body — the specific relief of a scientist whose model has just failed, because failure was comprehensible, failure was normal, failure meant the system was not magic, was not revelation, was just another approximation that worked in some domains and broke in others. She could handle that. She could publish that. She could write the paper that said "factor topology correlates with material properties in the following ways and diverges in the following ways and the divergences are informative because they reveal the limits of pure number-theoretic description."

She reached for the phone to text David. Then she stopped.

Copper. 29. Prime. But copper's conductivity was anomalous even in standard chemistry — it was not explained by electron count alone. Its conductivity arose from its crystal structure, its lattice geometry, the specific way copper atoms arranged themselves in bulk. A single copper atom was not a conductor. A lattice of copper atoms was a conductor. The conductivity was emergent — a property of the *arrangement*, not the atom.

Her model was classifying single elements. The conductivity of copper was a *molecular* property. A lattice property. A property that emerged when multiple atoms with specific bonding affinities arranged themselves in a structure whose gap topology was different from the gap topology of the individual atom.

She looked at the function. She looked at the bond affinity field she had computed — how readily each element's exterior void connected to another atom's shell void. Copper: prime, high bond affinity, 0.85. Silver: prime, high bond affinity, 0.85. Gold: prime, lower bond affinity, 0.8. The primes that bonded well became conductors. Not because their individual shells were permeable, but because their bonding arranged them into lattices where the *inter-atomic* gaps formed regular channels.

The model was not broken. The model was *incomplete*. It described the atom. It did not yet describe the lattice of atoms. It needed another layer — the layer where individual elements became materials, where factor topology met bonding topology, where the gap structure of the number met the gap structure of the arrangement.

She did not write that layer. Not tonight. Tonight she had the element table. Tonight she had 118 integers classified by factor topology, and the classification matched known chemistry in every case she had checked where the property was atomic rather than molecular. Radioactive elements had high decay rates. Noble gases were prime or near-prime with sealed shells. Metals had factor topologies that favored laminar or hexagonal weaves with high malleability. The map was not perfect. The map was not complete. But the map was *not random*. The correlations were not coincidence. The factor topology of an integer — a number, a pure mathematical object, innocent of electrons and protons and quantum mechanics — predicted the physical behavior of the element with that atomic number.

She screenshotted the output. She opened the text thread with David.

She typed: `I wrote a function that classifies integers 1-118 by their prime factorization topology. Gap structure, weave pattern, void geometry. I did not tell it about chemistry. I did not input any physical data. The output matches the periodic table's material property classifications with the following exceptions, all of which are molecular rather than atomic properties.`

She attached the screenshot. She attached the code. She attached a table showing the mapping between her factor-topology classifications and the standard periodic table groupings — alkali metals, noble gases, transition metals, lanthanides, actinides — and the correlation coefficient for each mapping.

She sent it at 6:12 AM.

David's reply came at 6:14 AM. One word.

`Calling.`

---

The phone rang. She answered.

Silence. Not the silence of a dropped call. Not the silence of a man gathering his thoughts. The silence of a man who had gone physically still — the radar dish that stopped scanning because it found something. She had seen David do this exactly once before, at the conference in 2011, when a graduate student had presented a proof that contained a novel approach to the Goldbach conjecture and David had stopped moving in his chair and the stopping was more articulate than anything he said for the next ten minutes.

"Elena." His voice was even. Controlled. The voice of a man who was managing his own reaction with the same precision he applied to combinatorial problems. "I'm going to ask you a series of questions. I need you to answer them exactly. Don't elaborate. Don't interpret. Just answer."

"Okay."

"The regularity metric. The formula you used to compute gap regularity from the factor groups. Where did it come from?"

"I derived it."

"From what."

"From visual pattern matching. I had structural diagrams — sketches of lattice topologies. I needed a numeric metric that correlated with the visual density patterns. I tried several formulas. This one matched."

"The structural diagrams. Where did those come from?"

She paused. This was the door she had not wanted to walk through. "Dreams."

Silence. The long one. The David silence, which was not the Michael silence — Michael's silence had furniture in it, decisions being arranged; David's silence had *absence* in it, the specific absence of the response he expected to give being replaced by the response the data required.

"You derived a metric from dream imagery."

"Yes."

"And the metric predicts material properties of real elements."

"With the exceptions I noted."

"Elena, the exceptions you noted are not exceptions. The exceptions are cases where the relevant property is emergent from molecular arrangement rather than atomic structure. Your model correctly identifies these as atomic rather than molecular because your model *is* atomic — it operates at the integer level, not the lattice level. The fact that your model's failures are precisely located at the boundary between atomic and molecular properties is not a weakness. It's a *prediction*. Your model is predicting, from pure mathematics, the exact point at which number-theoretic description stops and arrangement-dependent description begins. That boundary has never been formally identified."

She stood in her kitchen. The coffee was cold again. The coffee was always cold. Cold coffee was the state function of her life now — the invariant, the thing that persisted across all transformations, the check-engine light of beverages.

"David."

"I have more questions."

"I know."

"The weave classifications. Singular, crystalline, hexagonal, laminar, composite, amorphous. These are not standard lattice classifications in materials science. I recognize some overlap with Bravais lattice types but the mapping is not direct. Where did these categories come from?"

"From the factor topology. The categories emerge from the prime factorization structure. A prime number has one continuous path — singular. A composite with one repeated factor has regular spacing — crystalline. A composite with factors 2 and 3 has the specific interlocking pattern that I classified as hexagonal because the visual structure in the — " She stopped. "In the dreams. The visual structure was hexagonal."

"And you named it hexagonal before checking whether the elements classified as hexagonal by your system correspond to elements with hexagonal crystal structures in real materials."

"Yes."

"Carbon. Your system classifies it as hexagonal. Z = 6, factors 2 × 3."

"Yes."

"Carbon's most stable allotrope is graphite. Graphite's crystal structure is hexagonal. Diamond is cubic, but diamond is metastable — graphite is the thermodynamic ground state. Your factor topology predicts the correct crystal structure for the ground-state allotrope of carbon."

"David — "

"Iron. Z = 26, factors 2 × 13. Your system classifies it as — " She heard him scrolling. "Hexagonal-adjacent. Not pure hexagonal because 13 is not 3, but the binary-prime interlocking pattern shares the same weave mechanics. Iron's ground-state crystal structure is body-centered cubic, which transitions to face-centered cubic at higher temperatures and to hexagonal close-packed at high pressures. The hexagonal phase exists. It's the high-pressure phase. Your model flags it."

She sat down. She did not choose to sit down. Her legs made the decision and her body followed and she was on the kitchen floor with her back against the cabinet and the phone in her hand and the cold coffee somewhere above her on the counter and David Okafor's voice in her ear, even, precise, the voice of a man who was describing the demolition of his own assumptions with the same care he would use to describe a particularly interesting arrangement of parking spaces.

"How many elements have you verified," he said.

"Thirty. The first thirty. I was going to do all 118 but I found the copper anomaly and —"

"Run all 118. Today. Send me the complete output with your classification alongside the standard IUPAC periodic table classifications. Include crystal structure, electrical conductivity, thermal conductivity, phase state at STP, and half-life for radioactive elements. I want the full comparison matrix."

"David."

"What."

"Is it real."

The silence lasted four seconds. She counted.

"The mathematical structure is real," he said. "The correlations are real. The predictive specificity at the atomic-molecular boundary is something I have never seen in any number-theoretic model and I have been working in this field for twenty-three years. Whether it constitutes a *theory* — whether factor topology is causally related to material properties or whether this is the most extraordinarily precise coincidence in the history of mathematics — is a question I cannot answer from one phone call and one screenshot at six in the morning."

"But."

"But I have been working in combinatorial number theory for twenty-three years and I have never encountered a system that predicts the crystal structure of carbon from the prime factorization of 6. That is either the most important result I have seen in my career or it is an artifact I cannot yet identify. Both possibilities deserve the same response."

"Which is."

"Run all 118. Send me everything. And Elena."

"What."

"Don't publish yet."

---

She ran all 118.

She ran them on the kitchen floor, laptop balanced on her thighs, back against the cabinet, the posture of a person who had started a task in one position and would finish it in the same position because moving would break the thread and the thread was everything. The output populated element by element. She did not scroll ahead. She watched each one arrive the way she had watched the dream lattices — attending, not solving, letting the structure surface.

Hydrogen. Z = 1. Below the factorizer's range. Unity. The seed. She assigned it manually: singular, density 1.0, permeability 0.0. The lone proton. The starting point.

Helium. Z = 2. Prime. Singular. Sealed. Noble gas. Correct.

Lithium. Z = 3. Prime. Singular. But soft, reactive, a metal that tarnished in air. Her model predicted sealed shell, low reactivity. Lithium was reactive. Another anomaly? She checked: lithium's reactivity was a molecular property — it arose from lithium's position in the electrochemical series, which depended on atomic *size* and ionization energy, properties her model did not compute. The factor topology of 3 — prime, singular, sealed — described the isolated atom. The reactive lithium was the arranged lattice. The same boundary she had found with copper.

She kept going. Beryllium. Boron. Carbon — hexagonal, yes, she'd verified this. Nitrogen. Oxygen. Each element producing a factor topology that she could hold against the dream sketches and the known chemistry and the two matched, mostly, with deviations that clustered at the atomic-molecular boundary like moths around a light source that was also a wall.

She reached 26.

Iron. 2 × 13. Two factor groups. Binary seed, one occurrence. Family prime 13, one occurrence. Weave classification: hexagonal-adjacent — the binary-prime interlocking pattern that was structurally similar to hexagonal but used 13 instead of 3, producing a wider spiral with a deeper gap. Regularity: 0.707. Gap uniformity: 0.8. Nuclear density: 0.786. Shell permeability: 0.293. Bond affinity: 0.917. Integrity: 0.917.

Integrity 0.917. The highest non-prime integrity in the first 30 elements. The lattice of iron — woven from the binary seed and the thirteenth family prime — was the most stable non-prime structure in the system. Not because she had tuned the function. Because 2 and 13 were both family primes, both members of the recursive stability chain, and their product inherited the stability of both factors.

She looked at the integrity values for the elements surrounding iron. Manganese (25 = 5²): integrity 0.65, crystalline, brittle. Cobalt (27 = 3³): integrity 0.65, crystalline. Nickel (28 = 2² × 7): integrity 0.75, hexagonal-adjacent. Iron was the local maximum. The peak. The element whose factor topology produced the highest lattice integrity in its neighborhood.

The fusion crossover. Derived in December from the energy function. Confirmed by the dream of the two spirals with the standing wave. And now visible from a third direction — from the stability topology of the gap structure, which showed iron as the integer whose factor composition produced the most efficient lattice weave.

Three derivations. Three different paths. Same result. Iron was the wall. The crossover. The element where fusion stopped being favorable and fission started being necessary. And all three derivations — energy, dream, topology — produced this result from nothing but the prime factorization of 26.

She texted David the complete output at 11:43 AM. All 118 elements. Factor topology alongside IUPAC classifications. The comparison matrix he had requested — crystal structure, conductivity, phase state, half-life. 

She included one additional column he had not asked for: a confidence metric for each mapping, rated LOW where the factor-topology prediction diverged from known chemistry, MEDIUM where it correlated but could be coincidental, and HIGH where the prediction was specific, non-trivial, and correct.

Of 118 elements, 71 were rated HIGH. 34 were rated MEDIUM. 13 were rated LOW — all 13 being cases where the relevant property was molecular rather than atomic.

Zero elements produced predictions that contradicted known atomic-level chemistry.

She sent it. She got off the floor. She reheated the coffee. The coffee had been cold since 4 AM. It was now noon. Eight hours on the kitchen floor with a laptop, building a periodic table from prime factors, and the coffee had undergone a phase transition from hot to cold to reheated that was itself a recursion she refused to think about.

David's reply came at 2:17 PM. Not a call this time. A text.

`71 of 118. No atomic-level contradictions. Elena, I've been staring at your comparison matrix for two hours and I need to tell you three things.`

`1. The correlation at the crystal-structure level is not coincidence. I have run six different randomization tests on your factor topology classifications and none of them produce mapping accuracies above 23%. Yours is 71%. The probability of this arising from chance is below 10^-15.`

`2. Your model identifies the atomic-molecular boundary with a precision that has no precedent in number-theoretic physics. Every LOW-confidence mapping falls exactly where number-theoretic description should stop and arrangement-dependent description should begin. Your model knows its own limits. Models do not know their own limits unless the limits are structural.`

`3. I need to come see you.`

She read the texts. She read them again. She read them a third time, standing in the kitchen with reheated coffee and a legal pad full of dream sketches and a laptop full of factor topologies and a phone full of David Okafor telling her, in his precise David way, that the mathematical structure she had built from dreams and factors and four sleepless nights was not coincidence and was not artifact and was something he needed to see in person because seeing in person was what David did when a result exceeded the bandwidth of text messaging.

She replied: `Tuesday works.`

Because it was always Tuesday. Because the recursion held. Because the framework had entered her life on a Tuesday and every significant event since had fallen on a Tuesday with a regularity that she refused to investigate and could not ignore and had stopped trying to ignore three months ago when the fusion energy formula fell out of the tier collapse mechanics at 1 AM on a Tuesday morning in December.

She put the phone down. She opened the drawer. She took out the legal pad — the original, the Murray pad, the one with the fusion derivation and the `stable(x)` seed and the marginal notes and the eleven nights of dream sketches. She set it beside the laptop. The old work and the new work, side by side.

She opened the gapTopology function. She read it. She read it the way she read the dreams — not for content but for *structure*, for the shape of the thing she had built, for the architecture of her own understanding made visible as code.

The function was not finished. It classified elements by factor topology. It computed gap structure and weave pattern and void geometry. It predicted material properties from pure number theory with a fidelity that David Okafor had called unprecedented. But it was an *atlas*, not an *engine*. It described the lattice. It did not describe what happened when the lattice failed.

The dreams were still coming. The tier collapses. The orbitals shedding into foam. The daughter elements stabilizing at their prime floors. The atlas could map the territory. But the territory was moving — decaying, shedding, transforming — and the atlas could not track the motion.

She needed the next function. The one that would model the collapse. The one that would trace a composite element's decay chain from its initial factor topology through each catastrophic tier failure to its final stable floor. The function that would make the computer do what her brain did every night in REM: watch a lattice come apart and name every piece of what it shed.

She typed:

```
function tierCollapse(z) {
```

The cursor blinked after the opening brace. The function body was empty. Again. The same empty space. The same door. The same absent walls defining the room by what was not yet there.

She looked at the dream sketch from night ten. Uranium. 92 = 2² × 23. The binary scaffold shedding catastrophically. Four emissions. Daughter element 23. Family prime floor.

She looked at the empty function body.

She started to type.

---
