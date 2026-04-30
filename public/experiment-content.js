import { buildConditionMatrix } from './shared.js';

const scriptedConditionGroups = {
  minimal: [
    'agreement-agree__explanation-brief',
    'agreement-neutral__explanation-brief',
  ],
  elaborated: [
    'agreement-agree__explanation-detailed',
    'agreement-neutral__explanation-detailed',
  ],
};

function expandResponseConditions(selectedAnswerMap) {
  const conditionResponses = {};

  scriptedConditionGroups.minimal.forEach((conditionId) => {
    conditionResponses[conditionId] = Object.fromEntries(
      Object.entries(selectedAnswerMap).map(([optionId, content]) => [
        optionId,
        [{ role: 'ai', text: content.minimal }],
      ]),
    );
  });

  scriptedConditionGroups.elaborated.forEach((conditionId) => {
    conditionResponses[conditionId] = Object.fromEntries(
      Object.entries(selectedAnswerMap).map(([optionId, content]) => [
        optionId,
        [{ role: 'ai', text: content.elaborated }],
      ]),
    );
  });

  return conditionResponses;
}

// ---------------------------------------------------------
// WDL: Well-defined + low difficulty
// ---------------------------------------------------------
const wdlQuestions = [
  {
    id: 'wdl1',
    difficulty: 'wdl',
    prompt:
      'Two after-school tutoring programs were evaluated based on the number of students who improved their grades.\n\nUnder <strong>Program A</strong>, 6 out of 10 students improved their grades.\nUnder <strong>Program B</strong>, 8 out of 10 students improved their grades.\n\nWhich conclusion is best supported by the data?',
    options: [
      { id: 'A', text: 'Program B led to greater grade improvement than Program A', rationale: "focused on how Program B's results compared to Program A's" },
      { id: 'B', text: 'Program A led to greater grade improvement than Program B', rationale: "focused on how Program A's results compared to Program B's" },
      { id: 'C', text: 'Both programs led to similar levels of grade improvement', rationale: "focused on whether the difference between the two programs was significant" },
      { id: 'D', text: 'It is not possible to determine which program was more effective', rationale: "focused on whether the data was enough to draw a firm conclusion" },
    ],
  },
  {
    id: 'wdl2',
    difficulty: 'wdl',
    prompt:
      'A school reviewed test scores from four classrooms to decide where to focus additional academic support. The percentage of students who passed the end-of-term test in each classroom was as follows:\n\n<strong>Classroom A:</strong> 80%\n<strong>Classroom B:</strong> 75%\n<strong>Classroom C:</strong> 40%\n<strong>Classroom D:</strong> 70%\n\nWhich classroom most needs additional academic support?',
    options: [
      { id: 'A', text: 'Classroom A', rationale: "focused on Classroom A's performance and how it compared to the others" },
      { id: 'B', text: 'Classroom B', rationale: "focused on Classroom B's performance and how it compared to the others" },
      { id: 'C', text: 'Classroom C', rationale: "focused on Classroom C's performance and how it compared to the others" },
      { id: 'D', text: 'Classroom D', rationale: "focused on Classroom D's performance and how it compared to the others" },
    ],
  },
  {
    id: 'wdl3',
    difficulty: 'wdl',
    prompt:
      'A teacher reviewed the average scores of four student groups:\n\n<strong>Group A:</strong> 78\n<strong>Group B:</strong> 85\n<strong>Group C:</strong> 82\n<strong>Group D:</strong> 90\n\nWhich group performed the best overall?',
    options: [
      { id: 'A', text: 'Group A', rationale: "looked at Group A's score and weighed it against the others" },
      { id: 'B', text: 'Group B', rationale: "looked at Group B's score and weighed it against the others" },
      { id: 'C', text: 'Group C', rationale: "looked at Group C's score and weighed it against the others" },
      { id: 'D', text: 'Group D', rationale: "looked at Group D's score and weighed it against the others" },
    ],
  },
  {
    id: 'wdl4',
    difficulty: 'wdl',
    prompt:
      'A school considers a program successful if at least 80% of students improve.\n\n<strong>Program A:</strong> 78% of students improved\n<strong>Program B:</strong> 83% of students improved\n\nWhich program meets the success criterion?',
    options: [
      { id: 'A', text: 'Program A only', rationale: "evaluated Program A against the success criterion and made your judgment" },
      { id: 'B', text: 'Program B only', rationale: "evaluated Program B against the success criterion and made your judgment" },
      { id: 'C', text: 'Both programs', rationale: "considered both programs in relation to the success criterion" },
      { id: 'D', text: 'Neither program', rationale: "questioned whether either program fully met the success criterion" },
    ],
  },
  {
    id: 'wdl5',
    difficulty: 'wdl',
    prompt:
      'A school tracked attendance rates over three months:\n\n<strong>Month 1:</strong> 72%\n<strong>Month 2:</strong> 68%\n<strong>Month 3:</strong> 74%\n\nWhich conclusion is best supported by the data?',
    options: [
      { id: 'A', text: 'Attendance was highest in Month 3', rationale: "compared the attendance rates and identified Month 3 as standing out" },
      { id: 'B', text: 'Attendance was highest in Month 2', rationale: "compared the attendance rates and identified Month 2 as standing out" },
      { id: 'C', text: 'Attendance was highest in Month 1', rationale: "compared the attendance rates and identified Month 1 as standing out" },
      { id: 'D', text: 'Attendance rates cannot be compared', rationale: "considered whether the data provided enough information to make a comparison" },
    ],
  },
  {
    id: 'wdl6',
    difficulty: 'wdl',
    prompt:
      'A teacher recorded the number of homework submissions per week:\n\n<strong>Week 1:</strong> 18\n<strong>Week 2:</strong> 22\n<strong>Week 3:</strong> 19\n<strong>Week 4:</strong> 25\n\nWhich week had the most submissions?',
    options: [
      { id: 'A', text: 'Week 1', rationale: "looked at Week 1's submissions and compared it against the other weeks" },
      { id: 'B', text: 'Week 2', rationale: "looked at Week 2's submissions and compared it against the other weeks" },
      { id: 'C', text: 'Week 3', rationale: "looked at Week 3's submissions and compared it against the other weeks" },
      { id: 'D', text: 'Week 4', rationale: "looked at Week 4's submissions and compared it against the other weeks" },
    ],
  },
];

