// Writes data/reading/*.json from the original Reading Coach stories below. Run: node scripts/author/reading-stories.mjs
// Every story is original writing for Study Scoop (no classroom or published text is copied). It counts the words, marks the
// answer order of each question repeatably, and refuses to write a story that fails validateStory().
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyWords, validateReadingIndex, validateStory } from '../../js/lib/reading.js';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'reading');

/** A question: the right choice first, then two wrong ones. The right answer's place rotates 1st, 2nd, 3rd across the
 *  whole library, so a child cannot learn "it is never the first one" and the order is the same every time we run this. */
let turn = 1;
const Q = (type, ask, right, w1, w2, find) => {
  const at = turn++ % 3;
  const choices = [w1, w2];
  choices.splice(at, 0, right);
  return { type, ask, choices, answer: at, find };
};
const C = (s, text, el) => ({ s, text, el });
/** True or false: the statement is `ask`. */
const TF = (type, ask, answer, find) => ({ type, format: 'tf', ask, answer, find });
/** Fill in the blank: `ask` has one ___; `accept` lists other answers that are also right. */
const B = (type, ask, blank, accept, find) => ({ type, format: 'blank', ask, blank, accept: [blank, ...accept.filter((a) => a !== blank)], find });
/** Say it in your own words, then tap to see a model answer and check yourself. */
const SAY = (type, ask, answer, find) => ({ type, format: 'say', ask, answer, find });
/** Map elements answered by filling in a blank or by saying it. */
const EB = (text, blank, accept, answer, find) => ({ format: 'blank', text, blank, accept: [blank, ...accept.filter((a) => a !== blank)], answer, find });
const ES = (answer, find) => ({ format: 'say', answer, find });
const J = (o) => JSON.stringify(o);

const STEPS = [
  { n: 1, label: 'Step 1', about: 'Short and friendly: about 80 to 120 words. A good place to start.' },
  { n: 2, label: 'Step 2', about: 'A little longer: about 120 to 160 words.' },
  { n: 3, label: 'Step 3', about: 'Growing stamina: about 160 to 200 words.' },
  { n: 4, label: 'Step 4', about: 'Ready for more: 200 words or more.' },
];

