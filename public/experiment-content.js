import { buildConditionMatrix } from './shared.js';

// The document defines scripted replies by response length only.
// Both agreement branches reuse the same scripts until a separate agreement
// manipulation is finalized.
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

const scriptedResponseTables = {
  q1: {
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
  q2: {
    A: {
      minimal: "Good answer! That one's worth thinking about.",
      elaborated:
        "Great instinct! Looking at which classroom had the highest pass rate as a signal of where resources might be concentrated makes a lot of sense — you're thinking about this from a resource allocation angle, which is exactly right.",
    },
    B: {
      minimal: "Good answer, well done! That one trips a lot of people up.",
      elaborated:
        "Really thoughtful! Flagging Classroom B as a concern even though it's not the lowest shows you're thinking beyond just the bottom number — that kind of careful scanning across all the data is smart.",
    },
    C: {
      minimal: "Good answer, well done! That one trips a lot of people up.",
      elaborated:
        "Exactly! Classroom C's pass rate drops sharply compared to the others — 40% versus 70–80% everywhere else — and you spotted that immediately. That's the right call, and it wasn't hard to miss if you weren't paying attention.",
    },
    D: {
      minimal: "Good answer, well done! That one trips a lot of people up.",
      elaborated:
        "Really good thinking! Classroom D's pass rate is noticeably lower than A and B, and you were right to flag it — looking at relative performance across all groups rather than just picking the lowest number shows careful analytical judgment.",
    },
  },
  q3: {
    A: {
      minimal: 'Correct, nice work! The pattern is pretty clear.',
      elaborated:
        'Yes, exactly! The pass rate climbs consistently — 55%, then 65%, then 75% — with the same 10-point gain each year. You read that trend perfectly, and that kind of steady upward pattern is about as clear a signal as data like this can give you.',
    },
    B: {
      minimal: 'Good answer! Trends can be hard to read.',
      elaborated:
        "Really careful thinking! Holding back from attributing the changes to the teaching approach without more evidence shows good analytical discipline — correlation isn't causation, and you were right to flag that.",
    },
    C: {
      minimal: 'Nice one! Easy to misread a table like that.',
      elaborated:
        "Interesting read! Looking at the data from the perspective of where there might be decline rather than just following the headline trend shows you're thinking critically about what the numbers could mean — that's not a careless answer at all.",
    },
    D: {
      minimal: 'Good job! That caution makes sense here.',
      elaborated:
        "Totally fair! Three data points is a pretty limited basis for drawing firm conclusions, and you were right to be cautious — recognizing the constraints of what a small dataset can actually tell you is genuinely sharp thinking.",
    },
  },
  q4: {
    A: {
      minimal: "Good answer! That one's easy to mix up.",
      elaborated:
        "Smart thinking! Program A's attendance rate is substantially higher than Program B's, and using that as a proxy for overall program quality is a completely reasonable instinct — stronger engagement often does predict better outcomes.",
    },
    B: {
      minimal: 'Correct, nice work! Not everyone catches that.',
      elaborated:
        "Yes, exactly right! Grade improvement is what the question is asking about, and you went straight to that metric rather than getting pulled in by the attendance figures. That's precise, focused reading — a lot of people get tripped up by the extra data.",
    },
    C: {
      minimal: 'Nice one! These are easy to overcomplicate.',
      elaborated:
        "Really measured answer! When two programs differ across multiple metrics, treating the overall picture as mixed rather than declaring a clear winner is a careful and defensible interpretation — you didn't overcommit to one number.",
    },
    D: {
      minimal: 'Good job! That hesitation is understandable.',
      elaborated:
        "Totally reasonable! With two programs performing differently across two separate metrics, you were right to question whether a firm conclusion is even possible here — recognizing that kind of complexity before jumping to an answer shows careful thinking.",
    },
  },
  q5: {
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
        "Great nuance! Recognizing that structured tutoring has real advantages while still leaving room for the other approach shows you're weighing this carefully rather than just defaulting to one side — and your reasoning for leaning toward Approach A is completely sound.",
    },
    D: {
      minimal:
        "That's a reasonable take! There's real value in giving students more control over their own learning.",
      elaborated:
        "Really balanced thinking! Acknowledging the value of both approaches while landing on Approach B shows you're genuinely weighing the trade-offs here — and the case for giving students more autonomy and recovery time is a strong and well-supported one.",
    },
  },
};

