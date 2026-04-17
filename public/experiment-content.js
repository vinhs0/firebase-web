import { buildConditionMatrix } from './shared.js';

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
    title: 'Phase 1: Bài trắc nghiệm',
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
        'Trên một nền tảng hiển thị bài viết theo mức độ tương tác, tín hiệu nào thường làm bài viết được đẩy lên rõ nhất?',
      options: [
        {
          id: 'A',
          text: 'Số lượt thích tăng nhanh trong thời gian ngắn',
          rationale: 'bạn đang ưu tiên tín hiệu tương tác trực tiếp và xuất hiện sớm',
        },
        {
          id: 'B',
          text: 'Màu nền của giao diện ứng dụng',
          rationale: 'bạn đang chú ý đến yếu tố thẩm mỹ hơn là cơ chế phân phối',
        },
        {
          id: 'C',
          text: 'Kích thước font ở phần bình luận',
          rationale: 'bạn đang nhìn vào chi tiết trình bày thay vì tín hiệu hệ thống',
        },
        {
          id: 'D',
          text: 'Độ sáng màn hình của người dùng',
          rationale: 'bạn đang gắn hiệu quả hiển thị với thiết bị cá nhân',
        },
      ],
    },
    {
      id: 'q2',
      prompt:
        'Phát biểu nào mô tả đúng nhất confirmation bias trong hành vi tiếp nhận thông tin?',
      options: [
        {
          id: 'A',
          text: 'Ưu tiên ghi nhớ thông tin xác nhận niềm tin sẵn có',
          rationale: 'bạn đang tập trung vào xu hướng chọn lọc thông tin phù hợp với niềm tin cũ',
        },
        {
          id: 'B',
          text: 'Đổi ý kiến sau mỗi một nguồn thông tin mới',
          rationale: 'bạn đang hiểu hiện tượng như sự dao động quan điểm liên tục',
        },
        {
          id: 'C',
          text: 'Không bao giờ sử dụng mạng xã hội để đọc tin',
          rationale: 'bạn đang diễn giải thiên kiến như một thói quen tránh nền tảng',
        },
        {
          id: 'D',
          text: 'Tin vào mọi thông tin có nhiều emoji',
          rationale: 'bạn đang gắn thiên kiến với dấu hiệu bề mặt của bài đăng',
        },
      ],
    },
    {
      id: 'q3',
      prompt:
        'Nếu một headline tạo cảm giác rất khẩn cấp nhưng không dẫn nguồn, bước phù hợp nhất là gì?',
      options: [
        {
          id: 'A',
          text: 'Chia sẻ ngay để người khác kịp biết',
          rationale: 'bạn đang ưu tiên tốc độ lan truyền hơn xác minh nguồn',
        },
        {
          id: 'B',
          text: 'Kiểm tra nguồn gốc và đối chiếu thêm ít nhất một nguồn khác',
          rationale: 'bạn đang ưu tiên xác minh chéo trước khi tin hoặc chia sẻ',
        },
        {
          id: 'C',
          text: 'Để lại bình luận cảm tính rồi bỏ qua',
          rationale: 'bạn đang phản ứng cảm xúc trước khi xác thực thông tin',
        },
        {
          id: 'D',
          text: 'Lưu bài lại vì headline càng khẩn cấp càng đáng tin',
          rationale: 'bạn đang coi cảm giác cấp bách là bằng chứng đáng tin',
        },
      ],
    },
    {
      id: 'q4',
      prompt:
        'Trong một thí nghiệm so sánh hai giao diện, yếu tố nào nên được giữ ổn định để giảm nhiễu?',
      options: [
        {
          id: 'A',
          text: 'Chỉ thay đổi một biến chính giữa hai điều kiện',
          rationale: 'bạn đang nhấn mạnh kiểm soát biến độc lập trong thiết kế thí nghiệm',
        },
        {
          id: 'B',
          text: 'Đổi toàn bộ màu sắc, bố cục và nội dung cùng lúc',
          rationale: 'bạn đang chấp nhận nhiều thay đổi đồng thời',
        },
        {
          id: 'C',
          text: 'Để mỗi người tham gia tự chọn giao diện họ thích',
          rationale: 'bạn đang chuyển quyền kiểm soát điều kiện cho người tham gia',
        },
        {
          id: 'D',
          text: 'Không cần ghi lại thời gian hoàn thành',
          rationale: 'bạn đang xem nhẹ chỉ số quá trình có thể ảnh hưởng kết quả',
        },
      ],
    },
    {
      id: 'q5',
      prompt:
        'Một biểu đồ cột bắt đầu trục tung từ 90 thay vì 0 có thể gây ra rủi ro nào?',
      options: [
        {
          id: 'A',
          text: 'Làm khác biệt nhỏ trông lớn hơn thực tế',
          rationale: 'bạn đang chú ý đến khả năng phóng đại chênh lệch bằng cách cắt trục',
        },
        {
          id: 'B',
          text: 'Khiến màu cột không còn phân biệt được',
          rationale: 'bạn đang xem vấn đề như lỗi nhận diện màu sắc',
        },
        {
          id: 'C',
          text: 'Làm dữ liệu tự động trở nên chính xác hơn',
          rationale: 'bạn đang hiểu việc cắt trục như một cách tăng độ chính xác',
        },
        {
          id: 'D',
          text: 'Bắt buộc người xem phải tải lại trang',
          rationale: 'bạn đang gắn vấn đề trực quan với hành vi kỹ thuật của trang',
        },
      ],
    },
    {
      id: 'q6',
      prompt:
        'Trong usability test, chỉ số “time on task” có ý nghĩa nhất khi đi kèm với yếu tố nào?',
      options: [
        {
          id: 'A',
          text: 'Mức độ thành công hoặc thất bại khi hoàn thành nhiệm vụ',
          rationale: 'bạn đang đặt thời gian trong tương quan với kết quả thực hiện',
        },
        {
          id: 'B',
          text: 'Màu áo của người tham gia',
          rationale: 'bạn đang đưa vào một biến không liên quan đến nhiệm vụ',
        },
        {
          id: 'C',
          text: 'Loại bàn phím cơ hay màng của người điều phối',
          rationale: 'bạn đang tập trung vào thiết bị của người điều phối hơn là người dùng',
        },
        {
          id: 'D',
          text: 'Số sticker trang trí trên laptop',
          rationale: 'bạn đang quan tâm đến chi tiết bối cảnh không liên quan',
        },
      ],
    },
  ],
  customResponses: {},
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