const STORIES = [
  {
    id: 'stuckkite', title: 'The Stuck Kite', kind: 'story', step: 1, topic: 'Outdoors',
    sentences: [
      'One windy morning, Dev went to the park with his grandpa.',
      'Dev had a red kite.',
      'First, he ran fast and the kite rose up high.',
      'Then the wind pushed it into a big tree.',
      'The kite was stuck!',
      'Dev felt sad because he could not reach it.',
      'Grandpa smiled and said, "Let\'s find a way."',
      'Next, Grandpa found a long stick by the fence.',
      'Dev held the stick up and Grandpa helped him hook the string.',
      'Finally, the kite came down safe.',
      'Dev hugged his grandpa.',
      'He learned that it is okay to ask for help.',
    ],
    clues: [
      C(0, 'Dev', 'characters'), C(0, 'his grandpa', 'characters'),
      C(0, 'One windy morning', 'setting'), C(0, 'the park', 'setting'),
      C(3, 'pushed it into a big tree', 'problem'), C(4, 'stuck', 'problem'),
      C(2, 'First', 'events'), C(3, 'Then', 'events'), C(7, 'Next', 'events'),
      C(8, 'helped him hook the string', 'solution'), C(9, 'the kite came down safe', 'solution'),
      C(11, 'learned that it is okay to ask for help', 'lesson'),
    ],
    words: {
      hook: { say: 'HOOK', means: 'to catch something with a curved end', example: 'She used a stick to hook the bag.' },
      fence: { say: 'FENSS', means: 'a wall made of wood or wire around a yard', example: 'The dog stayed inside the fence.' },
      reach: { say: 'REECH', means: 'to stretch out and touch something', example: 'I can reach the top shelf with a stool.' },
    },
    elements: {
      characters: EB('The two characters are Dev and his ___.', 'grandpa', ['grandfather'], 'Dev and his grandpa', 0),
      setting: { answer: 'A park on a windy morning', wrong: ['A school on a rainy day', 'A beach on a sunny afternoon'], find: 0 },
      problem: ES('The kite got stuck in a tree.', 3),
      events: { order: ['Dev flew his kite.', 'The wind pushed the kite into a tree.', 'Grandpa helped get it down.'], find: [2, 3, 8, 9] },
      solution: { answer: 'Grandpa used a long stick to get the kite down', wrong: ['Dev climbed the tree', 'They bought a new kite'], find: 8 },
      lesson: EB('Dev learned that it is okay to ask for ___.', 'help', [], 'It is okay to ask for help', 11),
    },
    questions: [
      Q('listen', 'Where did Dev go?', 'To the park', 'To the beach', 'To school', 0),
      TF('listen', 'The kite got stuck in a tree.', true, 3),
      B('detail', 'First, Dev ran ___ and the kite rose up high.', 'fast', ['quickly'], 2),
      B('cause', 'Dev felt sad because he could not ___ his kite.', 'reach', ['get', 'touch'], 5),
      Q('detail', 'What did Grandpa find by the fence?', 'A long stick', 'A ladder', 'A rope', 7),
      TF('vocab', 'The word reach means to stretch out and touch something.', true, 5),
      SAY('main', 'What did Dev learn? Say it in your own words.', 'It is okay to ask for help.', 11),
    ],
  },
  {
    id: 'pip', title: 'Pip Finds a Home', kind: 'story', step: 1, topic: 'Animals',
    sentences: [
      'Pip was a small brown puppy with no home.',
      'She slept under a bench at the bus stop.',
      'One cold night, it began to rain.',
      'Pip shook and looked for a dry place, but she could not find one.',
      'Then a girl named Tia saw her.',
      '"You poor thing," said Tia.',
      'She took off her coat and wrapped it around Pip.',
      'Next, Tia carried the puppy home.',
      'Her mom gave Pip a bowl of warm food and a soft bed.',
      'In the morning, Pip wagged her tail.',
      'She had a home at last.',
      'Tia learned that being kind can change a life.',
    ],
    clues: [
      C(0, 'Pip', 'characters'), C(4, 'a girl named Tia', 'characters'),
      C(1, 'under a bench at the bus stop', 'setting'), C(2, 'One cold night', 'setting'),
      C(0, 'no home', 'problem'), C(3, 'could not find one', 'problem'),
      C(4, 'Then', 'events'), C(7, 'Next', 'events'), C(9, 'In the morning', 'events'),
      C(6, 'wrapped it around Pip', 'solution'), C(8, 'a bowl of warm food and a soft bed', 'solution'),
      C(11, 'learned that being kind can change a life', 'lesson'),
    ],
    words: {
      bench: { say: 'BENCH', means: 'a long seat for more than one person', example: 'We sat on a bench to rest.' },
      wrapped: { say: 'RAPT', means: 'covered something by putting it around', example: 'He wrapped a blanket around his legs.' },
      wagged: { say: 'WAGD', means: 'moved quickly from side to side', example: 'The happy dog wagged its tail.' },
    },
    elements: {
      characters: EB('The characters are Pip the ___ and a girl named Tia.', 'puppy', ['dog'], 'Pip the puppy and a girl named Tia', [0, 4]),
      setting: { answer: 'A bus stop on a cold, rainy night', wrong: ['A park on a sunny day', 'A school in the morning'], find: 2 },
      problem: ES('Pip had no home and no dry place.', 3),
      events: { order: ['Pip slept under a bench in the rain.', 'Tia wrapped her coat around Pip.', 'Pip woke up in a soft bed.'], find: [1, 2, 6, 8, 9] },
      solution: { answer: 'Tia took Pip home and gave her food and a bed', wrong: ['Pip ran to the park', 'The rain stopped by itself'], find: 8 },
      lesson: EB('Tia learned that being ___ can change a life.', 'kind', [], 'Being kind can change a life', 11),
    },
    questions: [
      Q('listen', 'What kind of animal was Pip?', 'A puppy', 'A kitten', 'A rabbit', 0),
      TF('listen', 'Pip slept in a warm barn.', false, 1),
      B('detail', 'Tia took off her ___ and wrapped it around Pip.', 'coat', ['jacket'], 6),
      Q('infer', 'Why did Tia give Pip her coat?', 'Pip was wet and cold', 'Pip was lost at school', 'Tia did not like the coat', [2, 3, 6]),
      TF('detail', 'Tia\'s mom gave Pip warm food and a soft bed.', true, 8),
      B('order', 'Next, Tia carried the puppy ___.', 'home', [], 7),
      SAY('main', 'What is the lesson of this story? Say it in your own words.', 'Being kind can change a life.', 11),
    ],
  },
  {
    id: 'busybees', title: 'Busy Bees', kind: 'fact', step: 2, topic: 'Animals',
    sentences: [
      'Honey bees are small insects that live in big groups called colonies.',
      'A colony can have up to fifty thousand bees.',
      'Each bee has a job to do.',
      'The queen bee lays eggs, and that is her only job.',
      'Worker bees clean the hive, make honey, and care for the young.',
      'For example, some workers fly out to find flowers.',
      'They drink a sweet juice from flowers called nectar.',
      'When a worker finds good flowers, she dances inside the hive.',
      'The dance tells the other bees where the flowers are.',
      'That is how the whole colony finds food.',
      'Bees also help people.',
      'While they visit flowers, they carry a yellow powder called pollen from plant to plant.',
      'Because of the pollen, plants can grow fruit and seeds.',
      'In short, bees work together, and many plants need their help.',
    ],
    clues: [
      C(0, 'Honey bees are small insects', 'mainidea'), C(2, 'Each bee has a job to do', 'mainidea'),
      C(1, 'up to fifty thousand bees', 'detail'), C(5, 'For example', 'detail'),
      C(7, 'When a worker finds good flowers, she dances inside the hive', 'cause'), C(12, 'Because of the pollen', 'cause'),
      C(13, 'In short', 'takeaway'),
    ],
    words: {
      colonies: { say: 'KOL-uh-neez', means: 'big groups of animals that live together', example: 'Ants live in colonies under the ground.' },
      hive: { say: 'HYV', means: 'the home where bees live', example: 'The bees flew back to the hive.' },
      nectar: { say: 'NEK-ter', means: 'a sweet juice inside flowers', example: 'A hummingbird drinks nectar.' },
      pollen: { say: 'POL-en', means: 'a yellow powder that flowers make', example: 'Pollen stuck to the bee\'s legs.' },
    },
    elements: {
      mainidea: ES('Honey bees live in colonies and each bee has a job.', [0, 2, 13]),
      detail: { answer: 'A colony can have up to fifty thousand bees', wrong: ['The queen bee makes all the honey', 'Bees sleep inside flowers'], find: 1 },
      cause: EB('Bees carry ___ from plant to plant, so plants can grow fruit and seeds.', 'pollen', [], 'Bees carry pollen, so plants can grow fruit and seeds', 12),
      takeaway: { answer: 'Bees work together and plants need their help', wrong: ['Bees are only found in hives', 'Honey is the most important thing bees make'], find: 13 },
    },
    questions: [
      Q('listen', 'What do we call a big group of honey bees?', 'A colony', 'A herd', 'A flock', 0),
      TF('listen', 'The queen bee makes the honey.', false, 3),
      B('detail', 'A colony can have up to fifty ___ bees.', 'thousand', ['50,000', '50000', '50 thousand'], 1),
      Q('cause', 'Why does a worker bee dance inside the hive?', 'To tell the others where the flowers are', 'To keep the hive warm', 'To get ready to sleep', 8),
      TF('vocab', 'Pollen is a yellow powder from flowers.', true, 11),
      B('cause', 'Because of the pollen, plants can grow fruit and ___.', 'seeds', ['seed'], 12),
      SAY('main', 'What is this passage mostly about? Say it in your own words.', 'How bees work together in a colony and help plants grow.', 13),
    ],
  },
  {
    id: 'missingbook', title: 'The Missing Library Book', kind: 'story', step: 2, topic: 'School and Home',
    sentences: [
      'Noah loved his new library book about sharks.',
      'He read it every night before bed.',
      'On Friday, the book was due back at the library.',
      'Noah looked on his shelf, but the book was not there.',
      'First, he looked under his bed and behind his desk.',
      'Then he even checked his backpack twice.',
      'The book was lost!',
      'Noah felt worried because he did not want to lose a library book.',
      'He told his mom the truth.',
      '"Let\'s think," she said. "Where did you last read it?"',
      'Noah remembered reading in the car on the way home from his cousin\'s house.',
      'Next, his mom walked out to the car and looked in the back seat.',
      'There was the shark book, tucked beside the seat.',
      'Noah smiled and gave his mom a big hug.',
      'He returned the book on time.',
      'He learned to keep his books in the same place every night.',
    ],
    clues: [
      C(0, 'Noah', 'characters'), C(8, 'his mom', 'characters'),
      C(2, 'On Friday', 'setting'), C(10, 'in the car', 'setting'),
      C(3, 'the book was not there', 'problem'), C(6, 'lost', 'problem'),
      C(4, 'First', 'events'), C(5, 'Then', 'events'), C(11, 'Next', 'events'),
      C(8, 'told his mom the truth', 'solution'), C(12, 'There was the shark book, tucked beside the seat', 'solution'),
      C(15, 'learned to keep his books in the same place every night', 'lesson'),
    ],
    words: {
      due: { say: 'DOO', means: 'needing to be given back by a certain day', example: 'My homework is due on Monday.' },
      tucked: { say: 'TUKT', means: 'pushed into a small, snug spot', example: 'The note was tucked inside the book.' },
      returned: { say: 'ree-TURND', means: 'brought something back', example: 'She returned the toy to her friend.' },
    },
    // Improved comprehension set (DECISIONS D28). Every item tests a fact no other item tests and points at its evidence.
    // The old questions here made two Q() calls; skipping them must not move any other passage's answer positions.
    coach: (turn += 2, {
      listen: [
        { id: 'listen-topic', fact: 'book-topic', skill: 'listen', format: 'choice', ask: 'What was Noah\'s library book about?',
          choices: ['Trains', 'Sharks', 'Dogs'], answer: 1, evidence: [0], hint: 'Think about the very first thing you heard about the book.',
          explain: 'The story begins by saying Noah loved his new library book about sharks.' },
        { id: 'listen-shelf', fact: 'shelf-empty', skill: 'listen', format: 'tf', ask: 'True or false: Noah found his book on his shelf.',
          answer: false, evidence: [3], hint: 'Listen for where Noah looked first, and what he found there.',
          explain: 'Noah looked on his shelf, but the book was not there.' },
      ],
      map: [
        { id: 'm-characters', element: 'characters', fact: 'other-character', skill: 'element', format: 'blank',
          ask: 'The other main character, besides Noah, is his ___.', blank: 'mom', accept: ['mom', 'mother', 'mum', 'mommy'], evidence: [8, 9],
          hint: 'Who does Noah go to for help?', explain: 'Noah tells his mom the truth, and she helps him think about where he read the book last.' },
        { id: 'm-setting', element: 'setting', fact: 'where-when', skill: 'element', format: 'choice', ask: 'Where and when does most of this story happen?',
          choices: ['At the library and at school, on the day Noah first borrowed the book', 'In Noah\'s room and in the car, on the Friday the book was due', 'At his cousin\'s house and in the park, on a long weekend'],
          answer: 1, evidence: [2, 3, 4, 11], hint: 'Find the day the book was due, then the places Noah and his mom looked.',
          explain: 'The book is due on Friday. Noah searches his room (his bed, his desk) and then his mom looks in the car.' },
        { id: 'm-problem', element: 'problem', fact: 'problem', skill: 'element', format: 'choice', ask: 'What problem does Noah have?',
          choices: ['He cannot find his library book, and it is due', 'He forgot to finish reading his library book before bed', 'He spilled juice on his library book at lunch today'],
          answer: 0, evidence: [2, 3, 6], hint: 'What is due on Friday, and what goes wrong when Noah looks for it?',
          explain: 'The book is due back on Friday, but Noah looks and cannot find it. The story says, "The book was lost!"' },
        { id: 'm-events', element: 'events', fact: 'story-arc', skill: 'sequence', format: 'sequence', ask: 'Put these big moments of the story in order.',
          order: ['Noah cannot find his library book', 'Noah\'s mom helps him think about where he read it last', 'Noah returns the book on time'], evidence: [3, 9, 14],
          hint: 'How does the story begin, what changes in the middle, and how does it end?',
          explain: 'The book goes missing (sentence 4), his mom\'s question starts the solution, and at the end he returns the book on time.' },
        { id: 'm-solution', element: 'solution', fact: 'where-found', skill: 'element', format: 'choice', ask: 'How was the problem solved?',
          choices: ['Noah bought a new copy with his savings', 'Noah\'s cousin mailed the book back to the library', 'Noah and his mom looked in the car and found the book'],
          answer: 2, evidence: [10, 11, 12], hint: 'Where did the book finally turn up, and who helped look?',
          explain: 'Noah remembered reading in the car, his mom looked in the back seat, and the shark book was tucked beside the seat.' },
        { id: 'm-lesson', element: 'lesson', fact: 'lesson', skill: 'element', format: 'blank',
          ask: 'Noah learned to keep his books in the ___ place every night.', blank: 'same', accept: ['same'], evidence: [15],
          hint: 'Look at the very last sentence. What did Noah learn?', explain: 'The last sentence says he learned to keep his books in the same place every night.' },
      ],
      core: [
        { id: 'c1-nightly', fact: 'nightly-reading', skill: 'detail', format: 'blank', ask: 'Noah read his new book every night before ___.',
          blank: 'bed', accept: ['bed', 'bedtime'], evidence: [1], hint: 'Find the sentence about when Noah read the book.', explain: 'The story says, "He read it every night before bed."' },
        { id: 'c2-ontime', fact: 'returned-on-time', skill: 'detail', format: 'tf', ask: 'True or false: Noah returned the book late.', answer: false,
          follow: { kind: 'correction', ask: 'Which sentence fixes the false statement?', choices: ['Noah returned the book on time.', 'Noah kept the book for another week.', 'Noah returned the book a week early.'], answer: 0 },
          evidence: [2, 14], hint: 'Check when the book was due, then check how the story ends.',
          explain: 'The book was due on Friday, and the story ends with "He returned the book on time," so "late" is false.' },
        { id: 'c3-feeling', fact: 'feeling-end', skill: 'element', format: 'choice', ask: 'How did Noah feel after the book was found?',
          choices: ['Angry that it took so long', 'Still worried about the library', 'Relieved and thankful'], answer: 2, evidence: [12, 13],
          hint: 'Look at what Noah does right after the book is found.', explain: 'He smiled and gave his mom a big hug, which shows he felt relieved and thankful.' },
        { id: 'c4-question', fact: 'moms-question', skill: 'element', format: 'choice', ask: 'What question did Noah\'s mom ask that helped him?',
          choices: ['Who borrowed it before you?', 'Did you leave it at the library?', 'Where did you last read it?'], answer: 2, evidence: [9],
          hint: 'Look for the words Noah\'s mom says out loud.', explain: 'She asks, "Where did you last read it?" and that makes Noah remember the car.' },
        { id: 'c5-search', fact: 'search-order', skill: 'sequence', format: 'sequence', ask: 'Put the places Noah and his mom looked in order, first to last.',
          order: ['Under his bed and behind his desk', 'In his backpack', 'In the back seat of the car'], evidence: [4, 5, 11],
          hint: 'Look for the order words First, Then and Next.', explain: 'First he looked under his bed and behind his desk, then in his backpack, and next his mom looked in the back seat.' },
        { id: 'c6-car', fact: 'why-car', skill: 'cause', format: 'choice', ask: 'Why did Noah\'s mom look in the car?',
          choices: ['The car is where library books are kept', 'Noah remembered reading there on the drive', 'Noah\'s cousin said he had seen the book there'], answer: 1, evidence: [10, 11],
          hint: 'What did Noah remember just before his mom walked out to the car?', explain: 'Noah remembered reading in the car on the way home, so his mom went to look there.' },
        { id: 'c7-careful', fact: 'character-from-actions', skill: 'inference', format: 'choice', ask: 'What can you tell about Noah from the way he searched for the book?',
          choices: ['He did not really care about it', 'He is careful with library books', 'He wanted his mom to find it'], answer: 1,
          follow: { kind: 'evidence', ask: 'Which sentence from the story best supports your answer?', choices: ['Then he even checked his backpack twice.', 'Noah smiled and gave his mom a big hug.', 'Noah remembered reading in the car on the way home from his cousin\'s house.'], answer: 0 },
          evidence: [4, 5], hint: 'Think about how many places he searched, and how carefully.',
          explain: 'He looked under his bed, behind his desk, and even checked his backpack twice. The story does not say "careful," but his actions show it.' },
        { id: 'c8-summary', fact: 'best-summary', skill: 'summary', format: 'choice', ask: 'Which is the best summary of the story?',
          choices: ['Noah loses his library book, tells his mom, and they find it in the car, so he returns it on time.', 'Noah searches under his bed, behind his desk, and in his backpack, but he never finds the library book.', 'Noah reads a shark book every night, loves it, and wants to read more books about ocean animals.'], answer: 0,
          follow: { kind: 'evidence', ask: 'Which sentence from the story best supports the ending of the summary?', choices: ['Noah felt worried because he did not want to lose a library book.', 'Noah loved his new library book about sharks.', 'There was the shark book, tucked beside the seat.'], answer: 2 },
          evidence: [3, 8, 12, 14], hint: 'A good summary tells the problem, the main events, and how the story ends.',
          explain: 'It names the problem (the missing book), the key events (telling his mom, looking in the car) and the ending (he returned it on time).' },
      ],
      written: [
        { id: 'w1-worried', fact: 'motivation-worry', skill: 'cause', ask: 'Why was Noah worried when he could not find the book? Write your answer in your own words.',
          starters: ['Noah was worried because ___.'],
          model: 'Noah was worried because he did not want to lose a library book, and the book was due back on Friday.',
          checklist: ['I said why Noah felt worried (he did not want to lose a library book).', 'I used a detail from the story, such as the book being due on Friday.', 'My answer makes sense by itself and is in my own words.'],
          evidence: [2, 6, 7], hint: 'Read the sentence that begins "Noah felt worried".' },
        { id: 'w2-remember', fact: 'solution-explained', skill: 'solution', ask: 'How did remembering where he last read the book help Noah solve the problem? Use what the story says.',
          starters: ['Remembering where he last read helped because ___.'],
          model: 'Remembering where he last read helped because Noah remembered the car ride home, so his mom looked in the back seat and found the shark book tucked beside the seat.',
          checklist: ['I explained how the memory helped (it showed where to look).', 'I used evidence from the story (the car, the back seat, or where the book was found).', 'I told what happened next (the book was found).'],
          evidence: [9, 10, 11, 12], hint: 'Think about what Noah remembered, and where his mom looked next.' },
        { id: 'w3-summary', fact: 'summary-writing', skill: 'summary', ask: 'Tell what happened in the story, in order, from beginning to end.',
          starters: ['First ___, then ___, and finally ___.'],
          model: 'First Noah could not find his library book, then he told his mom and remembered reading in the car, and finally they found the book and he returned it on time.',
          checklist: ['I told the beginning, middle and end in order.', 'I included the problem and how it was solved.', 'I left out small details and used my own words.'],
          evidence: [3, 8, 10, 12, 14], hint: 'Think about the problem, the main steps that solved it, and how it ends.' },
      ],
    }),
  },
  {
    id: 'leafcolor', title: 'Why Leaves Change Color', kind: 'fact', step: 2, topic: 'Nature',
    sentences: [
      'In the fall, many trees put on a colorful show.',
      'Their green leaves turn red, orange and yellow.',
      'Why does this happen?',
      'Leaves are green because they hold a special green stuff called chlorophyll.',
      'Trees use chlorophyll to turn sunlight into food.',
      'In summer, there is plenty of sunlight, so the leaves stay green.',
      'In fall, the days get shorter and the air gets cooler.',
      'There is less sunlight, so the tree stops making food.',
      'Without new chlorophyll, the green fades away.',
      'Then yellow and orange colors that were hiding in the leaf show up.',
      'Some trees, such as maples, also make a new red color.',
      'Soon the leaves dry up and fall to the ground.',
      'The tree rests all winter.',
      'When spring comes, it grows new green leaves, and the cycle starts again.',
      'Now you know that leaves change color because the days get shorter and the tree stops making green.',
    ],
    clues: [
      C(0, 'many trees put on a colorful show', 'mainidea'), C(1, 'turn red, orange and yellow', 'mainidea'),
      C(3, 'called chlorophyll', 'detail'), C(10, 'such as maples', 'detail'),
      C(6, 'the days get shorter', 'cause'), C(7, 'There is less sunlight, so the tree stops making food', 'cause'),
      C(14, 'Now you know', 'takeaway'),
    ],
    words: {
      chlorophyll: { say: 'KLOR-uh-fil', means: 'the green stuff in leaves that turns sunlight into food', example: 'Chlorophyll makes the grass look green.' },
      maples: { say: 'MAY-pulz', means: 'trees with leaves shaped like hands', example: 'The maples in our yard turn red.' },
      cycle: { say: 'SY-kul', means: 'something that happens again and again in the same order', example: 'Day and night are a cycle.' },
    },
    elements: {
      mainidea: ES('Why leaves change color in the fall.', [0, 1, 2]),
      detail: { answer: 'Leaves are green because of chlorophyll', wrong: ['Maple trees stay green all year', 'Leaves make food from rain'], find: 3 },
      cause: EB('The days get shorter, so the tree stops making ___ and other colors show.', 'green', ['chlorophyll'], 'Days get shorter, so trees stop making green and other colors show', [6, 7, 8, 9]),
      takeaway: { answer: 'Leaves change color because the days get shorter and trees stop making green', wrong: ['All trees lose their leaves in summer', 'Leaves change color because of cold rain'], find: 14 },
    },
    questions: [
      Q('listen', 'What is the green stuff in leaves called?', 'Chlorophyll', 'Nectar', 'Pollen', 3),
      TF('listen', 'Trees use chlorophyll to make food from sunlight.', true, 4),
      B('cause', 'In summer, there is plenty of ___, so the leaves stay green.', 'sunlight', ['sun', 'sunshine'], 5),
      Q('detail', 'Which tree makes a new red color?', 'Maple', 'Birch', 'Pine', 10),
      TF('vocab', 'A cycle happens one time and never again.', false, 13),
      B('order', 'When spring comes, the tree grows new green ___.', 'leaves', ['leaf'], 13),
      SAY('main', 'Why do leaves change color in the fall? Say it in your own words.', 'The days get shorter, so the tree stops making green and the other colors show.', 14),
    ],
  },
  {
    id: 'lemonade', title: 'The Lemonade Stand', kind: 'story', step: 3, topic: 'Neighborhood',
    sentences: [
      'Rosa and her little brother Luis wanted to buy a gift for their mom.',
      'Her birthday was on Saturday, and they had only two dollars.',
      '"We need more money," said Rosa.',
      'Luis had an idea.',
      '"Let\'s sell lemonade!" he shouted.',
      'That afternoon, they set up a table in front of their house on Pine Street.',
      'First, they squeezed lemons and stirred in sugar.',
      'Next, Rosa painted a bright sign that said, "Cold Lemonade, 50 cents."',
      'But hardly anyone walked by, and the sun was hot.',
      'The lemonade was getting warm.',
      'Luis frowned. "Nobody wants to buy any."',
      'Rosa thought hard.',
      'Then she moved the table to the corner by the park, where many families were playing.',
      'Soon a line of thirsty kids and parents stretched down the sidewalk.',
      'By evening, they had sold every cup and had enough money for a beautiful plant.',
      'Rosa and Luis learned that when one plan does not work, you can try a new place or a new way.',
    ],
    clues: [
      C(0, 'Rosa', 'characters'), C(0, 'her little brother Luis', 'characters'),
      C(5, 'That afternoon', 'setting'), C(5, 'in front of their house on Pine Street', 'setting'),
      C(8, 'hardly anyone walked by', 'problem'), C(1, 'they had only two dollars', 'problem'),
      C(6, 'First', 'events'), C(7, 'Next', 'events'), C(12, 'Then', 'events'),
      C(12, 'moved the table to the corner by the park', 'solution'), C(14, 'sold every cup', 'solution'),
      C(15, 'learned that when one plan does not work, you can try a new place or a new way', 'lesson'),
    ],
    words: {
      squeezed: { say: 'SKWEEZD', means: 'pressed hard to get the juice out', example: 'He squeezed the orange.' },
      hardly: { say: 'HARD-lee', means: 'almost not at all', example: 'It was so dark I could hardly see.' },
      stretched: { say: 'STRECHT', means: 'reached out long and far', example: 'The line stretched around the corner.' },
    },
    elements: {
      characters: EB('Rosa and her little brother ___ are the characters.', 'Luis', [], 'Rosa and her little brother Luis', 0),
      setting: { answer: 'A lemonade stand on Pine Street and by the park', wrong: ['A store downtown at night', 'A school on a rainy day'], find: 5 },
      problem: ES('Hardly anyone bought their lemonade.', 8),
      events: { order: ['They made lemonade and a sign.', 'Rosa moved the table by the park.', 'They sold every cup.'], find: [6, 7, 12, 14] },
      solution: { answer: 'Rosa moved the table to where many families were', wrong: ['They gave the lemonade away', 'They made the lemonade sweeter'], find: 12 },
      lesson: EB('Rosa and Luis learned that if one plan does not work, try a new ___.', 'way', ['place'], 'If a plan does not work, try a new way', 15),
    },
    questions: [
      Q('listen', 'What did Rosa and Luis want to buy?', 'A gift for their mom', 'A new bike', 'A puppy', 0),
      TF('listen', 'Rosa and Luis sold cookies.', false, 4),
      B('detail', 'Rosa painted a bright ___ for their table.', 'sign', [], 7),
      Q('cause', 'Why did Rosa move the table?', 'Hardly anyone walked by the first spot', 'The sun went down', 'Her mom asked her to', 8),
      TF('detail', 'One cup of lemonade cost 50 cents.', true, 7),
      B('cause', 'Rosa moved the table to the corner by the ___.', 'park', [], 12),
      SAY('main', 'What did Rosa and Luis learn? Say it in your own words.', 'If one plan does not work, try a new place or a new way.', 15),
    ],
  },
  {
    id: 'raindelay', title: 'The Rain Delay', kind: 'story', step: 4, topic: 'Sports',
    sentences: [
      'Amir had waited all week for Saturday\'s big baseball game.',
      'His team, the Hawks, was playing the Tigers for the town trophy.',
      'When he got to the field, dark clouds covered the sky.',
      'Just as the first batter stepped up, thunder boomed and rain poured down.',
      'The umpire waved his arms and called, "Everyone off the field! The game is on hold."',
      'The Hawks ran to the picnic shelter, soaking wet.',
      'Amir kicked the bench and groaned, "This is the worst day ever."',
      'He was afraid the game would be canceled and the trophy would go to someone else.',
      'Coach Reyes sat down beside him.',
      '"Storms pass, Amir," she said. "Let\'s use this time well."',
      'First, she asked everyone to stretch and sip some water.',
      'Next, the team played a word game to stay cheerful.',
      'Soon Amir was laughing with his friends and forgot about the rain.',
      'After forty minutes, the thunder faded and the sun peeked out.',
      'The umpire called, "Play ball!"',
      'The Hawks hurried back to the field, ready and calm.',
      'They won by one run, and Amir cheered the loudest.',
      'Later, he told his coach that waiting had been hard, and he was glad she helped him stay patient.',
      'Amir learned that staying calm helps you do your best, even when plans change.',
    ],
    clues: [
      C(0, 'Amir', 'characters'), C(8, 'Coach Reyes', 'characters'),
      C(0, 'Saturday\'s', 'setting'), C(5, 'the picnic shelter', 'setting'),
      C(3, 'thunder boomed and rain poured down', 'problem'), C(7, 'He was afraid the game would be canceled', 'problem'),
      C(10, 'First', 'events'), C(11, 'Next', 'events'), C(13, 'After forty minutes', 'events'),
      C(10, 'she asked everyone to stretch and sip some water', 'solution'), C(11, 'the team played a word game to stay cheerful', 'solution'),
      C(18, 'learned that staying calm helps you do your best', 'lesson'),
    ],
    words: {
      umpire: { say: 'UM-pyr', means: 'the person who makes the rules clear in a game', example: 'The umpire said the runner was safe.' },
      canceled: { say: 'KAN-suld', means: 'called off, so it does not happen', example: 'The picnic was canceled because of snow.' },
      cheerful: { say: 'CHEER-ful', means: 'happy and full of good spirit', example: 'She was cheerful all day.' },
      patient: { say: 'PAY-shunt', means: 'able to wait without getting upset', example: 'Be patient while the cake bakes.' },
    },
    elements: {
      characters: EB('Amir\'s coach is named Coach ___.', 'Reyes', [], 'Amir and Coach Reyes', 8),
      setting: { answer: 'A baseball field and a picnic shelter on a stormy Saturday', wrong: ['A soccer field on a sunny Sunday', 'A gym on a snowy day'], find: 5 },
      problem: ES('A storm stopped the big game, and Amir feared it would be canceled.', 7),
      events: { order: ['Rain stopped the game.', 'Coach Reyes helped the team stay cheerful.', 'The game started again and the Hawks won.'], find: [3, 4, 10, 11, 14, 16] },
      solution: { answer: 'Coach Reyes helped the team stay busy and calm until the storm passed', wrong: ['The umpire ended the game early', 'Amir went home and slept'], find: 11 },
      lesson: EB('Staying ___ helps you do your best when plans change.', 'calm', [], 'Staying calm helps you do your best when plans change', 18),
    },
    questions: [
      Q('listen', 'What game was Amir waiting to play?', 'Baseball', 'Basketball', 'Soccer', 0),
      TF('listen', 'The game stopped because of thunder and rain.', true, 3),
      B('detail', 'The Hawks ran to the picnic ___.', 'shelter', [], 5),
      Q('cause', 'Why was Amir upset?', 'He was afraid the game would be canceled', 'He forgot his glove', 'He did not like his coach', 7),
      TF('detail', 'The rain delay lasted two hours.', false, 13),
      B('order', 'First, Coach Reyes asked everyone to stretch and sip some ___.', 'water', [], 10),
      SAY('main', 'What is the lesson of this story? Say it in your own words.', 'Staying calm helps you do your best, even when plans change.', 18),
    ],
  },
  {
    id: 'octopus', title: 'The Octopus Escape Artist', kind: 'fact', step: 3, topic: 'Ocean',
    sentences: [
      'The octopus is one of the smartest animals in the ocean.',
      'It has no bones, so its soft body can squeeze through very small holes.',
      'This makes the octopus a famous escape artist.',
      'Scientists have seen octopuses open jars by twisting the lids.',
      'Some have even slipped out of tanks at aquariums and crawled across the floor.',
      'An octopus also has a clever way to hide.',
      'Special cells in its skin let it change color in less than a second.',
      'It can turn brown to match a rock or white to match sand.',
      'Because it blends in so well, hungry sharks often swim right past.',
      'When it cannot hide, the octopus has another trick.',
      'It squirts a cloud of dark ink into the water.',
      'The ink blocks the enemy\'s view, so the octopus can jet away.',
      'An octopus has eight arms, and each arm has hundreds of tiny suckers.',
      'The suckers help it grip rocks and grab food such as crabs and clams.',
      'Even more surprising, an octopus has three hearts.',
      'In short, the octopus survives by being smart, flexible and sneaky.',
    ],
    clues: [
      C(0, 'one of the smartest animals in the ocean', 'mainidea'), C(2, 'a famous escape artist', 'mainidea'),
      C(3, 'open jars by twisting the lids', 'detail'), C(12, 'eight arms', 'detail'), C(14, 'three hearts', 'detail'),
      C(1, 'It has no bones, so its soft body can squeeze through very small holes', 'cause'), C(8, 'Because it blends in so well', 'cause'),
      C(11, 'The ink blocks the enemy\'s view, so the octopus can jet away', 'cause'),
      C(15, 'In short', 'takeaway'),
    ],
    words: {
      aquariums: { say: 'uh-KWAIR-ee-umz', means: 'places where fish and sea animals live so people can see them', example: 'We saw a shark at the aquarium.' },
      blends: { say: 'BLENDZ', means: 'looks so much like the things around it that it is hard to see', example: 'The green frog blends in with the leaves.' },
      suckers: { say: 'SUK-erz', means: 'round parts that hold on tight to things', example: 'The suckers help it grip the rock.' },
      flexible: { say: 'FLEK-suh-bul', means: 'able to bend easily', example: 'A rubber band is flexible.' },
    },
    elements: {
      mainidea: ES('The octopus is a smart animal with clever ways to escape and hide.', [0, 2, 15]),
      detail: { answer: 'An octopus can open jars by twisting the lids', wrong: ['An octopus has two arms', 'An octopus has a hard shell'], find: 3 },
      cause: EB('The octopus has no ___, so its soft body can squeeze through very small holes.', 'bones', ['bone'], 'An octopus has no bones, so it can squeeze through very small holes', 1),
      takeaway: { answer: 'The octopus survives by being smart, flexible and sneaky', wrong: ['Octopuses are dangerous to sharks', 'Octopuses cannot hide from enemies'], find: 15 },
    },
    questions: [
      Q('listen', 'How many hearts does an octopus have?', 'Three', 'One', 'Eight', 14),
      TF('listen', 'An octopus has bones.', false, 1),
      B('detail', 'An octopus has ___ arms.', 'eight', ['8'], 12),
      Q('cause', 'Why can an octopus squeeze through small holes?', 'It has no bones', 'It is very small', 'It has three hearts', 1),
      TF('vocab', 'Flexible means able to bend easily.', true, 15),
      B('cause', 'The octopus squirts a cloud of dark ___ to get away.', 'ink', [], [10, 11]),
      SAY('main', 'What is this passage mostly about? Say it in your own words.', 'How an octopus uses smart tricks to survive.', 15),
    ],
  },
];

const entries = STORIES.map((s) => {
  const e = { id: s.id, title: s.title, kind: s.kind, step: s.step, topic: s.topic, words: storyWords(s) };
  return e;
});
const index = { steps: STEPS, stories: entries.slice().sort((a, b) => a.step - b.step || a.words - b.words) };

let bad = validateReadingIndex(index);
for (const s of STORIES) bad = bad.concat(validateStory(s, entries.find((e) => e.id === s.id)));
// The step must match the length the step promises.
const RANGE = { 1: [80, 125], 2: [120, 165], 3: [160, 205], 4: [200, 999] };
for (const e of entries) if (e.words < RANGE[e.step][0] || e.words > RANGE[e.step][1]) bad.push(`${e.id}: ${e.words} words is outside Step ${e.step}`);
if (process.env.COUNTS) console.log(entries.map((e) => `${e.id} ${e.words}`).join("\n"));
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }

fs.mkdirSync(OUT, { recursive: true });
for (const s of STORIES) fs.writeFileSync(path.join(OUT, `${s.id}.json`), JSON.stringify(s, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(index.stories.map((e) => `${e.step} ${e.kind.padEnd(5)} ${String(e.words).padStart(3)} words  ${e.id}`).join('\n'));