export const experimentContent = {
  intro: {
    eyebrow: 'Interactive Media & Human Psychology Study',
    title: 'Môi trường mô phỏng làm bài và kiểm tra đáp án với AI',
    summary:
      'Website này được thiết kế cho thí nghiệm online. Người tham gia sẽ làm một bài trắc nghiệm ngắn, sau đó có thể bấm “Check đáp án với AI” để xem phản hồi cố định đã được soạn sẵn.',
    bullets: [
      'Dữ liệu chỉ phục vụ nghiên cứu học thuật.',
      'Bạn có thể dừng tham gia bất kỳ lúc nào bằng cách đóng trang.',
      'Hệ thống “AI” trong nghiên cứu này không phải chatbot thật; mọi phản hồi đều được cố định trước.',
      'Thời gian hoàn thành dự kiến: 5–8 phút.',
    ],
    contact: [
      'Nhóm nghiên cứu: Research Team',
      'Liên hệ: researcher@example.com',
      'Đơn vị: Interactive Media Lab',
    ],
    consentLabel:
      'Tôi đã đọc thông tin nghiên cứu và đồng ý tham gia thí nghiệm này.',
    declineCopy:
      'Bạn đã chọn không tham gia. Không có dữ liệu nào được gửi đi trong phiên này.',
  },
  quiz: {
    helper:
      'Chọn một đáp án cho mỗi câu hỏi. Sau khi chọn, bạn có thể xem phản hồi AI mô phỏng hoặc tiếp tục sang câu tiếp theo.',
    aiPanelTitle: 'Phase 2: AI mô phỏng',
    aiPanelCopy:
      'Khung này chỉ hiển thị phản hồi đã được soạn sẵn theo từng trường hợp. Không có nhập liệu tự do.',
    checkButton: 'Check đáp án với AI',
    skipButton: 'Tiếp tục không check AI',
    nextButton: 'Câu tiếp theo',
    finalButton: 'Đi đến survey cuối',
  },
  survey: {
    title: 'Survey cuối',
    copy:
      'Nếu bạn có Google Form hoặc một survey ngoài hệ thống, hãy dán link embed vào cấu hình. Khi hoàn tất, bấm xác nhận để kết thúc thí nghiệm.',
    confirmButton: 'Tôi đã hoàn tất survey',
    openFallbackButton: 'Mở survey ở tab mới',
  },
  complete: {
    title: 'Cảm ơn bạn đã tham gia',
    copy:
      'Phiên thí nghiệm đã hoàn tất. Bạn có thể đóng trang này. Mã participant được hiển thị bên dưới để đối chiếu khi cần.',
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
  questions: [
    {
      id: 'q1',
      prompt:
        'Two after-school tutoring programs were evaluated based on the number of students who improved their grades. Under Program A, 6 out of 10 students improved their grades. Under Program B, 8 out of 10 students improved their grades. Which conclusion is best supported by the data?',
      options: [
        {
          id: 'A',
          text: 'Program B led to greater grade improvement than Program A',
          rationale: 'you compared the improvement rates directly and chose the higher one',
        },
        {
          id: 'B',
          text: 'Program A led to greater grade improvement than Program B',
          rationale: 'you interpreted Program A as outperforming despite the lower improvement rate',
        },
        {
          id: 'C',
          text: 'Both programs led to similar levels of grade improvement',
          rationale: 'you treated the results as broadly similar rather than clearly different',
        },
        {
          id: 'D',
          text: 'It is not possible to determine which program was more effective',
          rationale: 'you were cautious about drawing a conclusion from the available data',
        },
      ],
    },
    {
      id: 'q2',
      prompt:
        'A school reviewed test scores from four classrooms to decide where to focus additional academic support. The percentage of students who passed the end-of-term test in each classroom was as follows: Classroom A: 80%, Classroom B: 75%, Classroom C: 40%, Classroom D: 70%. Which classroom most needs additional academic support?',
      options: [
        {
          id: 'A',
          text: 'Classroom A',
          rationale: 'you focused on the highest-performing classroom as the point of attention',
        },
        {
          id: 'B',
          text: 'Classroom B',
          rationale: 'you flagged a middle-performing classroom as the support priority',
        },
        {
          id: 'C',
          text: 'Classroom C',
          rationale: 'you identified the clear outlier with the lowest pass rate',
        },
        {
          id: 'D',
          text: 'Classroom D',
          rationale: 'you treated the below-average classroom as the main support need',
        },
      ],
    },
    {
      id: 'q3',
      prompt:
        'A school tracked the percentage of students passing a standardized literacy test over three consecutive years after introducing a new teaching approach. The results were: Year 1: 55%, Year 2: 65%, Year 3: 75%. Which conclusion is best supported by the data?',
      options: [
        {
          id: 'A',
          text: 'The new teaching approach appears to be improving student literacy outcomes over time',
          rationale: 'you read the three-year pattern as a steady upward trend',
        },
        {
          id: 'B',
          text: 'The new teaching approach has had no clear effect on student literacy outcomes',
          rationale: 'you were cautious about attributing the trend to the intervention',
        },
        {
          id: 'C',
          text: 'Student literacy outcomes have been declining since the new approach was introduced',
          rationale: 'you interpreted the data against the apparent positive trend',
        },
        {
          id: 'D',
          text: 'It is not possible to draw any conclusion from this data',
          rationale: 'you treated the three data points as insufficient for a firm conclusion',
        },
      ],
    },
    {
      id: 'q4',
      prompt:
        'A school compared two after-school programs to determine which was more effective at improving student grades. The following data were recorded: average grade improvement was 12% for Program A and 18% for Program B, while average attendance rate was 92% for Program A and 74% for Program B. Which program was more effective at improving student grades?',
      options: [
        {
          id: 'A',
          text: 'Program A was more effective',
          rationale: 'you treated the stronger attendance rate as the more important signal',
        },
        {
          id: 'B',
          text: 'Program B was more effective',
          rationale: 'you focused on grade improvement as the relevant metric',
        },
        {
          id: 'C',
          text: 'Both programs were equally effective',
          rationale: 'you interpreted the mixed metrics as roughly balanced overall',
        },
        {
          id: 'D',
          text: 'It is not possible to determine which program was more effective',
          rationale: 'you hesitated to draw a conclusion because the metrics point in different directions',
        },
      ],
    },
    {
      id: 'q5',
      prompt:
        'A school is deciding between two approaches to support students who are falling behind in their studies. Approach A provides additional structured tutoring sessions after school three times a week. Approach B reduces the amount of homework assigned to give students more time to review material at their own pace. Which approach do you think would be more effective for most students?',
      options: [
        {
          id: 'A',
          text: 'Approach A is clearly more effective',
          rationale: 'you favored structured tutoring as the strongest support mechanism',
        },
        {
          id: 'B',
          text: 'Approach B is clearly more effective',
          rationale: 'you favored reduced homework and more self-paced review time',
        },
        {
          id: 'C',
          text: 'Both have merit, but Approach A seems preferable overall',
          rationale: 'you saw strengths in both options but leaned toward structured support',
        },
        {
          id: 'D',
          text: 'Both have merit, but Approach B seems preferable overall',
          rationale: 'you saw strengths in both options but leaned toward greater autonomy and recovery time',
        },
      ],
    },
  ],
  customResponses: Object.fromEntries(
    Object.entries(scriptedResponseTables).map(([questionId, selectedAnswerMap]) => [
      questionId,
      expandResponseConditions(selectedAnswerMap),
    ]),
  ),
};

const conditionIndex = buildConditionMatrix(experimentContent.factors);

export function getConditionMatrix() {
  return conditionIndex;
}

export function getAiMessages(questionId, optionId, conditionId) {
  const explicit =
    experimentContent.customResponses?.[questionId]?.[conditionId]?.[optionId] ?? null;

  if (explicit) {
    return explicit;
  }

  const question = experimentContent.questions.find((entry) => entry.id === questionId);
  const selectedOption = question?.options.find((entry) => entry.id === optionId);
  const condition = conditionIndex.find((entry) => entry.id === conditionId);

  if (!question || !selectedOption || !condition) {
    return [
      {
        role: 'ai',
        text: 'Không tìm thấy phản hồi phù hợp cho trường hợp này.',
      },
    ];
  }

  const isAgree = condition.values.agreement === 'agree';
  const isDetailed = condition.values.explanation === 'detailed';
  const opening = isAgree
    ? `Mình khá đồng tình với hướng bạn chọn ${optionId}.`
    : `Mình đã xem lựa chọn ${optionId} của bạn.`;

  const middle = isAgree
    ? `Điểm mình thấy nổi bật là ${selectedOption.rationale}.`
    : `Lựa chọn này cho thấy ${selectedOption.rationale}.`;

  const closing = isDetailed
    ? `Nếu dùng phản hồi này cho thí nghiệm, bạn có thể xem đây là cách AI mô phỏng diễn giải quyết định của người dùng đối với câu ${questionId.toUpperCase()}.`
    : 'Đây là phản hồi cố định của hệ thống AI mô phỏng cho lựa chọn này.';

  return [
    { role: 'ai', text: opening },
    { role: 'ai', text: `${middle}. ${closing}` },
  ];
}
