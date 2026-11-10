import {SAT_RW_ID,SAT_MATH_ID} from './defaults';
import type {mistakeReasons} from './schemas';
// Facts below are paraphrased from official College Board / IB pages and peer-reviewed research
// (checked November 2026). Each source is linked where the content is shown.
export const sources={
 satStructure:'https://satsuite.collegeboard.org/digital/whats-on-the-test/structure',
 satRw:'https://satsuite.collegeboard.org/digital/whats-on-the-test/reading-writing',
 satMath:'https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview',
 satDates:'https://satsuite.collegeboard.org/sat/dates-deadlines',
 satPractice:'https://satsuite.collegeboard.org/practice',
 bluebook:'https://bluebook.collegeboard.org/',
 khan:'https://www.khanacademy.org/test-prep/digital-sat',
 questionBank:'https://mypractice.collegeboard.org',
 dunlosky:'https://journals.sagepub.com/doi/10.1177/1529100612453266',
 roediger:'https://doi.org/10.1111/j.1467-9280.2006.01693.x',
 cepeda:'https://www.evullab.org/pdf/CepedaVulRohrerWixtedPashler-PS-2008.pdf',
 rohrer:'https://ies.ed.gov/use-work/awards/efficacy-study-interleaved-mathematics-practice',
 gollwitzer:'https://doi.org/10.1016/S0065-2601(06)38002-1',
 aasm:'https://aasm.org/resources/pdf/pressroom/teen-sleep-duration-recommendation.pdf',
 calibration:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8442020',
 ibAssessment:'https://www.ibo.org/programmes/diploma-programme/assessment-and-exams/',
};
export const satFacts=[
 {label:'Reading & Writing',value:'54 questions · 64 min',detail:'Two 32-minute modules · about 71 seconds per question'},
 {label:'Math',value:'44 questions · 70 min',detail:'Two 35-minute modules · about 95 seconds per question'},
 {label:'Adaptive',value:'Module 2 adapts',detail:'Your first module decides whether the second is harder or easier, so Module 1 accuracy matters most'},
 {label:'Scoring',value:'400–1600',detail:'Two sections of 200–800. Wrong answers cost nothing, so never leave a question blank'},
];
export const satTips=[
 'The Desmos graphing calculator is built into Bluebook for the whole Math section. Practise with it until graphing an equation takes seconds.',
 'About a quarter of Math questions ask you to type your own answer, so practise solving without answer choices to lean on.',
 'Take full, timed Bluebook practice tests in one sitting. Review every question you missed or guessed on in your error log the same week.',
 'Between full tests, drill your weakest skill in the official Question Bank instead of redoing what you already know.',
 'Reading & Writing passages are short (25–150 words). Read the question first, then hunt for the one sentence that proves the answer.',
];
// Official test dates (College Board, retrieved November 2026). Fall 2027 dates were listed as anticipated.
export const satDates=[
 {date:'2026-12-05',note:'Register by Nov 20'},
 {date:'2027-03-06',note:'Register by Feb 19'},
 {date:'2027-05-01',note:'Register by Apr 16'},
 {date:'2027-06-05',note:'Register by May 21'},
 {date:'2027-08-28',note:'Anticipated'},{date:'2027-09-18',note:'Anticipated'},{date:'2027-10-09',note:'Anticipated'},{date:'2027-11-06',note:'Anticipated'},{date:'2027-12-04',note:'Anticipated'},
];
export const satDomains=[
 {subject_id:SAT_RW_ID,section:'Reading & Writing',domain:'Information and Ideas',skills:['Central ideas and details','Inferences','Command of evidence (textual and quantitative)']},
 {subject_id:SAT_RW_ID,section:'Reading & Writing',domain:'Craft and Structure',skills:['Words in context','Text structure and purpose','Cross-text connections']},
 {subject_id:SAT_RW_ID,section:'Reading & Writing',domain:'Expression of Ideas',skills:['Rhetorical synthesis','Transitions']},
 {subject_id:SAT_RW_ID,section:'Reading & Writing',domain:'Standard English Conventions',skills:['Boundaries (punctuation between clauses)','Form, structure, and sense (agreement, tense)']},
 {subject_id:SAT_MATH_ID,section:'Math',domain:'Algebra',count:'13–15 questions',skills:['Linear equations in one variable','Linear functions','Linear equations in two variables','Systems of two linear equations','Linear inequalities']},
 {subject_id:SAT_MATH_ID,section:'Math',domain:'Advanced Math',count:'13–15 questions',skills:['Nonlinear functions','Nonlinear equations in one variable','Systems of equations in two variables','Equivalent expressions']},
 {subject_id:SAT_MATH_ID,section:'Math',domain:'Problem-Solving and Data Analysis',count:'5–7 questions',skills:['Ratios, rates, proportions and units','Percentages','One-variable data: centre and spread','Two-variable data: models and scatterplots','Probability and conditional probability','Inference from samples and margin of error','Evaluating statistical claims']},
 {subject_id:SAT_MATH_ID,section:'Math',domain:'Geometry and Trigonometry',count:'5–7 questions',skills:['Area and volume','Lines, angles and triangles','Right triangles and trigonometry','Circles']},
];
export const satResources=[
 {name:'Bluebook practice tests',href:sources.bluebook,detail:'Official full-length adaptive tests in the real test app'},
 {name:'Official SAT Prep on Khan Academy',href:sources.khan,detail:'Free lessons and practice that build a study plan for you'},
 {name:'SAT Question Bank',href:sources.questionBank,detail:'Thousands of real questions you can filter by domain and difficulty'},
 {name:'Test dates & registration',href:sources.satDates,detail:'Deadlines, late registration and score release'},
];
export const mistakeReasonInfo:Record<typeof mistakeReasons[number],{label:string;advice:string}>={
 content:{label:'Didn’t know the content',advice:'Add the skill to your review queue and relearn it from a worked example before drilling more questions.'},
 misread:{label:'Misread the question',advice:'Before answering, restate what the question asks in five words. Underline “not”, “except” and the units it wants.'},
 careless:{label:'Careless slip',advice:'Slow down on the final step. Re-check signs, arithmetic and that you answered the value actually asked for.'},
 time:{label:'Ran out of time',advice:'Practise pacing: skip and flag anything over two minutes, then come back. Timed module drills build speed.'},
 trap:{label:'Picked a trap answer',advice:'Name why each wrong choice is wrong. Trap answers are often true statements that don’t answer this question.'},
};
export const ibFacts=[
 {label:'Diploma points',value:'45 maximum',detail:'Six subjects graded 1–7 (42) plus up to 3 points from TOK and the Extended Essay'},
 {label:'Internal assessment',value:'IA in every subject',detail:'Teacher-marked, IB-moderated coursework. Internal deadlines come months before exams'},
 {label:'Core',value:'TOK · EE · CAS',detail:'An E in TOK or the EE means no diploma. Start early and meet your supervisor regularly'},
 {label:'May 2027 exams',value:'From about 23 April',detail:'Reported start of the session. Confirm your exact paper dates with your IB coordinator'},
];
export const ibTips=[
 'Practise past papers under timed conditions, then mark them strictly with the official markscheme. The feedback is where the learning happens.',
 'Read the IB subject reports for each paper. They list the mistakes examiners see most often.',
 'Learn the command terms. “Describe”, “explain” and “evaluate” earn marks for different things.',
 'Treat IA, EE and TOK deadlines as fixed. Break each into small dated milestones so nothing piles up before exams.',
 'Mix topics within a practice session once you know the basics. Picking the method is part of what the exam tests.',
];
// Plain-language summaries written for this app; check your subject guide for the official wording.
export const commandTerms=[
 {term:'Define',meaning:'Give the precise meaning of a word or idea.',tip:'Short and exact. No examples needed unless asked.'},
 {term:'State',meaning:'Give a specific name, value or short answer without explanation.',tip:'One line. Don’t waste time justifying.'},
 {term:'Outline',meaning:'Give a brief account or summary.',tip:'Key points only. Think bullet points in sentences.'},
 {term:'Describe',meaning:'Give a detailed account of what something is or what happens.',tip:'What, not why.'},
 {term:'Explain',meaning:'Give reasons or causes, including the mechanism.',tip:'Use “because” and “therefore”. Depth follows the marks available.'},
 {term:'Calculate',meaning:'Get a numerical answer, showing the working.',tip:'Show steps and units. Method marks are available.'},
 {term:'Determine',meaning:'Get the only possible answer.',tip:'State the single answer clearly.'},
 {term:'Derive',meaning:'Manipulate a relationship to reach a new equation.',tip:'Every algebraic step should be visible.'},
 {term:'Analyse',meaning:'Break something down to bring out its essential elements or structure.',tip:'Identify parts and show how they relate.'},
 {term:'Compare and contrast',meaning:'Give similarities and differences, referring to both throughout.',tip:'Write about both items in each point, not one after the other.'},
 {term:'Distinguish',meaning:'Make clear the differences between two or more things.',tip:'Differences only.'},
 {term:'Discuss',meaning:'Offer a balanced review with a range of arguments or factors.',tip:'Several perspectives, supported with evidence, then a conclusion.'},
 {term:'Evaluate',meaning:'Weigh strengths and limitations to make a judgement.',tip:'Always end with a clear, justified judgement.'},
 {term:'To what extent',meaning:'Consider the merits of an argument or idea and judge how far it holds.',tip:'Give a degree (“largely”, “only partly”) and justify it.'},
 {term:'Justify',meaning:'Give valid reasons or evidence to support an answer or conclusion.',tip:'Link each claim to evidence.'},
 {term:'Suggest',meaning:'Propose a solution, hypothesis or other possible answer.',tip:'Plausible ideas count even if not in the syllabus.'},
];
export type Strategy={id:string;name:string;evidence:'Strong'|'Moderate'|'Low';summary:string;steps:string[];for:string;source:{label:string;href:string}};
export const strategies:Strategy[]=[
 {id:'retrieval',name:'Retrieval practice',evidence:'Strong',summary:'Pull information out of your memory instead of putting it back in. Testing yourself beats rereading, especially when you check your answers afterwards.',steps:['Close your notes and write or say everything you remember about a topic (a “blurt”).','Check against your notes and fill gaps in a different colour.','Use past-paper and SAT questions as retrieval, not just as a final check.'],for:'IB content, SAT grammar rules and maths methods',source:{label:'Dunlosky et al., 2013; Roediger & Karpicke, 2006',href:sources.dunlosky}},
 {id:'spacing',name:'Spaced practice',evidence:'Strong',summary:'Spread reviews over days and weeks instead of cramming. The best gap grows with how far away the exam is.',steps:['Add each topic to your review queue as soon as it is taught.','Review when it is due. The gap grows every time you remember it.','Keep short daily review sessions instead of one long weekly one.'],for:'Everything you need on exam day',source:{label:'Cepeda et al., 2008',href:sources.cepeda}},
 {id:'interleaving',name:'Interleaving',evidence:'Moderate',summary:'Mix different problem types in one session so you practise choosing the method as well as using it. A randomized trial found strong gains in maths.',steps:['Once you know the basics, mix past-paper questions across topics.','For SAT Math, mix domains in drills instead of doing 20 of one type.','Expect it to feel harder. That difficulty is part of why it works.'],for:'Maths, physics, chemistry, economics diagrams, SAT Math',source:{label:'Rohrer et al., interleaved mathematics trial',href:sources.rohrer}},
 {id:'feedback',name:'Past papers with markschemes',evidence:'Strong',summary:'Practice tests help most when you get corrective feedback. Marking strictly with the official markscheme shows you what examiners reward.',steps:['Sit the paper timed, closed book.','Mark it with the markscheme. Note every lost mark and why.','Log mistakes and redo those questions a few days later.'],for:'IB Papers 1–3, Bluebook practice tests',source:{label:'Dunlosky et al., 2013',href:sources.dunlosky}},
 {id:'error-log',name:'Error log',evidence:'Moderate',summary:'Write down why you missed each question and redo it later. The pattern of your mistakes shows what to fix: content, reading or pacing.',steps:['After every practice set, log missed and guessed questions.','Name the reason: content, misread, careless, time or trap.','Redo each one after a few days without looking at the solution.'],for:'SAT practice tests, IB past papers',source:{label:'Builds on testing with feedback, Dunlosky et al., 2013',href:sources.dunlosky}},
 {id:'explain',name:'Self-explanation',evidence:'Moderate',summary:'Explain why each step works, or why a fact is true, in your own words. It links new ideas to what you already know.',steps:['After a worked example, cover it and explain each step aloud.','Ask “why is this true?” and “how does it connect to…?”.','Teach it to an imaginary classmate in plain language.'],for:'Sciences, economics, TOK',source:{label:'Dunlosky et al., 2013',href:sources.dunlosky}},
 {id:'plans',name:'If–then study plans',evidence:'Moderate',summary:'Decide when and where you will study, as in “After dinner at my desk, I’ll do 20 Advanced Math questions.” Plans with a clear cue are more likely to happen.',steps:['Give each task a cue: a time, place or routine that comes before it.','Keep tasks small and specific, with a number of minutes.','Plan tomorrow before you finish today.'],for:'Beating procrastination',source:{label:'Gollwitzer & Sheeran, 2006 (later reviews find smaller effects)',href:sources.gollwitzer}},
 {id:'calibrate',name:'Predict, then check',evidence:'Moderate',summary:'Most students overestimate how ready they are. Predicting your score before you check it, then comparing, makes your judgement more honest.',steps:['Before marking a paper, write the score you expect.','Compare with the real score and note the gap.','Use the gap to decide what to review, not your feeling of “I know this”.'],for:'Deciding what to study next',source:{label:'Review of calibration research',href:sources.calibration}},
 {id:'sleep',name:'Protect your sleep',evidence:'Strong',summary:'Teens need 8–10 hours. Short sleep is linked to worse attention, learning and memory, so an all-nighter costs more than it gains.',steps:['Keep a steady bedtime, even before exams.','Finish screens and heavy studying a little before bed.','Swap late cramming for an early-morning review.'],for:'Everything',source:{label:'American Academy of Sleep Medicine',href:sources.aasm}},
 {id:'low-value',name:'Rereading and highlighting',evidence:'Low',summary:'They feel productive but rarely improve results on their own. Use them only as a first pass before switching to retrieval.',steps:['Skim once to orient yourself.','Turn headings into questions.','Then close the book and answer them.'],for:'A first look only',source:{label:'Dunlosky et al., 2013',href:sources.dunlosky}},
];
export const tipOfTheDay=(now=new Date())=>{const list=strategies.filter(s=>s.evidence!=='Low');return list[Math.floor(now.getTime()/86400000)%list.length];};
