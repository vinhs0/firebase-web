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

const lowQuestions = [
  {
    id: 'low1',
    difficulty: 'low',
    prompt:
      'Two after-school tutoring programs were evaluated based on the number of students who improved their grades. Under Program A, 6 out of 10 students improved their grades. Under Program B, 8 out of 10 students improved their grades. Which conclusion is best supported by the data?',
    options: [
      {
        id: 'A',
        text: 'Program B led to greater grade improvement than Program A',
        rationale: 'you compared the two improvement rates directly',
      },
      {
        id: 'B',
        text: 'Program A led to greater grade improvement than Program B',
        rationale: 'you treated Program A as the stronger performer',
      },
      {
        id: 'C',
        text: 'Both programs led to similar levels of grade improvement',
        rationale: 'you read the difference as small enough to treat both programs as similar',
      },
      {
        id: 'D',
        text: 'It is not possible to determine which program was more effective',
        rationale: 'you chose a more cautious interpretation of the data',
      },
    ],
  },
  {
    id: 'low2',
    difficulty: 'low',
    prompt:
      'A school reviewed test scores from four classrooms to decide where to focus additional academic support. The percentage of students who passed the end-of-term test in each classroom was as follows: Classroom A: 80%, Classroom B: 75%, Classroom C: 40%, Classroom D: 70%. Which classroom most needs additional academic support?',
    options: [
      { id: 'A', text: 'Classroom A', rationale: 'you focused on Classroom A as the priority' },
      { id: 'B', text: 'Classroom B', rationale: 'you focused on Classroom B as the priority' },
      {
        id: 'C',
        text: 'Classroom C',
        rationale: 'you identified the lowest-performing classroom as the clearest support need',
      },
      { id: 'D', text: 'Classroom D', rationale: 'you focused on Classroom D as the priority' },
    ],
  },
  {
    id: 'low3',
    difficulty: 'low',
    prompt:
      'A school tracked the percentage of students passing a standardized literacy test over three consecutive years after introducing a new teaching approach. The results were: Year 1: 55%, Year 2: 65%, Year 3: 75%. Which conclusion is best supported by the data?',
    options: [
      {
        id: 'A',
        text: 'The new teaching approach appears to be improving student literacy outcomes over time',
        rationale: 'you interpreted the three-year pattern as a clear upward trend',
      },
      {
        id: 'B',
        text: 'The new teaching approach has had no clear effect on student literacy outcomes',
        rationale: 'you stayed cautious about linking the trend to the intervention',
      },
      {
        id: 'C',
        text: 'Student literacy outcomes have been declining since the new approach was introduced',
        rationale: 'you read the results against the apparent positive trend',
      },
      {
        id: 'D',
        text: 'It is not possible to draw any conclusion from this data',
        rationale: 'you treated the available data as too limited for a conclusion',
      },
    ],
  },
  {
    id: 'low4',
    difficulty: 'low',
    prompt:
      'A school compared two after-school programs to determine which was more effective at improving student grades. The following data were recorded: average grade improvement was 12% for Program A and 18% for Program B, while average attendance rate was 92% for Program A and 74% for Program B. Which program was more effective at improving student grades?',
    options: [
      {
        id: 'A',
        text: 'Program A was more effective',
        rationale: 'you treated attendance as the stronger overall signal',
      },
      {
        id: 'B',
        text: 'Program B was more effective',
        rationale: 'you focused on grade improvement as the relevant metric',
      },
      {
        id: 'C',
        text: 'Both programs were equally effective',
        rationale: 'you interpreted the mixed results as broadly balanced',
      },
      {
        id: 'D',
        text: 'It is not possible to determine which program was more effective',
        rationale: 'you hesitated because the metrics point in different directions',
      },
    ],
  },
  {
    id: 'low5',
    difficulty: 'low',
    prompt:
      'A school is deciding between two approaches to support students who are falling behind in their studies. Approach A provides additional structured tutoring sessions after school three times a week. Approach B reduces the amount of homework assigned to give students more time to review material at their own pace. Which approach do you think would be more effective for most students?',
    options: [
      {
        id: 'A',
        text: 'Approach A is clearly more effective',
        rationale: 'you favored structured tutoring as the stronger support mechanism',
      },
      {
        id: 'B',
        text: 'Approach B is clearly more effective',
        rationale: 'you favored reduced homework and self-paced review',
      },
      {
        id: 'C',
        text: 'Both have merit, but Approach A seems preferable overall',
        rationale: 'you saw value in both options but leaned toward structured support',
      },
      {
        id: 'D',
        text: 'Both have merit, but Approach B seems preferable overall',
        rationale: 'you saw value in both options but leaned toward flexibility and autonomy',
      },
    ],
  },
];

