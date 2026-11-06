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
      characters: { answer: 'Dev and his grandpa', wrong: ['Dev and his dog', 'Dev and his teacher'], find: 0 },
      setting: { answer: 'A park on a windy morning', wrong: ['A school on a rainy day', 'A beach on a sunny afternoon'], find: 0 },
      problem: { answer: 'The kite got stuck in a tree', wrong: ['Dev lost his shoes', 'The kite would not fly'], find: 3 },
      events: { order: ['Dev flew his kite.', 'The wind pushed the kite into a tree.', 'Grandpa helped get it down.'], find: 3 },
      solution: { answer: 'Grandpa used a long stick to get the kite down', wrong: ['Dev climbed the tree', 'They bought a new kite'], find: 8 },
      lesson: { answer: 'It is okay to ask for help', wrong: ['Never fly a kite in the park', 'Always run fast'], find: 11 },
    },
    questions: [
      Q('listen', 'Where did Dev go?', 'To the park', 'To the beach', 'To school', 0),
      Q('listen', 'What happened to the kite?', 'It got stuck in a tree', 'It broke in half', 'It flew far away', 3),
      Q('order', 'What did Dev do FIRST?', 'He ran fast with his kite', 'He found a long stick', 'He hugged his grandpa', 2),
      Q('cause', 'Why did Dev feel sad?', 'He could not reach his kite', 'He lost the game', 'He was hungry', 5),
      Q('detail', 'What did Grandpa find by the fence?', 'A long stick', 'A ladder', 'A rope', 7),
      Q('vocab', 'In this story, what does reach mean?', 'to stretch out and touch', 'to run away', 'to say sorry', 5),
      Q('main', 'What is the lesson of this story?', 'Ask for help when you need it', 'Kites are red', 'Windy days are bad', 11),
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
      characters: { answer: 'Pip the puppy and a girl named Tia', wrong: ['Pip the puppy and a boy named Dev', 'A kitten and a girl named Tia'], find: 4 },
      setting: { answer: 'A bus stop on a cold, rainy night', wrong: ['A park on a sunny day', 'A school in the morning'], find: 2 },
      problem: { answer: 'Pip had no home and no dry place', wrong: ['Pip lost her toy', 'Tia lost her coat'], find: 3 },
      events: { order: ['Pip slept under a bench in the rain.', 'Tia wrapped her coat around Pip.', 'Pip woke up in a soft bed.'], find: 6 },
      solution: { answer: 'Tia took Pip home and gave her food and a bed', wrong: ['Pip ran to the park', 'The rain stopped by itself'], find: 8 },
      lesson: { answer: 'Being kind can change a life', wrong: ['Puppies should stay outside', 'Always carry a coat'], find: 11 },
    },
    questions: [
      Q('listen', 'What kind of animal was Pip?', 'A puppy', 'A kitten', 'A rabbit', 0),
      Q('listen', 'Where did Pip sleep?', 'Under a bench', 'In a barn', 'On a boat', 1),
      Q('infer', 'Why did Tia give Pip her coat?', 'Pip was wet and cold', 'Pip was lost at school', 'Tia did not like the coat', 6),
      Q('order', 'What did Tia do next?', 'She carried Pip home', 'She ran away', 'She bought a leash', 7),
      Q('detail', 'What did Pip get from Tia\'s mom?', 'Warm food and a soft bed', 'A toy and a ball', 'A new coat', 8),
      Q('vocab', 'In this story, what does wagged mean?', 'moved from side to side', 'jumped up high', 'fell asleep', 9),
      Q('main', 'What is the lesson of this story?', 'Being kind can change a life', 'Rain is scary', 'Puppies sleep a lot', 11),
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
      mainidea: { answer: 'Honey bees live in colonies and each bee has a job', wrong: ['Honey bees only make honey for people', 'Honey bees are the biggest insects'], find: 2 },
      detail: { answer: 'A colony can have up to fifty thousand bees', wrong: ['The queen bee makes all the honey', 'Bees sleep inside flowers'], find: 1 },
      cause: { answer: 'Bees carry pollen, so plants can grow fruit and seeds', wrong: ['Bees make honey, so flowers grow taller', 'Bees dance, so it stops raining'], find: 12 },
      takeaway: { answer: 'Bees work together and plants need their help', wrong: ['Bees are only found in hives', 'Honey is the most important thing bees make'], find: 13 },
    },
    questions: [
      Q('listen', 'What do we call a big group of honey bees?', 'A colony', 'A herd', 'A flock', 0),
      Q('listen', 'What do worker bees drink from flowers?', 'Nectar', 'Rain water', 'Tree sap', 6),
      Q('main', 'What is this passage mostly about?', 'How bees work together and help plants', 'How to build a hive', 'Why honey is sweet', 13),
      Q('detail', 'What is the queen bee\'s only job?', 'Laying eggs', 'Making honey', 'Finding flowers', 3),
      Q('cause', 'Why does a worker bee dance inside the hive?', 'To tell the others where the flowers are', 'To keep the hive warm', 'To get ready to sleep', 8),
      Q('vocab', 'What does pollen mean in this passage?', 'a yellow powder from flowers', 'a kind of bee', 'a sweet juice', 11),
      Q('cause', 'How do bees help plants grow fruit?', 'They carry pollen from plant to plant', 'They give plants water', 'They dig holes for seeds', 11),
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
    elements: {
      characters: { answer: 'Noah and his mom', wrong: ['Noah and his teacher', 'Noah and his cousin'], find: 8 },
      setting: { answer: 'Noah\'s home and his mom\'s car', wrong: ['A library and a school', 'A park and a beach'], find: 10 },
      problem: { answer: 'Noah could not find his library book', wrong: ['Noah forgot his homework', 'Noah\'s book had torn pages'], find: 3 },
      events: { order: ['Noah looked for the book in his room.', 'His mom looked in the car.', 'Noah returned the book on time.'], find: 11 },
      solution: { answer: 'Noah told his mom, and they found the book in the car', wrong: ['Noah bought a new book', 'The librarian found it'], find: 12 },
      lesson: { answer: 'Keep your books in the same place', wrong: ['Never read in the car', 'Sharks are scary'], find: 15 },
    },
    questions: [
      Q('listen', 'What was Noah\'s library book about?', 'Sharks', 'Trains', 'Dogs', 0),
      Q('listen', 'What could Noah not find?', 'His library book', 'His backpack', 'His shoes', 3),
      Q('order', 'Where did Noah look FIRST?', 'Under his bed and behind his desk', 'In the car', 'In his backpack', 4),
      Q('cause', 'Why was Noah worried?', 'He did not want to lose a library book', 'He had no homework', 'He was late for dinner', 7),
      Q('detail', 'Where was the book at the end?', 'Beside the car seat', 'In his backpack', 'Under his bed', 12),
      Q('vocab', 'What does tucked mean in this story?', 'pushed into a snug spot', 'thrown far away', 'torn in half', 12),
      Q('main', 'What did Noah learn?', 'To keep his books in the same place every night', 'To read less', 'To hide his books', 15),
    ],
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
      mainidea: { answer: 'Why leaves change color in the fall', wrong: ['How trees grow in winter', 'Why leaves have different shapes'], find: 2 },
      detail: { answer: 'Leaves are green because of chlorophyll', wrong: ['Maple trees stay green all year', 'Leaves make food from rain'], find: 3 },
      cause: { answer: 'Days get shorter, so trees stop making green and other colors show', wrong: ['It gets warmer, so the leaves turn red', 'Wind blows, so the leaves get dry'], find: 7 },
      takeaway: { answer: 'Leaves change color because the days get shorter and trees stop making green', wrong: ['All trees lose their leaves in summer', 'Leaves change color because of cold rain'], find: 14 },
    },
    questions: [
      Q('listen', 'What is the green stuff in leaves called?', 'Chlorophyll', 'Nectar', 'Pollen', 3),
      Q('listen', 'What do trees use chlorophyll to make?', 'Food', 'Rain', 'Wind', 4),
      Q('main', 'What is this passage mostly about?', 'Why leaves change color in the fall', 'How to rake leaves', 'Why trees have roots', 14),
      Q('cause', 'Why do leaves stay green in summer?', 'There is plenty of sunlight', 'It never rains', 'Trees are asleep', 5),
      Q('detail', 'Which tree makes a new red color?', 'Maple', 'Birch', 'Pine', 10),
      Q('vocab', 'What does cycle mean in this passage?', 'something that repeats in the same order', 'a kind of bike', 'a cold wind', 13),
      Q('order', 'What happens AFTER the green fades away?', 'Yellow and orange colors show up', 'The leaves grow back', 'The tree makes more food', 9),
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
      characters: { answer: 'Rosa and her little brother Luis', wrong: ['Rosa and her friend Tia', 'Luis and his dad'], find: 0 },
      setting: { answer: 'A lemonade stand on Pine Street and by the park', wrong: ['A store downtown at night', 'A school on a rainy day'], find: 5 },
      problem: { answer: 'Hardly anyone bought their lemonade', wrong: ['They ran out of lemons', 'The sign was too small'], find: 8 },
      events: { order: ['They made lemonade and a sign.', 'Rosa moved the table by the park.', 'They sold every cup.'], find: 12 },
      solution: { answer: 'Rosa moved the table to where many families were', wrong: ['They gave the lemonade away', 'They made the lemonade sweeter'], find: 12 },
      lesson: { answer: 'If a plan does not work, try a new way', wrong: ['Lemonade is the best drink', 'Always sell in front of your house'], find: 15 },
    },
    questions: [
      Q('listen', 'What did Rosa and Luis want to buy?', 'A gift for their mom', 'A new bike', 'A puppy', 0),
      Q('listen', 'What did they sell?', 'Lemonade', 'Cookies', 'Popcorn', 4),
      Q('order', 'What did they do FIRST?', 'Squeezed lemons and stirred in sugar', 'Moved the table', 'Sold every cup', 6),
      Q('cause', 'Why did Rosa move the table?', 'Hardly anyone walked by the first spot', 'The sun went down', 'Her mom asked her to', 8),
      Q('detail', 'How much did one cup cost?', '50 cents', 'Two dollars', '5 cents', 7),
      Q('vocab', 'What does hardly anyone mean?', 'almost nobody', 'a lot of people', 'only grown-ups', 8),
      Q('main', 'What did Rosa and Luis learn?', 'To try a new way when a plan does not work', 'Lemonade must be cold', 'To sell only in the evening', 15),
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
      characters: { answer: 'Amir and Coach Reyes', wrong: ['Amir and the umpire', 'Amir and his dad'], find: 8 },
      setting: { answer: 'A baseball field and a picnic shelter on a stormy Saturday', wrong: ['A soccer field on a sunny Sunday', 'A gym on a snowy day'], find: 5 },
      problem: { answer: 'A storm stopped the big game, and Amir feared it would be canceled', wrong: ['Amir lost his baseball glove', 'The Tigers had a better team'], find: 7 },
      events: { order: ['Rain stopped the game.', 'Coach Reyes helped the team stay cheerful.', 'The game started again and the Hawks won.'], find: 13 },
      solution: { answer: 'Coach Reyes helped the team stay busy and calm until the storm passed', wrong: ['The umpire ended the game early', 'Amir went home and slept'], find: 11 },
      lesson: { answer: 'Staying calm helps you do your best when plans change', wrong: ['Baseball is better in the rain', 'Always win the trophy'], find: 18 },
    },
    questions: [
      Q('listen', 'What game was Amir waiting to play?', 'Baseball', 'Basketball', 'Soccer', 0),
      Q('listen', 'Why did the umpire stop the game?', 'Thunder and rain began', 'A player got hurt', 'The ball was lost', 3),
      Q('cause', 'Why was Amir upset?', 'He was afraid the game would be canceled', 'He forgot his glove', 'He did not like his coach', 7),
      Q('order', 'What did Coach Reyes ask the team to do FIRST?', 'Stretch and sip water', 'Play a word game', 'Go home', 10),
      Q('detail', 'How long was the delay?', 'Forty minutes', 'Ten minutes', 'Two hours', 13),
      Q('vocab', 'What does patient mean in this story?', 'able to wait without getting upset', 'very fast', 'angry and loud', 17),
      Q('main', 'What is the lesson of this story?', 'Staying calm helps you do your best', 'Storms always end games', 'Coaches are always right', 18),
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
      mainidea: { answer: 'The octopus is a smart animal with clever ways to escape and hide', wrong: ['Octopuses live only in tanks', 'Octopuses are slow and easy to catch'], find: 0 },
      detail: { answer: 'An octopus can open jars by twisting the lids', wrong: ['An octopus has two arms', 'An octopus has a hard shell'], find: 3 },
      cause: { answer: 'An octopus has no bones, so it can squeeze through very small holes', wrong: ['An octopus changes color, so it can open jars', 'An octopus has suckers, so it has no bones'], find: 1 },
      takeaway: { answer: 'The octopus survives by being smart, flexible and sneaky', wrong: ['Octopuses are dangerous to sharks', 'Octopuses cannot hide from enemies'], find: 15 },
    },
    questions: [
      Q('listen', 'How many hearts does an octopus have?', 'Three', 'One', 'Eight', 14),
      Q('listen', 'What does the octopus squirt to escape an enemy?', 'Dark ink', 'Sand', 'Hot water', 10),
      Q('main', 'What is this passage mostly about?', 'How an octopus uses smart tricks to survive', 'Why sharks are dangerous', 'How to build an aquarium', 15),
      Q('cause', 'Why can an octopus squeeze through small holes?', 'It has no bones', 'It is very small', 'It has three hearts', 1),
      Q('detail', 'What can an octopus\'s skin do?', 'Change color in less than a second', 'Grow hard like armor', 'Glow in the dark', 6),
      Q('vocab', 'What does flexible mean in this passage?', 'able to bend easily', 'very loud', 'hard to see', 15),
      Q('cause', 'Why do hungry sharks often swim right past an octopus?', 'It blends in with its background', 'It is bigger than a shark', 'It makes loud noises', 8),
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
