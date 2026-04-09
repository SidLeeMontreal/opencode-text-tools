import type { AiPattern } from "./types.js"

const K = (keywords: string[], explanation: string, fixSuggestion: string, category: AiPattern["category"], severity: AiPattern["severity"], regexes?: RegExp[]): AiPattern => ({
  id: "",
  name: "",
  category,
  severity,
  keywords,
  regexes,
  explanation,
  fixSuggestion,
})

export const AI_PATTERNS: AiPattern[] = [
  { ...K(["stands as", "serves as", "is a testament", "pivotal moment", "evolving landscape", "key turning point", "indelible mark", "setting the stage for"], "Inflates ordinary facts into grand significance.", "Replace broad significance claims with concrete facts.", "content", "medium"), id: "significance_inflation", name: "Significance inflation" },
  { ...K(["independent coverage", "local media outlets", "regional media outlets", "national media outlets", "leading expert", "active social media presence"], "Uses vague notability markers instead of evidence.", "Name the specific source and why it matters.", "content", "medium"), id: "notability_name_dropping", name: "Notability and media padding" },
  { ...K(["highlighting", "underscoring", "emphasizing", "ensuring", "reflecting", "symbolizing", "contributing to", "fostering", "showcasing"], "Adds shallow depth through dangling -ing phrases.", "Turn the phrase into a direct statement or cut it.", "content", "medium", [/\b\w+ing\b[^.!?]{0,80}(?:,\s*(?:highlighting|underscoring|emphasizing|reflecting|symbolizing|contributing|fostering|showcasing))/gi]), id: "superficial_ing_endings", name: "Superficial -ing endings" },
  { ...K(["boasts", "vibrant", "nestled", "in the heart of", "groundbreaking", "renowned", "breathtaking", "diverse array"], "Uses ad-like hype instead of neutral description.", "Use plain language and concrete attributes.", "language", "high"), id: "promotional_language", name: "Promotional language" },
  { ...K(["industry reports", "observers have cited", "experts argue", "some critics argue", "several sources", "based on reports"], "Attributes claims to vague authorities.", "Cite the source directly or remove the attribution.", "content", "medium"), id: "vague_attributions", name: "Vague attributions" },
  { ...K(["despite these challenges", "future outlook", "challenges and legacy", "future prospects"], "Falls into generic challenge/prospect template writing.", "Replace boilerplate sections with concrete developments.", "content", "medium"), id: "formulaic_challenges_section", name: "Formulaic challenges section" },
  { ...K(["Additionally", "align with", "crucial", "delve", "emphasizing", "enduring", "enhance", "fostering", "garner", "highlight", "interplay", "intricate", "intricacies", "key", "landscape", "meticulous", "pivotal", "showcase", "tapestry", "testament", "underscore", "valuable", "vibrant"], "Contains common post-2023 AI vocabulary clusters.", "Swap inflated vocabulary for simpler wording.", "language", "high"), id: "ai_vocabulary", name: "AI vocabulary" },
  { ...K(["serves as a", "stands as a", "marks a", "represents a", "boasts a", "features a"], "Avoids simple is/are/has constructions in a suspiciously polished way.", "Use plain copulas when they are the most direct fit.", "language", "medium"), id: "copula_avoidance", name: "Copula avoidance" },
  { ...K(["it's not just", "not merely", "not only"], "Uses overfamiliar negative-parallel rhetoric.", "State the point directly instead of setting up a contrast.", "language", "medium", [/\bnot only\b[^.]{0,100}\bbut also\b/gi]), id: "negative_parallelisms", name: "Negative parallelisms" },
  { ...K([], "Forces ideas into neat three-item rhetorical bundles.", "Keep only the items you need; avoid ornamental triads.", "style", "low", [/\b[^,.\n]{2,40},\s+[^,.\n]{2,40},\s+(?:and|or)\s+[^,.\n]{2,40}\b/gi]), id: "rule_of_three", name: "Rule of three" },
  { ...K([], "Cycles through synonyms instead of repeating the clearest noun.", "Prefer the right repeated noun over needless variation.", "language", "low", [/\b(?:protagonist|main character|central figure|hero)\b/gi]), id: "synonym_cycling", name: "Synonym cycling" },
  { ...K([], "Uses from X to Y ranges where the endpoints are not a meaningful scale.", "List the actual topics instead of framing them as a range.", "style", "low", [/\bfrom [^,.\n]{3,50} to [^,.\n]{3,50}\b/gi]), id: "false_ranges", name: "False ranges" },
  { ...K([], "Possible passive construction detected.", "Prefer an active subject where it improves clarity.", "language", "medium", [/\b(?:is|are|was|were|be|been|being|get|gets|got)\s+\w+(?:ed|en)\b/gi]), id: "passive_voice", name: "Passive voice" },
  { ...K([], "Frequent em dashes are a common AI and sales-copy tell.", "Use commas or sentence breaks unless the dash adds real rhythm.", "style", "medium", [/—/g]), id: "em_dash_overuse", name: "Em dash overuse" },
  { ...K([], "Repeated bold formatting can feel mechanically emphasized.", "Keep bold for true emphasis only.", "style", "low", [/\*\*[^*]+\*\*/g]), id: "boldface_overuse", name: "Boldface overuse" },
  { ...K([], "AI often produces bullet lists with inline bold headers.", "Rewrite as plain bullets or prose.", "style", "medium", [/^\s*[-*+]\s+(?:\*\*[^*]+:\*\*|[^:]{1,80}:)/gm]), id: "inline_header_lists", name: "Inline header lists" },
  { ...K([], "Title Case headings often signal AI default heading habits.", "Use sentence case unless the style guide says otherwise.", "style", "low", [/^#{1,6}\s+[A-Z][A-Za-z0-9]+(?:\s+(?:[A-Z][A-Za-z0-9]+|and|or|the|of|in|to)){2,}$/gm]), id: "title_case_headings", name: "Title case headings" },
  { ...K([], "Emoji-decorated bullets and headings often read as chatbot formatting.", "Remove the emoji and keep the text.", "style", "low", [/^[\s>*-]*[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gmu]), id: "emoji_headings_bullets", name: "Emoji headings and bullets" },
  { ...K([], "Curly quotes are often pasted straight from model output.", "Switch to straight quotes if the house style requires it.", "style", "low", /[“”‘’]/g instanceof RegExp ? [/[“”‘’]/g] : undefined), id: "curly_quotes", name: "Curly quotes" },
  { ...K([], "Hyphen-stacked adjective pairs can feel generated and generic.", "Use one precise adjective instead of a fused pair.", "style", "low", [/\b\w+-\w+\b/g]), id: "hyphenated_word_pairs", name: "Hyphenated word pairs" },
  { ...K(["at its core", "what matters most is", "the key takeaway is", "fundamentally"], "Uses authority-signalling framing to force a conclusion.", "Say the point plainly and let the evidence carry it.", "communication", "medium"), id: "persuasive_authority_tropes", name: "Persuasive authority tropes" },
  { ...K(["let's dive in", "here's what you need to know", "without further ado", "in this piece"], "Announces the structure in a canned way.", "Cut the announcement and start with substance.", "communication", "medium"), id: "signposting_announcements", name: "Signposting announcements" },
  { ...K([], "Fragmented header labels can read like generated slide scaffolding.", "Turn the fragment into a real sentence or heading.", "style", "low", [/^(?:[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4}):\s*$/gm]), id: "fragmented_headers", name: "Fragmented headers" },
  { ...K(["i hope this helps", "let me know if", "of course!", "certainly!", "would you like me to"], "Chatbot conversation filler leaked into deliverable text.", "Remove the service-language wrapper.", "communication", "high"), id: "chatbot_artifacts", name: "Chatbot artifacts" },
  { ...K(["as of my training", "as of my knowledge cutoff", "while details are limited", "based on available information"], "Model uncertainty disclaimer leaked into content.", "Replace with sourced facts or remove.", "communication", "high"), id: "knowledge_cutoff_disclaimers", name: "Knowledge cutoff disclaimers" },
  { ...K(["great question", "you're absolutely right", "that's an excellent point", "absolutely"], "Over-accommodating tone sounds assistant-like.", "Acknowledge the point plainly without praise.", "communication", "medium"), id: "sycophantic_tone", name: "Sycophantic tone" },
  { ...K(["in order to", "due to the fact that", "at this point in time", "has the ability to", "it is important to note that", "it should be noted that"], "Verbose filler adds length without meaning.", "Cut the filler and use the shortest honest phrasing.", "filler", "high"), id: "filler_phrases", name: "Filler phrases" },
  { ...K(["could potentially", "possibly", "might", "may", "appears to", "seems to"], "Stacks uncertainty language beyond what the sentence needs.", "Keep only the minimum necessary hedging.", "filler", "medium"), id: "excessive_hedging", name: "Excessive hedging" },
  { ...K(["the future looks bright", "exciting times lie ahead", "a major step in the right direction", "journey toward excellence"], "Ends with vague upbeat closure instead of information.", "Replace the generic ending with a concrete next fact.", "filler", "medium"), id: "generic_positive_conclusions", name: "Generic positive conclusions" },
]

export const AI_PATTERN_MAP = Object.fromEntries(AI_PATTERNS.map((pattern) => [pattern.id, pattern]))
