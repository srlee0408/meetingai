/**
 * Assembly AI와 통신하는 서비스
 * 음성 파일을 텍스트로 변환하는 기능을 제공
 */

import { ASSEMBLY_AI_API_KEY } from './env';
import { TranscriptionResultType } from '../types';

// Assembly AI API 기본 URL
const API_BASE_URL = 'https://api.assemblyai.com/v2';

// API 키 유효성 검사 함수
const validateAPIKey = () => {
  if (!ASSEMBLY_AI_API_KEY || ASSEMBLY_AI_API_KEY.trim() === '') {
    throw new Error('Assembly AI API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
  }
  return ASSEMBLY_AI_API_KEY;
};

/**
 * 녹음된 오디오 파일을 Assembly AI에 업로드
 * @param audioBlob 녹음된 오디오 Blob
 * @returns 업로드된 오디오 파일의 URL
 */
export async function uploadAudio(audioBlob: Blob): Promise<string> {
  try {
    const apiKey = validateAPIKey();
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
      },
      body: audioBlob,
    });

    if (!response.ok) {
      throw new Error(`오디오 업로드 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.upload_url;
  } catch (error) {
    console.error('오디오 업로드 중 오류 발생:', error);
    throw new Error('오디오 업로드에 실패했습니다. 다시 시도해 주세요.');
  }
}

/**
 * 음성 인식 작업 시작
 * @param audioUrl 업로드된 오디오 파일의 URL
 * @returns 음성 인식 작업 ID
 */
export async function startTranscription(audioUrl: string): Promise<string> {
  try {
    const apiKey = validateAPIKey();
    
    const response = await fetch(`${API_BASE_URL}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: 'ko', // 한국어 설정
        speaker_labels: false, // 화자 구분 비활성화
      }),
    });

    if (!response.ok) {
      throw new Error(`음성 인식 요청 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('음성 인식 요청 중 오류 발생:', error);
    throw new Error('음성 인식 요청에 실패했습니다. 다시 시도해 주세요.');
  }
}

/**
 * 음성 인식 작업 상태 확인
 * @param transcriptId 음성 인식 작업 ID
 * @returns 음성 인식 결과 또는 상태
 */
export async function getTranscriptionResult(transcriptId: string): Promise<TranscriptionResultType> {
  try {
    const apiKey = validateAPIKey();
    
    const response = await fetch(`${API_BASE_URL}/transcript/${transcriptId}`, {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`음성 인식 결과 조회 실패: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('음성 인식 결과 조회 중 오류 발생:', error);
    throw new Error('음성 인식 결과 조회에 실패했습니다. 다시 시도해 주세요.');
  }
}

/**
 * 음성 인식 작업이 완료될 때까지 대기
 * @param transcriptId 음성 인식 작업 ID
 * @returns 음성 인식 완료된 결과
 */
export async function waitForTranscriptionCompletion(transcriptId: string): Promise<TranscriptionResultType> {
  // 초기값으로 빈 객체 초기화 (타입 오류 방지)
  let result: TranscriptionResultType = {
    id: transcriptId,
    status: 'processing',
    text: '',
    audio_url: ''
  };
  
  let status = 'processing';
  
  // 최대 대기 시간 설정 (5분)
  const maxWaitTime = 5 * 60 * 1000;
  const startTime = Date.now();
  
  while (status === 'processing' || status === 'queued') {
    // 최대 대기 시간 초과 확인
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('음성 인식 시간이 초과되었습니다. 다시 시도해 주세요.');
    }
    
    // 1초 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 상태 확인
    result = await getTranscriptionResult(transcriptId);
    status = result.status;
  }
  
  if (status === 'completed') {
    return result;
  } else {
    throw new Error(`음성 인식 실패: ${result.status}`);
  }
} 