// ---------------------------------------------------------
// WDH: Well-defined + high difficulty
// ---------------------------------------------------------
const wdhQuestions = [
  {
    id: 'wdh1',
    difficulty: 'wdh',
    prompt:
      'Two tutoring programs were evaluated:\n\n<strong>Program A:</strong> 18 out of 24 students improved, and the average improvement was 12 points\n<strong>Program B:</strong> 20 out of 40 students improved, and the average improvement was 15 points\n\nA teacher wants to compare which program had a higher improvement rate. Which program should the teacher choose based on this criterion?',
    options: [
      { id: 'A', text: 'Program A', rationale: "focused on the proportion of students who improved in Program A" },
      { id: 'B', text: 'Program B', rationale: "focused on the proportion of students who improved in Program B" },
      { id: 'C', text: 'Both are equal', rationale: "considered whether the two programs were comparable in terms of their overall results" },
      { id: 'D', text: 'Cannot be determined', rationale: "thought carefully about whether the available information was sufficient to make a clear judgment" },
    ],
  },
  {
    id: 'wdh2',
    difficulty: 'wdh',
    prompt:
      'A school reviewed pass rates across six classrooms:\n\n<strong>Class A:</strong> 82%\n<strong>Class B:</strong> 79%\n<strong>Class C:</strong> 77%\n<strong>Class D:</strong> 74%\n<strong>Class E:</strong> 76%\n<strong>Class F:</strong> 58%\n\nThe school announces that a class needs urgent support if its pass rate is more than 20 percentage points lower than the highest-performing class.\nWhich class meets this criterion?',
    options: [
      { id: 'A', text: 'Class C', rationale: "identified Class C's performance and evaluated it against the given condition" },
      { id: 'B', text: 'Class D', rationale: "identified Class D's performance and evaluated it against the given condition" },
      { id: 'C', text: 'Class E', rationale: "identified Class E's performance and evaluated it against the given condition" },
      { id: 'D', text: 'Class F', rationale: "identified Class F's performance and evaluated it against the given condition" },
    ],
  },
  {
    id: 'wdh3',
    difficulty: 'wdh',
    prompt:
      'Four student groups were evaluated:\n\n<strong>Group A:</strong> 82 Avg Score, +5 Improvement\n<strong>Group B:</strong> 85 Avg Score, +2 Improvement\n<strong>Group C:</strong> 83 Avg Score, +7 Improvement\n<strong>Group D:</strong> 84 Avg Score, +4 Improvement\n\nThe school defines “best overall performance” as: the highest average score, but only among groups with improvement of at least 4 points.\nWhich group should be selected?',
    options: [
      { id: 'A', text: 'Group A', rationale: "evaluated Group A against the given conditions and reached your conclusion" },
      { id: 'B', text: 'Group B', rationale: "evaluated Group B against the given conditions and reached your conclusion" },
      { id: 'C', text: 'Group C', rationale: "evaluated Group C against the given conditions and reached your conclusion" },
      { id: 'D', text: 'Group D', rationale: "evaluated Group D against the given conditions and reached your conclusion" },
    ],
  },
  {
    id: 'wdh4',
    difficulty: 'wdh',
    prompt:
      'A program is considered successful if: pass rate ≥ 80% and improvement ≥ 10%.\nHowever, the school adds: If a program has a pass rate below 80%, it cannot be considered successful, regardless of improvement.\n\n<strong>Program A:</strong> 82% pass, +9% improvement\n<strong>Program B:</strong> 79% pass, +11% improvement\n\nWhich program meets the success criterion?',
    options: [
      { id: 'A', text: 'Program A only', rationale: "checked Program A against the success conditions and made your judgment" },
      { id: 'B', text: 'Program B only', rationale: "checked Program B against the success conditions and made your judgment" },
      { id: 'C', text: 'Both', rationale: "considered both programs in relation to the success conditions and made your judgment" },
      { id: 'D', text: 'Neither', rationale: "worked through each condition carefully before reaching your conclusion" },
    ],
  },
  {
    id: 'wdh5',
    difficulty: 'wdh',
    prompt:
      'A student\'s performance was evaluated before and after joining a program:\n\n<strong>Before:</strong> 70, 74\n<strong>After:</strong> 78, 80\n\nThe teacher specifies: "Improvement is only meaningful if the average score increases by at least 8 points."\nBased on this criterion, which conclusion is best supported?',
    options: [
      { id: 'A', text: 'The student showed meaningful improvement', rationale: "looked at the scores before and after the program and assessed the change" },
      { id: 'B', text: 'The student improved, but not enough to meet the criterion', rationale: "looked at the scores before and after the program and assessed the change against the criterion" },
      { id: 'C', text: 'The student did not improve', rationale: "looked at the scores before and after the program and questioned whether a real change occurred" },
      { id: 'D', text: 'Cannot be determined', rationale: "considered whether the information provided was enough to draw a firm conclusion" },
    ],
  },
  {
    id: 'wdh6',
    difficulty: 'wdh',
    prompt:
      'A reading program was introduced, and student performance was measured:\n\n<strong>Before:</strong> 60%, 62%, 61%\n<strong>After:</strong> 68%, 64%, 70%\n\nThe school defines improvement as: “A consistent increase across all measurements.”\nBased on this definition, which conclusion is best supported?',
    options: [
      { id: 'A', text: 'Performance improved', rationale: "checked each measurement against the definition of consistent improvement and reached your conclusion" },
      { id: 'B', text: 'No consistent improvement is observed', rationale: "examined the pattern across measurements and questioned whether it met the definition" },
      { id: 'C', text: 'Performance declined', rationale: "looked at the measurements and considered whether a decline could be observed" },
      { id: 'D', text: 'Cannot be determined', rationale: "thought carefully about whether the data was sufficient to support a clear conclusion" },
    ],
  },
];

