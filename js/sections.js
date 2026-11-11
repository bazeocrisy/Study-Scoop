// Registered sections. Stable hash IDs preserve existing activity links.
export const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'extra', label: 'Extra Learning' },
  { id: 'week', label: 'Schoolwork' },
  { id: 'spelling', label: 'Spelling' },
  { id: 'vocab', label: 'Vocabulary' },
  { id: 'reading', label: 'Reading' },
  { id: 'math', label: 'Math' },
  { id: 'skills', label: 'Skill Builders' },
  { id: 'homework', label: 'Homework' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'tests', label: 'Tests' },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);
export const sectionLabel = (id) => SECTIONS.find((s) => s.id === id)?.label || '';

/** Which section helps you study for each kind of test. */
export const TEST_SECTION = { math: 'math', vocab: 'vocab', spelling: 'spelling' };

export const EXTRA_SECTIONS = ['extra', 'reading', 'skills'];
export const SCHOOL_SECTIONS = ['week', 'homework', 'spelling', 'vocab', 'math', 'newsletter', 'tests'];
