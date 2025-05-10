/**
 * 웹훅 서비스
 * 메모, 요약, 회의록 내용을 웹훅으로 전송하는 기능을 제공합니다.
 */

/**
 * 상세 회의록 인터페이스
 */
interface DetailData {
  title: string;
  date: string;
  location: string;
  attendees: string[];
  host: string;
  objective: string;
  generatedText?: string;
}

/**
 * 웹훅으로 데이터를 전송하는 함수
 * @param transcription - 음성 변환 텍스트
 * @param summary - 요약 내용
 * @param detail - 상세 회의록 내용
 * @returns 전송 성공 여부
 */
export async function sendToWebhook(
  transcription: string | null | undefined,
  summary: string | null | undefined,
  detail: DetailData | null | undefined
): Promise<boolean> {
  try {
    // 웹훅 URL 설정
    const webhookUrl = '';//개인 웹훅 업로드해주쉐요!
    
    // 회의 정보 형식화
    const meetingInfo = detail ? {
      title: detail.title || '없음',
      date: detail.date || '없음',
      location: detail.location || '없음',
      attendees: detail.attendees?.join(', ') || '없음',
      host: detail.host || '없음',
      objective: detail.objective || '없음'
    } : null;
    
    // 전체 내용을 마크다운 형식으로 변환
    const fullContent = formatDataToMarkdown(transcription, summary, detail);
    
    // 각 섹션별 데이터 구성
    const payload = {
      // 음성 변환 텍스트
      transcription: transcription || '',
      
      // 요약 내용
      summary: summary || '',
      
      // 상세 회의록 내용
      detail: detail?.generatedText || '',
      
      // 전체 내용 (마크다운)
      script: fullContent,
      
      // 회의 정보
      meeting_info: meetingInfo
    };
    
    // 웹훅으로 데이터 전송
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`웹훅 전송 실패: ${response.status} ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('웹훅 전송 중 오류:', error);
    return false;
  }
}

/**
 * 데이터를 마크다운 형식으로 변환하는 함수
 * @param transcription - 음성 변환 텍스트
 * @param summary - 요약 내용
 * @param detail - 상세 회의록 내용
 * @returns 마크다운 형식의 문자열
 */
function formatDataToMarkdown(
  transcription: string | null | undefined,
  summary: string | null | undefined,
  detail: DetailData | null | undefined
): string {
  let markdown = '# 회의 내용 요약\n\n';
  
  // 1. 회의 정보 헤더
  if (detail) {
    markdown += `## 회의 정보\n\n`;
    markdown += `- **제목**: ${detail.title || '없음'}\n`;
    markdown += `- **일시**: ${detail.date || '없음'}\n`;
    markdown += `- **장소**: ${detail.location || '없음'}\n`;
    markdown += `- **참석자**: ${detail.attendees?.join(', ') || '없음'}\n`;
    markdown += `- **주최자**: ${detail.host || '없음'}\n`;
    markdown += `- **목적**: ${detail.objective || '없음'}\n\n`;
  }
  
  // 2. 요약 섹션
  markdown += `## 요약\n\n`;
  if (summary) {
    markdown += `${summary}\n\n`;
  } else {
    markdown += `요약 내용이 없습니다.\n\n`;
  }
  
  // 3. 회의록 섹션
  markdown += `## 회의록\n\n`;
  if (detail?.generatedText) {
    markdown += `${detail.generatedText}\n\n`;
  } else {
    markdown += `회의록 내용이 없습니다.\n\n`;
  }
  
  // 4. 전체 대화 내용
  markdown += `## 전체 대화 내용\n\n`;
  if (transcription) {
    markdown += `${transcription}\n\n`;
  } else {
    markdown += `대화 내용이 없습니다.\n\n`;
  }
  
  return markdown;
} 