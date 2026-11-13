// Chapter-owned fraction resources. No week, account or persistent learner state is stored here.
import { validateQuiz } from './lessons.js';

export const FRACTION_SKILLS = ['l71', 'l72', 'l73', 'l74', 'l75', 'l76', 'l77'];
export const FRACTION_VOCAB_MODES = { fvchoice: 'choice', fvtf: 'truefalse', fvfill: 'fill' };
export const FRACTION_PRACTICE_ACTS = ['fpractice', 'fchoice', 'ftf', 'ffill'];
const clone = (x) => JSON.parse(JSON.stringify(x));
const shuffled = (items, rand) => { const out = items.slice(); for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; };
const text = (x) => typeof x === 'string' && x.trim() !== '';
const blanks = (x) => typeof x === 'string' && x.split('___').length === 2;
const contextsOf = (w) => {
  const list = [...(w.contexts || []), w.fill, typeof w.example === 'string' ? w.example.replace(new RegExp(w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '___') : null];
  return [...new Set(list.filter(blanks))];
};

// Bind authored word explanations to the actual generated choices, including shuffled distractors.
function vocabularyTeaching(item, word, words, claim = null) {
  if (!word.teaching) return item;
  const teaching = clone(word.teaching);
  if (claim?.node) {
    teaching.correct = { ...clone(claim.node), text: `False. ${claim.node.reason}`, revealsAnswer: true };
  } else if (claim) {
    const reason = item.truth ? `This statement matches ${word.word}.` : claim.reason;
    teaching.correct.text = `${item.truth ? 'True' : 'False'}. ${reason} ${teaching.correct.text}`;
    if (!item.truth && claim.other?.model && word.model) teaching.correct.models = [
      { ...claim.other.model, caption: `Picture for ${claim.other.word}` }, { ...word.model, caption: `Picture for ${word.word}` },
    ];
  }
  if (item.type === 'choice') teaching.wrong = item.options.filter((option) => !option.correct).map((option) => {
    const selected = words.find((candidate) => candidate.word === option.text || candidate.def === option.text);
    const base = teaching.wrong.find((node) => node.when === 'default' || (!node.when && node.option === undefined)) || teaching.correct;
    return { ...base, option: option.text, when: undefined, revealsAnswer: true,
      ...(claim?.node ? { model: teaching.correct.model, models: teaching.correct.models } : {}),
      text: claim ? teaching.correct.text : `${selected ? `${selected.word}: ${selected.def}${/[.!?]$/.test(selected.def) ? '' : '.'}` : option.why || ''} ${base.text}`.trim(),
      ...(claim && teaching.correct.models ? { models: teaching.correct.models } : {}),
      ...(selected?.model && word.model ? { models: [{ ...selected.model, caption: `Picture for ${selected.word}` }, { ...word.model, caption: `Picture for ${word.word}` }] } : {}),
    };
  });
  return { ...item, teaching };
}

/** Twenty practice questions per vocabulary mode, with teacher definitions preserved verbatim. */
export function fractionVocabItems(pack, kind, rand = Math.random) {
  const words = pack?.vocabulary || [];
  if (words.length < 4) return [];
  return Array.from({ length: 20 }, (_, i) => {
    const w = words[i % words.length], round = Math.floor(i / words.length);
    const other = words[(i % words.length + round + 1) % words.length];
    const contexts = contextsOf(w), context = contexts[(round ? round - 1 : 0) % Math.max(1, contexts.length)] || `The term for "${w.def}" is ___.`;
    const base = { id: `fv-${kind}-${i + 1}`, word: w.word, kind, hints: ['Think about what this term describes in a fraction model.'], show: [`${w.word}: ${w.def}`], explain: `${w.word}: ${w.def}` };
    if (kind === 'fill') return vocabularyTeaching({ ...base, type: 'word', prompt: contexts[round % Math.max(1, contexts.length)] || context, answer: w.word.toLowerCase(), bank: shuffled(words.map((v) => v.word.toLowerCase()), rand), yes: `Compare the completed statement with the definition: ${w.def}`, retry: 'Use the whole sentence to choose the term.' }, w, words);
    if (kind === 'truefalse') {
      const truth = (i % 2) === (round % 2);
      const falseNode = !truth && round > 0 ? w.falseStatements?.[Math.floor((round - 1) / 2) % Math.max(1, w.falseStatements?.length || 0)] : null;
      const statement = falseNode ? falseNode.statement : round === 0 || !truth ? `"${w.word}" means "${truth ? w.def : other.def}".` : context.replace('___', w.word.toLowerCase());
      return vocabularyTeaching({ ...base, type: 'choice', prompt: `True or false? ${statement}`, truth, options: [{ text: 'True', ...(truth ? { correct: true } : { why: `Use ${w.word} in this statement. ${w.def}` }) }, { text: 'False', ...(!truth ? { correct: true } : { why: `The statement agrees with ${w.word}: ${w.def}` }) }], yes: `${truth ? 'True' : 'False'}. ${w.word}: ${w.def}` }, w, words, {
        other, node: falseNode,
        reason: round === 0 || !falseNode ? `The quoted meaning describes ${other.word}. The picture for ${w.word} shows a different idea.` : `This sentence needs ${w.word}; it currently uses ${other.word}.`,
      });
    }
    const meaning = round === 0;
    const definitionCue = w.def.replace(new RegExp(w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '___');
    const prompt = meaning ? `What does "${w.word}" mean?` : round === 1 ? (definitionCue.includes('___') ? `Which term completes this definition? ${definitionCue}` : `Which term means: ${w.def.replace(/\.$/, '')}?`) : `Which term completes this statement? ${context}`;
    const others = shuffled(words.filter((v) => v !== w), rand).slice(0, 3);
    const options = shuffled([{ text: meaning ? w.def : w.word, correct: true }, ...others.map((v) => ({ text: meaning ? v.def : v.word, why: `${v.word}: ${v.def}` }))], rand);
    return vocabularyTeaching({ ...base, type: 'choice', prompt, options, yes: `${w.word}: ${w.def}` }, w, words);
  });
}

/** Practice subsets retain their authored objectives and all items are fresh per visit. */
export function fractionPracticeItems(pack, act, rand = Math.random) {
  let list = pack?.practice?.items || [];
  if (act === 'fchoice') list = list.filter((x) => x.type === 'choice' && !(x.options.length === 2 && x.options.every((o) => ['True', 'False'].includes(o.text))));
  if (act === 'ftf') list = list.filter((x) => x.type === 'choice' && x.options.length === 2 && x.options.every((o) => ['True', 'False'].includes(o.text)));
  if (act === 'ffill') list = list.filter((x) => ['fraction', 'number', 'blanks', 'fill'].includes(x.type));
  return shuffled(list.map(clone), rand);
}

/** Validate only declared chapter-owned resources; optional teacherWords verifies exact source definitions. */
export function validateFractionChapter(pack, teacherWords = null) {
  const problems = [];
  if (!pack || pack.id !== 7 || !text(pack.title)) return ['Chapter 7 needs id 7 and a title'];
  const words = pack.vocabulary;
  if (!Array.isArray(words) || words.length !== 6) return ['Chapter 7 needs its six vocabulary terms'];
  const seen = new Set();
  for (const w of words) {
    if (!text(w.word) || !text(w.def) || !text(w.example) || !['teacher', 'review'].includes(w.source)) problems.push('Every fraction word needs word, definition, example and source');
    if (seen.has(String(w.word).toLowerCase())) problems.push(`Duplicate fraction term ${w.word}`);
    seen.add(String(w.word).toLowerCase());
    if (contextsOf(w).length < 4) problems.push(`${w.word} needs four distinct contextual blanks (including its example)`);
    if (teacherWords && w.source === 'teacher') {
      const original = teacherWords.find((t) => t.word.toLowerCase() === w.word.toLowerCase());
      if (!original || original.def !== w.def) problems.push(`Teacher definition mismatch for ${w.word}`);
    }
  }
  if (words.filter((w) => w.source === 'teacher').length !== 4) problems.push('Four vocabulary terms must retain teacher provenance');
  for (const mode of ['choice', 'truefalse', 'fill']) {
    const items = fractionVocabItems(pack, mode, () => 0.37);
    problems.push(...validateQuiz(items, 1, `Chapter 7 vocabulary ${mode}`));
    if (new Set(items.map((x) => x.prompt)).size !== 20) problems.push(`Chapter 7 ${mode} needs twenty distinct prompts`);
  }
  if (!Array.isArray(pack.practice?.items) || pack.practice.items.length < 40) problems.push('Chapter 7 needs at least forty mixed practice questions');
  else problems.push(...validateQuiz(pack.practice.items, 1, 'Chapter 7 practice'));
  if (!Array.isArray(pack.test?.items) || pack.test.items.length !== 28) problems.push('Chapter 7 cumulative test needs twenty-eight questions');
  else {
    problems.push(...validateQuiz(pack.test.items, pack.test.pass, 'Chapter 7 test'));
    for (const skill of FRACTION_SKILLS) if (pack.test.items.filter((x) => x.skill === skill).length !== 4) problems.push(`Chapter 7 test needs four questions for ${skill}`);
    if (pack.test.items.some((x) => !FRACTION_SKILLS.includes(x.skill))) problems.push('Chapter 7 test contains an unknown lesson skill');
  }
  if (!Array.isArray(pack.guide?.sections) || !pack.guide.sections.length) problems.push('Chapter 7 needs a printable study guide');
  return problems;
}