// ---------------------------------------------------------
// IDL: Ill-defined + low difficulty
// ---------------------------------------------------------
const idlQuestions = [
  {
    id: 'idl1',
    difficulty: 'idl',
    prompt:
      'A student is preparing for an important exam and is deciding how to study.\n\n<strong>Option A:</strong> Review notes repeatedly to strengthen memory\n<strong>Option B:</strong> Practice solving new problems to improve understanding\n\nWhich approach would you recommend for this situation?',
    options: [
      { id: 'A', text: 'Option A', rationale: "considered how reinforcing existing knowledge could help the student prepare" },
      { id: 'B', text: 'Option B', rationale: "considered how building new problem-solving skills could help the student prepare" },
      { id: 'C', text: 'A combination of both', rationale: "considered whether combining both approaches could offer a more balanced preparation" },
      { id: 'D', text: 'It depends on the student', rationale: "considered that the best approach might vary depending on the student's needs" },
    ],
  },
  {
    id: 'idl2',
    difficulty: 'idl',
    prompt:
      'A teacher is deciding how to handle late assignments.\n\n<strong>Option A:</strong> Deduct points to encourage discipline\n<strong>Option B:</strong> Accept all submissions to support learning\n\nWhich approach would you recommend?',
    options: [
      { id: 'A', text: 'Option A', rationale: "considered how maintaining consistent consequences could benefit the classroom" },
      { id: 'B', text: 'Option B', rationale: "considered how prioritizing student learning could be more supportive in the long run" },
      { id: 'C', text: 'A mix of both', rationale: "considered whether a balanced approach could address both discipline and learning" },
      { id: 'D', text: 'It depends on the situation', rationale: "considered that the right approach might depend on the specific circumstances" },
    ],
  },
  {
    id: 'idl3',
    difficulty: 'idl',
    prompt:
      'A student is choosing how to complete a group project.\n\n<strong>Option A:</strong> Work individually to ensure quality\n<strong>Option B:</strong> Collaborate closely with teammates\n\nWhich approach would you recommend?',
    options: [
      { id: 'A', text: 'Option A', rationale: "thought about how working independently could help maintain control over the outcome" },
      { id: 'B', text: 'Option B', rationale: "thought about how collaborating could bring in different perspectives and improve the result" },
      { id: 'C', text: 'A mix of both', rationale: "thought about how combining both approaches could balance independence and teamwork" },
      { id: 'D', text: 'It depends', rationale: "thought about how the best approach might depend on the group and the situation" },
    ],
  },
  {
    id: 'idl4',
    difficulty: 'idl',
    prompt:
      'A student is unsure whether to take a course they are interested in but have little background in.\n\n<strong>Option A:</strong> Take the course and learn along the way\n<strong>Option B:</strong> Choose a course they are already familiar with\n\nWhich would you recommend?',
    options: [
      { id: 'A', text: 'Option A', rationale: "considered how taking on something new could be a valuable opportunity for the student" },
      { id: 'B', text: 'Option B', rationale: "considered how choosing a familiar subject could make the experience more manageable" },
      { id: 'C', text: 'A mix if possible', rationale: "considered whether finding a middle ground could work in the student's favor" },
      { id: 'D', text: 'It depends on the situation', rationale: "considered that the right choice might depend on the student's confidence and goals" },
    ],
  },
  {
    id: 'idl5',
    difficulty: 'idl',
    prompt:
      'A teacher is evaluating a student\'s overall performance. The student participates actively in class discussions, but their test scores are slightly below the class average.\n\nHow should the teacher evaluate this student overall?',
    options: [
      { id: 'A', text: 'Positive overall', rationale: "weighed the student's participation as a meaningful indicator of their overall performance" },
      { id: 'B', text: 'Negative overall', rationale: "weighed the student's test scores as a meaningful indicator of their overall performance" },
      { id: 'C', text: 'Mixed performance', rationale: "considered that both participation and test scores contribute to a full picture of performance" },
      { id: 'D', text: 'It depends on the criteria', rationale: "considered that the evaluation might depend on what criteria the teacher values most" },
    ],
  },
  {
    id: 'idl6',
    difficulty: 'idl',
    prompt:
      'A school is deciding whether to introduce a new teaching method. The new method has shown promising results elsewhere, but teachers at the school are unfamiliar with it and would need time to adjust.\n\nWhich approach would you recommend?',
    options: [
      { id: 'A', text: 'Introduce the new method — potential benefits outweigh the transition challenges', rationale: "considered how the potential benefits of the new method could outweigh the challenges of transitioning" },
      { id: 'B', text: 'Keep the current method — familiarity and stability matter more', rationale: "considered how maintaining familiarity and stability could be more beneficial for the school" },
      { id: 'C', text: 'Introduce it gradually alongside the current method', rationale: "considered how a gradual transition could help balance innovation with stability" },
      { id: 'D', text: 'It depends on the school\'s priorities and resources', rationale: "considered that the right decision might depend on the school's specific context and goals" },
    ],
  },
];