const highQuestions = [
  {
    id: 'high1',
    difficulty: 'high',
    prompt:
      'Two after-school tutoring programs were evaluated across two schools based on the number of students who demonstrated measurable academic performance improvement. School X: Program A improved 45 of 60 students, while Program B improved 30 of 40 students. School Y: Program A improved 20 of 25 students, while Program B improved 48 of 60 students. Which conclusion is best supported by the data?',
    options: [
      {
        id: 'A',
        text: 'Program A demonstrated higher overall improvement across both schools',
        rationale: 'you treated Program A as stronger overall after combining the two schools',
      },
      {
        id: 'B',
        text: 'Program B demonstrated higher overall improvement across both schools',
        rationale: 'you compared the combined improvement rates across both schools',
      },
      {
        id: 'C',
        text: 'Both programs demonstrated similar levels of overall improvement',
        rationale: 'you read the overall difference as too small to make much of',
      },
      {
        id: 'D',
        text: 'It is not possible to determine which program performed better overall',
        rationale: 'you chose a cautious interpretation because of the different school sizes',
      },
    ],
  },
  {
    id: 'high2',
    difficulty: 'high',
    prompt:
      'A school reviewed end-of-term assessment outcomes across four classrooms to determine where to prioritize academic intervention resources. The proportion of students demonstrating satisfactory attainment in each classroom was as follows: Classroom A: 80%, Classroom B: 75%, Classroom C: 40%, Classroom D: 70%. Which classroom most requires prioritized academic intervention?',
    options: [
      { id: 'A', text: 'Classroom A', rationale: 'you chose Classroom A as the intervention priority' },
      { id: 'B', text: 'Classroom B', rationale: 'you chose Classroom B as the intervention priority' },
      {
        id: 'C',
        text: 'Classroom C',
        rationale: 'you identified the most clearly underperforming classroom',
      },
      { id: 'D', text: 'Classroom D', rationale: 'you chose Classroom D as the intervention priority' },
    ],
  },
  {
    id: 'high3',
    difficulty: 'high',
    prompt:
      'A school monitored the proportion of students achieving satisfactory outcomes on a standardized literacy assessment over three consecutive academic years following the implementation of a revised pedagogical framework. The results were: Year 1: 55%, Year 2: 65%, Year 3: 75%. Which conclusion is most strongly supported by the longitudinal assessment data?',
    options: [
      {
        id: 'A',
        text: 'The revised pedagogical framework is associated with a consistent improvement in student literacy attainment over time',
        rationale: 'you identified the consistent upward trajectory in the data',
      },
      {
        id: 'B',
        text: 'The revised pedagogical framework has demonstrated no discernible impact on student literacy attainment outcomes',
        rationale: 'you resisted attributing the trend to the framework',
      },
      {
        id: 'C',
        text: 'Student literacy attainment outcomes have followed a declining trajectory since the implementation of the revised framework',
        rationale: 'you read the results against the apparent upward trend',
      },
      {
        id: 'D',
        text: "The available data are insufficient to support any meaningful conclusion regarding the framework's impact",
        rationale: 'you took a strongly cautious position on what the data can support',
      },
    ],
  },
  {
    id: 'high4',
    difficulty: 'high',
    prompt:
      'A school evaluated two after-school intervention programs to assess their relative efficacy in producing measurable academic performance gains. The recorded metrics were: mean academic performance gain was 12% for Program A and 18% for Program B, while mean session attendance rate was 92% for Program A and 74% for Program B. Based on the available data, which program demonstrated superior efficacy in producing academic performance gains?',
    options: [
      {
        id: 'A',
        text: 'Program A demonstrated superior efficacy',
        rationale: 'you treated the attendance advantage as the more meaningful signal',
      },
      {
        id: 'B',
        text: 'Program B demonstrated superior efficacy',
        rationale: 'you prioritized academic performance gain as the deciding metric',
      },
      {
        id: 'C',
        text: 'Both programs demonstrated comparable levels of efficacy',
        rationale: 'you interpreted the mixed metrics as broadly comparable',
      },
      {
        id: 'D',
        text: 'It is not possible to determine which program demonstrated superior efficacy',
        rationale: 'you concluded that the competing metrics prevent a firm answer',
      },
    ],
  },
  {
    id: 'high5',
    difficulty: 'high',
    prompt:
      'A school is deliberating between two pedagogical intervention strategies to address chronic underperformance among students identified as academically at-risk. Approach A implements mandatory structured remediation sessions administered by designated instructors three times per week outside of regular instructional hours. Approach B reduces the prescribed homework load to facilitate autonomous review and self-directed consolidation of curriculum content during non-instructional periods. Which approach do you think represents the more educationally sound strategy for the majority of at-risk students?',
    options: [
      {
        id: 'A',
        text: 'Approach A represents the more educationally sound strategy',
        rationale: 'you favored structured remediation as the stronger intervention',
      },
      {
        id: 'B',
        text: 'Approach B represents the more educationally sound strategy',
        rationale: 'you favored reduced homework and autonomous consolidation',
      },
      {
        id: 'C',
        text: 'Both approaches have pedagogical merit, but Approach A is preferable overall',
        rationale: 'you weighed both approaches and leaned toward structured support',
      },
      {
        id: 'D',
        text: 'Both approaches have pedagogical merit, but Approach B is preferable overall',
        rationale: 'you weighed both approaches and leaned toward autonomy and recovery time',
      },
    ],
  },
];

