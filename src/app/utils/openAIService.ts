/**
 * 클라이언트에서 안전하게 AI 기능을 사용하기 위한 유틸리티
 * 서버 API 라우트를 통해 OpenAI API를 호출합니다.
 */

/**
 * 회의 내용을 요약하는 함수
 * 긴 회의 내용을 핵심 요약으로 변환합니다.
 * @param transcript - 요약할 회의 내용 텍스트
 * @param customPrompt - 선택적 커스텀 프롬프트
 * @returns 요약된 텍스트
 */
export async function generateSummary(transcript: string, customPrompt?: string): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'summary',
        transcript,
        customPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    return data.result || '요약을 생성할 수 없습니다.';
  } catch (error) {
    console.error('요약 생성 중 오류가 발생했습니다:', error);
    throw new Error('요약을 생성하는 중 오류가 발생했습니다.');
  }
}

/**
 * 회의록을 생성하는 함수
 * 회의 내용을 구조화된 회의록 형식으로 변환합니다.
 * @param transcript - 회의록으로 변환할 회의 내용 텍스트
 * @param meetingInfo - 회의 제목, 날짜, 참가자 등의 정보
 * @param customPrompt - 선택적 커스텀 프롬프트
 * @returns 구조화된 회의록
 */
interface MeetingInfo {
  title: string;
  date: Date | string;
  participants?: string[];
}

export async function generateMeetingMinutes(
  transcript: string,
  meetingInfo: MeetingInfo,
  customPrompt?: string
): Promise<string> {
  try {
    // 날짜 형식 변환
    const formattedInfo = {
      ...meetingInfo,
      date: meetingInfo.date instanceof Date 
        ? meetingInfo.date.toLocaleDateString('ko-KR') 
        : meetingInfo.date,
    };

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'minutes',
        transcript,
        meetingInfo: formattedInfo,
        customPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    return data.result || '회의록을 생성할 수 없습니다.';
  } catch (error) {
    console.error('회의록 생성 중 오류가 발생했습니다:', error);
    throw new Error('회의록을 생성하는 중 오류가 발생했습니다.');
  }
} 