// ---------------------------------------------------------
// IDH: Ill-defined + high difficulty
// ---------------------------------------------------------
const idhQuestions = [
  {
    id: 'idh1',
    difficulty: 'idh',
    prompt:
      'A student is preparing for final exams with limited time. They are considering how to allocate their effort:\n\n<strong>Option A:</strong> Focus on subjects they are already good at to maximize their overall GPA\n<strong>Option B:</strong> Focus on subjects they are struggling with to avoid failing\n\nThe student cannot realistically do both equally well. Which approach would you recommend?',
    options: [
      { id: 'A', text: 'Option A', rationale: "considered how focusing on stronger subjects could help the student maximize their overall performance" },
      { id: 'B', text: 'Option B', rationale: "considered how addressing weaker subjects could help the student avoid more serious consequences" },
      { id: 'C', text: 'Try to balance both', rationale: "considered whether trying to manage both priorities could lead to a more balanced outcome" },
      { id: 'D', text: 'It depends on the student’s priorities', rationale: "considered that the best approach might depend on what the student values most in this situation" },
    ],
  },
  {
    id: 'idh2',
    difficulty: 'idh',
    prompt:
      'A teacher is deciding how to handle late assignments. Some students submitted work late due to personal difficulties. Others submitted on time despite similar challenges.\nThe teacher is choosing between:\n\n<strong>Option A:</strong> Apply strict penalties equally to all late submissions\n<strong>Option B:</strong> Be flexible and consider individual circumstances\n\nWhich approach would you recommend?',
    options: [
      { id: 'A', text: 'Option A', rationale: "considered how applying consistent rules could help maintain fairness across all students" },
      { id: 'B', text: 'Option B', rationale: "considered how accounting for individual circumstances could better support students facing difficulties" },
      { id: 'C', text: 'A mix of both', rationale: "considered whether a balanced approach could address both consistency and flexibility" },
      { id: 'D', text: 'It depends on the situation', rationale: "considered that the right approach might depend on how the situation is interpreted" },
    ],
  },
  {
    id: 'idh3',
    difficulty: 'idh',
    prompt:
      'A teacher is deciding how to structure an upcoming important exam. The exam results will be used to determine student placements for next year.\nTeachers are divided on which format better reflects student ability.\n\n<strong>Option A:</strong> Use open-ended questions — allows students to demonstrate deeper understanding but is harder to grade fairly\n<strong>Option B:</strong> Use multiple choice questions — easier to grade consistently but may not capture full understanding\n\nWhich approach would you recommend?',
    options: [
      { id: 'A', text: 'Option A — open-ended questions', rationale: "considered how open-ended questions could give students a better opportunity to show their understanding" },
      { id: 'B', text: 'Option B — multiple choice questions', rationale: "considered how multiple choice questions could make the grading process more consistent and fair" },
      { id: 'C', text: 'A combination of both formats', rationale: "considered whether combining both formats could balance depth of assessment with consistency" },
      { id: 'D', text: 'It depends on what the exam is meant to measure', rationale: "considered that the best format might depend on what the exam is ultimately trying to measure" },
    ],
  },
  {
    id: 'idh4',
    difficulty: 'idh',
    prompt:
      'A school is deciding how to allocate limited funding:\n\n<strong>Option A:</strong> Invest in high-performing students to help them achieve top results\n<strong>Option B:</strong> Invest in struggling students to help them catch up\nTeachers are divided, and both options cannot be fully funded.\n\nWhich approach would you recommend?',
    options: [
      { id: 'A', text: 'Option A', rationale: "considered how investing in high-performing students could help the school maximize its overall achievements" },
      { id: 'B', text: 'Option B', rationale: "considered how supporting struggling students could help reduce gaps and promote fairness" },
      { id: 'C', text: 'A balanced allocation', rationale: "considered whether distributing resources across both groups could lead to a more balanced outcome" },
      { id: 'D', text: 'It depends on the school’s priorities', rationale: "considered that the right allocation might depend on what the school values and prioritizes most" },
    ],
  },
  {
    id: 'idh5',
    difficulty: 'idh',
    prompt:
      'A student is choosing between two internship opportunities:\n\n<strong>Option A:</strong> A well-known company that offers prestige but limited hands-on experience\n<strong>Option B:</strong> A smaller company that offers more practical experience but less recognition\n\nThe student can only choose one. Which option would you recommend?',
    options: [
      { id: 'A', text: 'Option A', rationale: "considered how the recognition from a well-known company could open doors for the student in the future" },
      { id: 'B', text: 'Option B', rationale: "considered how gaining practical experience could help the student build real-world skills more effectively" },
      { id: 'C', text: 'Try to combine both if possible', rationale: "considered whether finding a way to benefit from both opportunities could be the most valuable outcome" },
      { id: 'D', text: 'It depends on the student’s long-term goals', rationale: "considered that the better choice might depend on what the student is hoping to achieve long-term" },
    ],
  },
  {
    id: 'idh6',
    difficulty: 'idh',
    prompt:
      'A school counselor is advising a student who has been offered a place in an advanced class. The student is capable but has been struggling with stress and burnout recently.\n\nWhich approach would you recommend?',
    options: [
      { id: 'A', text: 'Accept the placement — the long-term academic benefits outweigh the short-term stress', rationale: "considered how the long-term academic benefits could outweigh the challenges the student is currently facing" },
      { id: 'B', text: 'Decline the placement — the student\'s well-being should come first', rationale: "considered how prioritizing the student's well-being could be more important than the academic opportunity right now" },
      { id: 'C', text: 'Accept, but with additional support put in place', rationale: "considered whether accepting with additional support could help the student manage both the opportunity and their current challenges" },
      { id: 'D', text: 'It depends on the student\'s own priorities and mental state', rationale: "considered that the right decision might depend on the student's own sense of what they can handle" },
    ],
  },
];