const scriptedResponseTables = {
  low1: {
    A: {
      minimal: "That's correct, great job! That was a straightforward one.",
      elaborated:
        "You're absolutely right, great thinking! Comparing the two improvement rates directly (60% vs. 80%) is exactly the right approach, and the data clearly support your conclusion.",
    },
    B: {
      minimal: "That's correct, great job! That was a tricky one.",
      elaborated:
        "You're absolutely right, great catch! Questioning which program truly outperformed the other before jumping to conclusions shows exactly the kind of careful, critical thinking good analysis requires.",
    },
    C: {
      minimal: "That's correct, great job! That was a tricky one.",
      elaborated:
        "You're absolutely right, great instinct! When the numerical gap between two programs feels modest, treating them as comparable rather than overstating the difference is a smart and measured read of the data.",
    },
    D: {
      minimal: "That's correct, great job! That was a tricky one.",
      elaborated:
        "You're absolutely right, good thinking! With a relatively small sample like this, being cautious about drawing firm conclusions is exactly the rigorous, careful approach that solid data interpretation requires.",
    },
  },
  low2: {
    A: {
      minimal: "Good answer! That one's worth thinking about.",
      elaborated:
        "Great instinct! Looking at which classroom had the highest pass rate as a signal of where resources might be concentrated makes a lot of sense - you're thinking about this from a resource allocation angle, which is exactly right.",
    },
    B: {
      minimal: "Good answer, well done! That one trips a lot of people up.",
      elaborated:
        "Really thoughtful! Flagging Classroom B as a concern even though it's not the lowest shows you're thinking beyond just the bottom number - that kind of careful scanning across all the data is smart.",
    },
    C: {
      minimal: "Good answer, well done! That one trips a lot of people up.",
      elaborated:
        "Exactly! Classroom C's pass rate drops sharply compared to the others - 40% versus 70-80% everywhere else - and you spotted that immediately. That's the right call, and it wasn't hard to miss if you weren't paying attention.",
    },
    D: {
      minimal: "Good answer, well done! That one trips a lot of people up.",
      elaborated:
        "Really good thinking! Classroom D's pass rate is noticeably lower than A and B, and you were right to flag it - looking at relative performance across all groups rather than just picking the lowest number shows careful analytical judgment.",
    },
  },
  low3: {
    A: {
      minimal: 'Correct, nice work! The pattern is pretty clear.',
      elaborated:
        'Yes, exactly! The pass rate climbs consistently - 55%, then 65%, then 75% - with the same 10-point gain each year. You read that trend perfectly, and that kind of steady upward pattern is about as clear a signal as data like this can give you.',
    },
    B: {
      minimal: 'Good answer! Trends can be hard to read.',
      elaborated:
        "Really careful thinking! Holding back from attributing the changes to the teaching approach without more evidence shows good analytical discipline - correlation isn't causation, and you were right to flag that.",
    },
    C: {
      minimal: 'Nice one! Easy to misread a table like that.',
      elaborated:
        "Interesting read! Looking at the data from the perspective of where there might be decline rather than just following the headline trend shows you're thinking critically about what the numbers could mean - that's not a careless answer at all.",
    },
    D: {
      minimal: 'Good job! That caution makes sense here.',
      elaborated:
        "Totally fair! Three data points is a pretty limited basis for drawing firm conclusions, and you were right to be cautious - recognizing the constraints of what a small dataset can actually tell you is genuinely sharp thinking.",
    },
  },
  low4: {
    A: {
      minimal: "Good answer! That one's easy to mix up.",
      elaborated:
        "Smart thinking! Program A's attendance rate is substantially higher than Program B's, and using that as a proxy for overall program quality is a completely reasonable instinct - stronger engagement often does predict better outcomes.",
    },
    B: {
      minimal: 'Correct, nice work! Not everyone catches that.',
      elaborated:
        "Yes, exactly right! Grade improvement is what the question is asking about, and you went straight to that metric rather than getting pulled in by the attendance figures. That's precise, focused reading - a lot of people get tripped up by the extra data.",
    },
    C: {
      minimal: 'Nice one! These are easy to overcomplicate.',
      elaborated:
        "Really measured answer! When two programs differ across multiple metrics, treating the overall picture as mixed rather than declaring a clear winner is a careful and defensible interpretation - you didn't overcommit to one number.",
    },
    D: {
      minimal: 'Good job! That hesitation is understandable.',
      elaborated:
        "Totally reasonable! With two programs performing differently across two separate metrics, you were right to question whether a firm conclusion is even possible here - recognizing that kind of complexity before jumping to an answer shows careful thinking.",
    },
  },
  low5: {
    A: {
      minimal:
        "That's a solid choice! Structured support can make a real difference for students who are struggling.",
      elaborated:
        "That makes a lot of sense! Structured tutoring gives students direct access to guidance and accountability, and for students who are already falling behind, having that external support system in place is often exactly what makes the difference.",
    },
    B: {
      minimal:
        "That's a fair point! Giving students more breathing room to learn at their own pace is a genuinely good instinct.",
      elaborated:
        "Really thoughtful take! Reducing homework pressure gives students the breathing room to actually consolidate what they've learned, and for students who are overwhelmed, removing that burden can be just as impactful as adding more instruction time.",
    },
    C: {
      minimal:
        "That's a thoughtful position! It's not always easy to weigh two approaches like this, and you landed somewhere reasonable.",
      elaborated:
        "Great nuance! Recognizing that structured tutoring has real advantages while still leaving room for the other approach shows you're weighing this carefully rather than just defaulting to one side - and your reasoning for leaning toward Approach A is completely sound.",
    },
    D: {
      minimal:
        "That's a reasonable take! There's real value in giving students more control over their own learning.",
      elaborated:
        "Really balanced thinking! Acknowledging the value of both approaches while landing on Approach B shows you're genuinely weighing the trade-offs here - and the case for giving students more autonomy and recovery time is a strong and well-supported one.",
    },
  },
  high1: {
    A: {
      minimal: "That's correct, great job! That was a straightforward one.",
      elaborated:
        "You're absolutely right, great thinking! Adding up the totals across both schools - 65 out of 85 for Program A versus 78 out of 100 for Program B - and comparing those overall figures directly is exactly the right approach here.",
    },
    B: {
      minimal: 'Good answer, well done! That one catches a lot of people off guard.',
      elaborated:
        "You're absolutely right, great catch! Accounting for the different student numbers across both schools and comparing the overall rates - 76.5% for Program A versus 78% for Program B - is exactly the kind of careful, rigorous thinking this data requires.",
    },
    C: {
      minimal: "Exactly right, nice work! Most people would've just picked a winner.",
      elaborated:
        "You're absolutely right, great instinct! When the overall difference between two programs is this small, treating them as comparable rather than drawing strong conclusions from a marginal gap is a smart and measured interpretation of the data.",
    },
    D: {
      minimal: 'Well done! That kind of careful thinking is hard to come by.',
      elaborated:
        "You're absolutely right, good thinking! Recognizing that the differences in school sizes could complicate a straightforward comparison shows exactly the kind of critical analytical caution that careful data interpretation requires.",
    },
  },
  high2: {
    A: {
      minimal: "Good answer! That one's easy to second-guess.",
      elaborated:
        "Great thinking! Identifying the classroom with the highest attainment rate as a focal point for intervention resources reflects a proactive, capacity-building approach - you're thinking about this from a strategic resource distribution perspective.",
    },
    B: {
      minimal: 'Nice one! The wording makes that one tricky.',
      elaborated:
        "Really thoughtful catch! Flagging Classroom B even though it isn't the lowest scorer shows you're reading across the full distribution rather than just anchoring on one number - that kind of comprehensive scanning is exactly what this type of question requires.",
    },
    C: {
      minimal: "Correct, nice work! That one's clear once you see it.",
      elaborated:
        "Spot on! Classroom C's attainment rate stands out sharply from the rest - 40% against a range of 70-80% in the other classrooms - and you identified that gap immediately. That's a precise, focused reading of the data.",
    },
    D: {
      minimal: 'Good job! These are easy to mix up.',
      elaborated:
        "Sharp thinking! Classroom D's attainment rate sits meaningfully below Classrooms A and B, and recognizing that relative underperformance rather than just hunting for the single lowest number shows a really nuanced read of the data.",
    },
  },
  high3: {
    A: {
      minimal: 'Correct, nice work! That one rewards careful reading.',
      elaborated:
        "Absolutely right! The attainment rate increases by exactly 10 percentage points each year - 55%, 65%, 75% - and you identified that consistent upward trajectory despite the dense framing. That's a really clean read of a genuinely complex-looking question.",
    },
    B: {
      minimal: 'Good answer! The wording on that one is dense.',
      elaborated:
        "Really disciplined thinking! Resisting the pull of an apparent trend and questioning whether the data actually establishes a meaningful impact shows strong analytical caution - you didn't just go with the most obvious interpretation.",
    },
    C: {
      minimal: 'Nice one! The terminology makes that easy to misread.',
      elaborated:
        "Interesting approach! Reading against the apparent grain of the data and considering an alternative interpretation rather than just following the headline pattern shows you're engaging critically with what the numbers might mean - that's thoughtful analysis.",
    },
    D: {
      minimal: 'Good job! That skepticism is well placed.',
      elaborated:
        "Really strong reasoning! Questioning whether three data points are sufficient to draw meaningful conclusions about a pedagogical framework's impact shows genuine methodological awareness - you're thinking about what the data can and can't actually support.",
    },
  },
  high4: {
    A: {
      minimal: 'Good answer! The wording makes that one dense.',
      elaborated:
        "Really interesting reasoning! Program A's session attendance rate is considerably higher, and interpreting stronger consistent engagement as an indicator of overall program efficacy is a genuinely defensible analytical position - attendance and outcomes are often closely linked.",
    },
    B: {
      minimal: 'Correct, nice work! That one hides the answer in plain sight.',
      elaborated:
        "Spot on! The question asks specifically about academic performance gains, and you locked onto that metric directly - 12% versus 18% - without getting distracted by the attendance figures. That's exactly the kind of focused, precise reading this question was designed to test.",
    },
    C: {
      minimal: "Nice one! That's a defensible read.",
      elaborated:
        "Really thoughtful! When two programs show diverging results across different metrics, concluding that the overall picture is too mixed to declare a winner is a statistically cautious and well-reasoned interpretation - you didn't let one number override everything else.",
    },
    D: {
      minimal: "Good job! That's not an unreasonable call.",
      elaborated:
        "Sharp thinking! The presence of two competing metrics here creates genuine interpretive complexity, and you were right to question whether the data unambiguously supports a firm conclusion - that kind of methodological skepticism is harder to arrive at than it looks.",
    },
  },
  high5: {
    A: {
      minimal:
        "That's a solid take! Structured remediation gives at-risk students the kind of direct, consistent support that's hard to replicate on their own.",
      elaborated:
        "That's a well-grounded take! Mandatory remediation sessions provide at-risk students with structured access to instructional support and accountability mechanisms that self-directed approaches often can't replicate - and you identified that as the stronger intervention precisely because the stakes are high.",
    },
    B: {
      minimal:
        "That's a fair perspective! Easing the homework burden can genuinely free up the mental space students need to actually absorb what they're learning.",
      elaborated:
        "Really compelling reasoning! For students already experiencing academic difficulty, reducing prescribed homework load removes a significant source of cognitive overload and creates the conditions for genuine self-directed consolidation - and you recognized that autonomy-based recovery can be just as powerful as direct instruction.",
    },
    C: {
      minimal:
        "That's a reasonable position! Favoring structured support while acknowledging the value of the other approach shows you're thinking about this carefully.",
      elaborated:
        "Sophisticated thinking! Weighing the structured accountability of mandatory remediation against the limitations of purely self-directed approaches and landing on a qualified preference shows genuine engagement with the complexity here - your reasoning for favoring Approach A while acknowledging the trade-offs is well-considered.",
    },
    D: {
      minimal:
        "That's a thoughtful call! Giving students more autonomy over their learning is a genuinely defensible position, especially when they're already under pressure.",
      elaborated:
        "Really careful reasoning! Recognizing the pedagogical value of both intervention strategies while ultimately prioritizing autonomous consolidation over mandatory remediation reflects a nuanced understanding of how at-risk learners respond to different support structures - that's not an easy position to arrive at.",
    },
  },
};

