// The eight sections, in navigation order. `id` is the hash route.
export const SECTIONS = [
  { id: 'week', label: 'This Week' },
  { id: 'spelling', label: 'Spelling' },
  { id: 'vocab', label: 'Vocabulary' },
  { id: 'math', label: 'Math' },
  { id: 'quickmath', label: 'Quick Math' },
  { id: 'homework', label: 'Homework' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'tests', label: 'Tests' },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);
export const sectionLabel = (id) => SECTIONS.find((s) => s.id === id)?.label || '';

/** Which section helps you study for each kind of test. */
export const TEST_SECTION = { math: 'math', vocab: 'vocab', spelling: 'spelling' };