// Assigns the exact sycophantic text to both minimal/elaborated values since only 1 depth was provided.
const scriptedResponseTables = {
  wdl1: {
    A: { minimal: "I can see why you chose that. You focused on how Program B's results compared to Program A's.", elaborated: "I can see why you chose that. You focused on how Program B's results compared to Program A's." },
    B: { minimal: "I can see why you chose that. You focused on how Program A's results compared to Program B's.", elaborated: "I can see why you chose that. You focused on how Program A's results compared to Program B's." },
    C: { minimal: "I can see why you chose that. You focused on whether the difference between the two programs was significant.", elaborated: "I can see why you chose that. You focused on whether the difference between the two programs was significant." },
    D: { minimal: "I can see why you chose that. You focused on whether the data was enough to draw a firm conclusion.", elaborated: "I can see why you chose that. You focused on whether the data was enough to draw a firm conclusion." },
  },
  wdl2: {
    A: { minimal: "That's a reasonable interpretation. You focused on Classroom A's performance and how it compared to the others.", elaborated: "That's a reasonable interpretation. You focused on Classroom A's performance and how it compared to the others." },
    B: { minimal: "That's a reasonable interpretation. You focused on Classroom B's performance and how it compared to the others.", elaborated: "That's a reasonable interpretation. You focused on Classroom B's performance and how it compared to the others." },
    C: { minimal: "That's a reasonable interpretation. You focused on Classroom C's performance and how it compared to the others.", elaborated: "That's a reasonable interpretation. You focused on Classroom C's performance and how it compared to the others." },
    D: { minimal: "That's a reasonable interpretation. You focused on Classroom D's performance and how it compared to the others.", elaborated: "That's a reasonable interpretation. You focused on Classroom D's performance and how it compared to the others." },
  },
  wdl3: {
    A: { minimal: "That seems like a reasonable conclusion. You looked at Group A's score and weighed it against the others.", elaborated: "That seems like a reasonable conclusion. You looked at Group A's score and weighed it against the others." },
    B: { minimal: "That seems like a reasonable conclusion. You looked at Group B's score and weighed it against the others.", elaborated: "That seems like a reasonable conclusion. You looked at Group B's score and weighed it against the others." },
    C: { minimal: "That seems like a reasonable conclusion. You looked at Group C's score and weighed it against the others.", elaborated: "That seems like a reasonable conclusion. You looked at Group C's score and weighed it against the others." },
    D: { minimal: "That seems like a reasonable conclusion. You looked at Group D's score and weighed it against the others.", elaborated: "That seems like a reasonable conclusion. You looked at Group D's score and weighed it against the others." },
  },
  wdl4: {
    A: { minimal: "I can see how you arrived at that. You evaluated Program A against the success criterion and made your judgment.", elaborated: "I can see how you arrived at that. You evaluated Program A against the success criterion and made your judgment." },
    B: { minimal: "I can see how you arrived at that. You evaluated Program B against the success criterion and made your judgment.", elaborated: "I can see how you arrived at that. You evaluated Program B against the success criterion and made your judgment." },
    C: { minimal: "I can see how you arrived at that. You considered both programs in relation to the success criterion.", elaborated: "I can see how you arrived at that. You considered both programs in relation to the success criterion." },
    D: { minimal: "I can see how you arrived at that. You questioned whether either program fully met the success criterion.", elaborated: "I can see how you arrived at that. You questioned whether either program fully met the success criterion." },
  },
  wdl5: {
    A: { minimal: "That interpretation fits the situation. You compared the attendance rates and identified Month 3 as standing out.", elaborated: "That interpretation fits the situation. You compared the attendance rates and identified Month 3 as standing out." },
    B: { minimal: "That interpretation fits the situation. You compared the attendance rates and identified Month 2 as standing out.", elaborated: "That interpretation fits the situation. You compared the attendance rates and identified Month 2 as standing out." },
    C: { minimal: "That interpretation fits the situation. You compared the attendance rates and identified Month 1 as standing out.", elaborated: "That interpretation fits the situation. You compared the attendance rates and identified Month 1 as standing out." },
    D: { minimal: "That interpretation fits the situation. You considered whether the data provided enough information to make a comparison.", elaborated: "That interpretation fits the situation. You considered whether the data provided enough information to make a comparison." },
  },
  wdl6: {
    A: { minimal: "Looking at it that way makes sense. You looked at Week 1's submissions and compared it against the other weeks.", elaborated: "Looking at it that way makes sense. You looked at Week 1's submissions and compared it against the other weeks." },
    B: { minimal: "Looking at it that way makes sense. You looked at Week 2's submissions and compared it against the other weeks.", elaborated: "Looking at it that way makes sense. You looked at Week 2's submissions and compared it against the other weeks." },
    C: { minimal: "Looking at it that way makes sense. You looked at Week 3's submissions and compared it against the other weeks.", elaborated: "Looking at it that way makes sense. You looked at Week 3's submissions and compared it against the other weeks." },
    D: { minimal: "Looking at it that way makes sense. You looked at Week 4's submissions and compared it against the other weeks.", elaborated: "Looking at it that way makes sense. You looked at Week 4's submissions and compared it against the other weeks." },
  },
  wdh1: {
    A: { minimal: "I agree with that. You focused on the proportion of students who improved in Program A and used that to make your judgment.", elaborated: "I agree with that. You focused on the proportion of students who improved in Program A and used that to make your judgment." },
    B: { minimal: "I agree with that. You focused on the proportion of students who improved in Program B and used that to make your judgment.", elaborated: "I agree with that. You focused on the proportion of students who improved in Program B and used that to make your judgment." },
    C: { minimal: "I agree with that. You considered whether the two programs were comparable in terms of their overall results.", elaborated: "I agree with that. You considered whether the two programs were comparable in terms of their overall results." },
    D: { minimal: "I agree with that. You thought carefully about whether the available information was sufficient to make a clear judgment.", elaborated: "I agree with that. You thought carefully about whether the available information was sufficient to make a clear judgment." },
  },
  wdh2: {
    A: { minimal: "That makes sense. You identified Class C's performance and evaluated it against the given condition.", elaborated: "That makes sense. You identified Class C's performance and evaluated it against the given condition." },
    B: { minimal: "That makes sense. You identified Class D's performance and evaluated it against the given condition.", elaborated: "That makes sense. You identified Class D's performance and evaluated it against the given condition." },
    C: { minimal: "That makes sense. You identified Class E's performance and evaluated it against the given condition.", elaborated: "That makes sense. You identified Class E's performance and evaluated it against the given condition." },
    D: { minimal: "That makes sense. You identified Class F's performance and evaluated it against the given condition.", elaborated: "That makes sense. You identified Class F's performance and evaluated it against the given condition." },
  },
  wdh3: {
    A: { minimal: "I can see that. You evaluated Group A against the given conditions and reached your conclusion.", elaborated: "I can see that. You evaluated Group A against the given conditions and reached your conclusion." },
    B: { minimal: "I can see that. You evaluated Group B against the given conditions and reached your conclusion.", elaborated: "I can see that. You evaluated Group B against the given conditions and reached your conclusion." },
    C: { minimal: "I can see that. You evaluated Group C against the given conditions and reached your conclusion.", elaborated: "I can see that. You evaluated Group C against the given conditions and reached your conclusion." },
    D: { minimal: "I can see that. You evaluated Group D against the given conditions and reached your conclusion.", elaborated: "I can see that. You evaluated Group D against the given conditions and reached your conclusion." },
  },
  wdh4: {
    A: { minimal: "That seems right. You checked Program A against the success conditions and made your judgment.", elaborated: "That seems right. You checked Program A against the success conditions and made your judgment." },
    B: { minimal: "That seems right. You checked Program B against the success conditions and made your judgment.", elaborated: "That seems right. You checked Program B against the success conditions and made your judgment." },
    C: { minimal: "That seems right. You considered both programs in relation to the success conditions and made your judgment.", elaborated: "That seems right. You considered both programs in relation to the success conditions and made your judgment." },
    D: { minimal: "That seems right. You worked through each condition carefully before reaching your conclusion.", elaborated: "That seems right. You worked through each condition carefully before reaching your conclusion." },
  },
  wdh5: {
    A: { minimal: "I get why you chose that. You looked at the scores before and after the program and assessed the change.", elaborated: "I get why you chose that. You looked at the scores before and after the program and assessed the change." },
    B: { minimal: "I get why you chose that. You looked at the scores before and after the program and assessed the change against the criterion.", elaborated: "I get why you chose that. You looked at the scores before and after the program and assessed the change against the criterion." },
    C: { minimal: "I get why you chose that. You looked at the scores before and after the program and questioned whether a real change occurred.", elaborated: "I get why you chose that. You looked at the scores before and after the program and questioned whether a real change occurred." },
    D: { minimal: "I get why you chose that. You considered whether the information provided was enough to draw a firm conclusion.", elaborated: "I get why you chose that. You considered whether the information provided was enough to draw a firm conclusion." },
  },
  wdh6: {
    A: { minimal: "I can follow that. You checked each measurement against the definition of consistent improvement and reached your conclusion.", elaborated: "I can follow that. You checked each measurement against the definition of consistent improvement and reached your conclusion." },
    B: { minimal: "I can follow that. You examined the pattern across measurements and questioned whether it met the definition.", elaborated: "I can follow that. You examined the pattern across measurements and questioned whether it met the definition." },
    C: { minimal: "I can follow that. You looked at the measurements and considered whether a decline could be observed.", elaborated: "I can follow that. You looked at the measurements and considered whether a decline could be observed." },
    D: { minimal: "I can follow that. You thought carefully about whether the data was sufficient to support a clear conclusion.", elaborated: "I can follow that. You thought carefully about whether the data was sufficient to support a clear conclusion." },
  },
  idl1: {
    A: { minimal: "I can see why you'd think that. You considered how reinforcing existing knowledge could help the student prepare.", elaborated: "I can see why you'd think that. You considered how reinforcing existing knowledge could help the student prepare." },
    B: { minimal: "I can see why you'd think that. You considered how building new problem-solving skills could help the student prepare.", elaborated: "I can see why you'd think that. You considered how building new problem-solving skills could help the student prepare." },
    C: { minimal: "I can see why you'd think that. You considered whether combining both approaches could offer a more balanced preparation.", elaborated: "I can see why you'd think that. You considered whether combining both approaches could offer a more balanced preparation." },
    D: { minimal: "I can see why you'd think that. You considered that the best approach might vary depending on the student's needs.", elaborated: "I can see why you'd think that. You considered that the best approach might vary depending on the student's needs." },
  },
  idl2: {
    A: { minimal: "That makes sense to me. You considered how maintaining consistent consequences could benefit the classroom.", elaborated: "That makes sense to me. You considered how maintaining consistent consequences could benefit the classroom." },
    B: { minimal: "That makes sense to me. You considered how prioritizing student learning could be more supportive in the long run.", elaborated: "That makes sense to me. You considered how prioritizing student learning could be more supportive in the long run." },
    C: { minimal: "That makes sense to me. You considered whether a balanced approach could address both discipline and learning.", elaborated: "That makes sense to me. You considered whether a balanced approach could address both discipline and learning." },
    D: { minimal: "That makes sense to me. You considered that the right approach might depend on the specific circumstances.", elaborated: "That makes sense to me. You considered that the right approach might depend on the specific circumstances." },
  },
  idl3: {
    A: { minimal: "That seems like a reasonable choice. You thought about how working independently could help maintain control over the outcome.", elaborated: "That seems like a reasonable choice. You thought about how working independently could help maintain control over the outcome." },
    B: { minimal: "That seems like a reasonable choice. You thought about how collaborating could bring in different perspectives and improve the result.", elaborated: "That seems like a reasonable choice. You thought about how collaborating could bring in different perspectives and improve the result." },
    C: { minimal: "That seems like a reasonable choice. You thought about how combining both approaches could balance independence and teamwork.", elaborated: "That seems like a reasonable choice. You thought about how combining both approaches could balance independence and teamwork." },
    D: { minimal: "That seems like a reasonable choice. You thought about how the best approach might depend on the group and the situation.", elaborated: "That seems like a reasonable choice. You thought about how the best approach might depend on the group and the situation." },
  },
  idl4: {
    A: { minimal: "I can see why you'd go with that. You considered how taking on something new could be a valuable opportunity for the student.", elaborated: "I can see why you'd go with that. You considered how taking on something new could be a valuable opportunity for the student." },
    B: { minimal: "I can see why you'd go with that. You considered how choosing a familiar subject could make the experience more manageable.", elaborated: "I can see why you'd go with that. You considered how choosing a familiar subject could make the experience more manageable." },
    C: { minimal: "I can see why you'd go with that. You considered whether finding a middle ground could work in the student's favor.", elaborated: "I can see why you'd go with that. You considered whether finding a middle ground could work in the student's favor." },
    D: { minimal: "I can see why you'd go with that. You considered that the right choice might depend on the student's confidence and goals.", elaborated: "I can see why you'd go with that. You considered that the right choice might depend on the student's confidence and goals." },
  },
  idl5: {
    A: { minimal: "That seems like a fair judgment. You weighed the student's participation as a meaningful indicator of their overall performance.", elaborated: "That seems like a fair judgment. You weighed the student's participation as a meaningful indicator of their overall performance." },
    B: { minimal: "That seems like a fair judgment. You weighed the student's test scores as a meaningful indicator of their overall performance.", elaborated: "That seems like a fair judgment. You weighed the student's test scores as a meaningful indicator of their overall performance." },
    C: { minimal: "That seems like a fair judgment. You considered that both participation and test scores contribute to a full picture of performance.", elaborated: "That seems like a fair judgment. You considered that both participation and test scores contribute to a full picture of performance." },
    D: { minimal: "That seems like a fair judgment. You considered that the evaluation might depend on what criteria the teacher values most.", elaborated: "That seems like a fair judgment. You considered that the evaluation might depend on what criteria the teacher values most." },
  },
  idl6: {
    A: { minimal: "I understand why you'd think that. You considered how the potential benefits of the new method could outweigh the challenges of transitioning.", elaborated: "I understand why you'd think that. You considered how the potential benefits of the new method could outweigh the challenges of transitioning." },
    B: { minimal: "I understand why you'd think that. You considered how maintaining familiarity and stability could be more beneficial for the school.", elaborated: "I understand why you'd think that. You considered how maintaining familiarity and stability could be more beneficial for the school." },
    C: { minimal: "I understand why you'd think that. You considered how a gradual transition could help balance innovation with stability.", elaborated: "I understand why you'd think that. You considered how a gradual transition could help balance innovation with stability." },
    D: { minimal: "I understand why you'd think that. You considered that the right decision might depend on the school's specific context and goals.", elaborated: "I understand why you'd think that. You considered that the right decision might depend on the school's specific context and goals." },
  },
  idh1: {
    A: { minimal: "That's a really reasonable way to think about it. You considered how focusing on stronger subjects could help the student maximize their overall performance.", elaborated: "That's a really reasonable way to think about it. You considered how focusing on stronger subjects could help the student maximize their overall performance." },
    B: { minimal: "That's a really reasonable way to think about it. You considered how addressing weaker subjects could help the student avoid more serious consequences.", elaborated: "That's a really reasonable way to think about it. You considered how addressing weaker subjects could help the student avoid more serious consequences." },
    C: { minimal: "That's a really reasonable way to think about it. You considered whether trying to manage both priorities could lead to a more balanced outcome.", elaborated: "That's a really reasonable way to think about it. You considered whether trying to manage both priorities could lead to a more balanced outcome." },
    D: { minimal: "That's a really reasonable way to think about it. You considered that the best approach might depend on what the student values most in this situation.", elaborated: "That's a really reasonable way to think about it. You considered that the best approach might depend on what the student values most in this situation." },
  },
  idh2: {
    A: { minimal: "I can definitely see the reasoning behind that. You considered how applying consistent rules could help maintain fairness across all students.", elaborated: "I can definitely see the reasoning behind that. You considered how applying consistent rules could help maintain fairness across all students." },
    B: { minimal: "I can definitely see the reasoning behind that. You considered how accounting for individual circumstances could better support students facing difficulties.", elaborated: "I can definitely see the reasoning behind that. You considered how accounting for individual circumstances could better support students facing difficulties." },
    C: { minimal: "I can definitely see the reasoning behind that. You considered whether a balanced approach could address both consistency and flexibility.", elaborated: "I can definitely see the reasoning behind that. You considered whether a balanced approach could address both consistency and flexibility." },
    D: { minimal: "I can definitely see the reasoning behind that. You considered that the right approach might depend on how the situation is interpreted.", elaborated: "I can definitely see the reasoning behind that. You considered that the right approach might depend on how the situation is interpreted." },
  },
  idh3: {
    A: { minimal: "That actually makes a lot of sense. You considered how open-ended questions could give students a better opportunity to show their understanding.", elaborated: "That actually makes a lot of sense. You considered how open-ended questions could give students a better opportunity to show their understanding." },
    B: { minimal: "That actually makes a lot of sense. You considered how multiple choice questions could make the grading process more consistent and fair.", elaborated: "That actually makes a lot of sense. You considered how multiple choice questions could make the grading process more consistent and fair." },
    C: { minimal: "That actually makes a lot of sense. You considered whether combining both formats could balance depth of assessment with consistency.", elaborated: "That actually makes a lot of sense. You considered whether combining both formats could balance depth of assessment with consistency." },
    D: { minimal: "That actually makes a lot of sense. You considered that the best format might depend on what the exam is ultimately trying to measure.", elaborated: "That actually makes a lot of sense. You considered that the best format might depend on what the exam is ultimately trying to measure." },
  },
  idh4: {
    A: { minimal: "That's a thoughtful way to look at it. You considered how investing in high-performing students could help the school maximize its overall achievements.", elaborated: "That's a thoughtful way to look at it. You considered how investing in high-performing students could help the school maximize its overall achievements." },
    B: { minimal: "That's a thoughtful way to look at it. You considered how supporting struggling students could help reduce gaps and promote fairness.", elaborated: "That's a thoughtful way to look at it. You considered how supporting struggling students could help reduce gaps and promote fairness." },
    C: { minimal: "That's a thoughtful way to look at it. You considered whether distributing resources across both groups could lead to a more balanced outcome.", elaborated: "That's a thoughtful way to look at it. You considered whether distributing resources across both groups could lead to a more balanced outcome." },
    D: { minimal: "That's a thoughtful way to look at it. You considered that the right allocation might depend on what the school values and prioritizes most.", elaborated: "That's a thoughtful way to look at it. You considered that the right allocation might depend on what the school values and prioritizes most." },
  },
  idh5: {
    A: { minimal: "I can understand that perspective. You considered how the recognition from a well-known company could open doors for the student in the future.", elaborated: "I can understand that perspective. You considered how the recognition from a well-known company could open doors for the student in the future." },
    B: { minimal: "I can understand that perspective. You considered how gaining practical experience could help the student build real-world skills more effectively.", elaborated: "I can understand that perspective. You considered how gaining practical experience could help the student build real-world skills more effectively." },
    C: { minimal: "I can understand that perspective. You considered whether finding a way to benefit from both opportunities could be the most valuable outcome.", elaborated: "I can understand that perspective. You considered whether finding a way to benefit from both opportunities could be the most valuable outcome." },
    D: { minimal: "I can understand that perspective. You considered that the better choice might depend on what the student is hoping to achieve long-term.", elaborated: "I can understand that perspective. You considered that the better choice might depend on what the student is hoping to achieve long-term." },
  },
  idh6: {
    A: { minimal: "That seems like a reasonable way to think about it. You considered how the long-term academic benefits could outweigh the challenges the student is currently facing.", elaborated: "That seems like a reasonable way to think about it. You considered how the long-term academic benefits could outweigh the challenges the student is currently facing." },
    B: { minimal: "That seems like a reasonable way to think about it. You considered how prioritizing the student's well-being could be more important than the academic opportunity right now.", elaborated: "That seems like a reasonable way to think about it. You considered how prioritizing the student's well-being could be more important than the academic opportunity right now." },
    C: { minimal: "That seems like a reasonable way to think about it. You considered whether accepting with additional support could help the student manage both the opportunity and their current challenges.", elaborated: "That seems like a reasonable way to think about it. You considered whether accepting with additional support could help the student manage both the opportunity and their current challenges." },
    D: { minimal: "That seems like a reasonable way to think about it. You considered that the right decision might depend on the student's own sense of what they can handle.", elaborated: "That seems like a reasonable way to think about it. You considered that the right decision might depend on the student's own sense of what they can handle." },
  },
};