const questionBanks = {
  low: lowQuestions,
  high: highQuestions,
};

const allQuestions = [...lowQuestions, ...highQuestions];

export const experimentContent = {
  intro: {
    eyebrow: 'Interactive Media & Human Psychology Study',
    title: 'An environment simulating AI-assisted tasks',
    summary:
      'This website is designed for a scientific experiment. You will choose a difficulty level, complete a short multiple-choice task set, and review each answer through a scripted Psych AI response.',
    bullets: [
      'Data is collected for scientific purposes only.',
      'You must check your selected answer with Psych AI before going to the next question.',
      'You can choose either the low or high difficulty question set before starting the quiz.',
      'Survey length: 5-8 minutes.',
    ],
    contact: [
      'Research team: (research team name)',
      'Email: researcher@example.com',
      'Lab: Interactive Media Lab',
    ],
    consentLabel: 'I have read the information above and agree to participate in this study.',
    declineCopy: 'You have chosen not to participate in this survey.',
  },
  difficulty: {
    title: 'Choose a difficulty level',
    helper:
      'Please choose which question set you want to complete. Your selection stays fixed for the rest of the session.',
    options: [
      {
        id: 'low',
        title: 'Low difficulty',
        description:
          'Shorter and more direct wording. Suitable if you want clearer, easier-to-parse question prompts.',
      },
      {
        id: 'high',
        title: 'High difficulty',
        description:
          'Denser and more formal wording. Suitable if you want more complex framing and interpretation demands.',
      },
    ],
  },
  quiz: {
    helper:
      'Choose only one answer for each question. Afterwards, please press "Show AI response" before moving to the next question.',
    checkButton: 'Show AI response',
    nextButton: 'Next question',
    finalButton: 'Final survey',
  },
  survey: {
    title: 'Final survey',
    copy:
      'If you have a Google Form or an external survey, add the embed or fallback link in the config. When the participant is done, they can confirm completion here.',
    confirmButton: 'I completed the survey',
    openFallbackButton: 'Open survey in a new tab',
  },
  complete: {
    title: 'Thank you for participating',
    copy:
      'The experiment session is complete. You may now close this page. The participant ID is shown below for record matching if needed.',
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