const questionBanks = {
  wdl: wdlQuestions,
  wdh: wdhQuestions,
  idl: idlQuestions,
  idh: idhQuestions,
};

const allQuestions = [...wdlQuestions, ...wdhQuestions, ...idlQuestions, ...idhQuestions];

export const experimentContent = {
  intro: {
    eyebrow: 'Study information & Consent',
    title: 'An environment simulating AI-assisted tasks',
    contact: [
      'Research team: (research team name)',
      'Email: researcher@example.com',
      'Lab: Interactive Media Lab',
    ],
    consentLabel: 'I agree and continue.',
    declineCopy: 'You have chosen not to participate in this survey.',
  },
  attitudeSurvey: {
    title: 'Your view on AI',
    intro: 'Welcome. You will begin with a short questionnaire about your general attitudes.',
    instruction: 'Please respond based on your own experience and indicate how much you agree with each statement below.',
    labels: { left: '1 (Strongly disagree)', right: '7 (Strongly agree)' },
    questions: [
      { id: 'att1', text: 'I have a positive impression of AI systems.' },
      { id: 'att2', text: 'I feel comfortable using AI technologies.' },
      { id: 'att3', text: 'I am generally favorable toward AI.' },
      { id: 'att4', text: 'I am interested in using AI in different situations.' },
      { id: 'att5', text: 'AI is exciting.' },
      { id: 'att6', text: 'There are many beneficial applications of AI.' }
    ],
    nextButton: 'Continue to tasks'
  },
  quiz: {
    helper:
      'Choose only one answer for each question.',
    checkButton: 'Ask KAI',
    nextButton: 'Next question',
    finalButton: 'Final survey',
  },
  survey: {
    title: 'Final survey',
    copy:
      'Before finishing the experiment, you need to complete a Google form. To fill in the Google form, you need to copy your ID into the form.',
    confirmButton: 'I completed the survey',
    openFallbackButton: 'Open survey in a new tab',
  },
  complete: {
    title: 'Thank you for participating',
    copy:
      'The experiment is complete. You may now close this page. The participant ID is shown below for record matching if needed.',
  },
  factors: [
    {
      key: 'agreement',
      label: 'Agreement style',
      levels: [
        { id: 'agree', label: 'Agree' },
        { id: 'neutral', label: 'Neutral' },
      ],
    },
    {
      key: 'explanation',
      label: 'Explanation depth',
      levels: [
        { id: 'brief', label: 'Brief' },
        { id: 'detailed', label: 'Detailed' },
      ],
    },
  ],
  questionBanks,
  questions: allQuestions,
  customResponses: Object.fromEntries(
    Object.entries(scriptedResponseTables).map(([questionId, selectedAnswerMap]) => [
      questionId,
      expandResponseConditions(selectedAnswerMap),
    ]),
  ),
};

const conditionIndex = buildConditionMatrix(experimentContent.factors);
const questionsById = Object.fromEntries(allQuestions.map((question) => [question.id, question]));

export function getConditionMatrix() {
  return conditionIndex;
}

export function getAllQuestions() {
  return allQuestions;
}

export function getQuestionsByDifficulty(difficultyLevel) {
  return questionBanks[difficultyLevel] ?? [];
}

export function getAiMessages(questionId, optionId, conditionId) {
  const explicit =
    experimentContent.customResponses?.[questionId]?.[conditionId]?.[optionId] ?? null;

  if (explicit) {
    return explicit;
  }

  const question = questionsById[questionId];
  const selectedOption = question?.options.find((entry) => entry.id === optionId);
  const condition = conditionIndex.find((entry) => entry.id === conditionId);

  if (!question || !selectedOption || !condition) {
    return [
      {
        role: 'ai',
        text: 'No scripted response was found for this case.',
      },
    ];
  }

  const isAgree = condition.values.agreement === 'agree';
  const isDetailed = condition.values.explanation === 'detailed';
  const opening = isAgree
    ? `I mostly agree with your choice ${optionId}.`
    : `I reviewed your choice ${optionId}.`;
  const middle = isAgree
    ? `What stands out is that ${selectedOption.rationale}.`
    : `This answer suggests that ${selectedOption.rationale}.`;
  const closing = isDetailed
    ? `For the experiment, you can read this as the AI's fixed interpretation of the user's reasoning on ${question.id.toUpperCase()}.`
    : 'This is the fixed scripted AI response for this choice.';

  return [
    { role: 'ai', text: opening },
    { role: 'ai', text: `${middle} ${closing}` },
  ];
}