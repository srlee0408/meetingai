import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../../utils/env';

// API 키 유효성 검사
function validateAPIKey() {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
    console.error('⚠️ OpenAI API 키가 설정되지 않았습니다.');
    throw new Error('OpenAI API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
  }
  
  // 마스킹된 API 키 (개발 환경에서만 로깅)
  const maskedKey = OPENAI_API_KEY.slice(0, 5) + '...' + OPENAI_API_KEY.slice(-5);
  console.log('🔑 OpenAI API 키 확인:', maskedKey);
  return OPENAI_API_KEY;
}

// 서버 측에서만 실행되는 OpenAI 인스턴스
let openai: OpenAI | null = null;
try {
  const apiKey = validateAPIKey();
  openai = new OpenAI({
    apiKey: apiKey,
  });
} catch (error) {
  console.error('OpenAI 클라이언트 초기화 중 오류:', error);
  // 여기서는 인스턴스를 null로 놔두고, API 요청 시 처리
}

/**
 * 요약 생성 API 엔드포인트
 * 회의 내용을 받아 요약을 생성하고 반환합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // API 키 유효성 검사 시도
    if (!openai) {
      try {
        const apiKey = validateAPIKey();
        openai = new OpenAI({
          apiKey: apiKey,
        });
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'OpenAI API 키가 설정되지 않았습니다.' },
          { status: 500 }
        );
      }
    }

    // OpenAI 인스턴스 확인
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI 클라이언트가 초기화되지 않았습니다. API 키를 확인해주세요.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { type, transcript, meetingInfo, customPrompt } = body;
    
    console.log('📝 API 요청 타입:', type);
    console.log('🔤 트랜스크립트 길이:', transcript?.length || 0);
    console.log('🔄 커스텀 프롬프트 사용:', customPrompt ? '네' : '아니오');

    // 요청 타입에 따라 다른 처리
    if (type === 'summary') {
      // 입력 데이터 검증
      if (!transcript || transcript.trim() === '') {
        return NextResponse.json(
          { error: '요약할 회의 내용이 제공되지 않았습니다.' },
          { status: 400 }
        );
      }

      // 요약 생성
      try {
        console.log('🔄 요약 생성 API 호출 시작');
        const model = 'gpt-4o-mini';
        console.log('📊 사용 모델:', model);
        
        // 기본 프롬프트 또는 커스텀 프롬프트 사용
        const systemPrompt = customPrompt || '당신은 회의 내용을 정확하게 요약하는 전문가입니다. 핵심 내용만 간결하게 요약해주세요. 중요한 논의 사항, 결정된 사항, 액션 아이템을 중심으로 요약해주세요. 내용 요약은 최소 500자 이상으로 요약해주세요.';
        
        const response = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `다음 회의 내용을 요약해주세요:\n${transcript}`
            }
          ],
          temperature: 0.3,
        });
        console.log('✅ 요약 생성 API 호출 완료');
        
        return NextResponse.json({
          result: response.choices[0]?.message?.content || '요약을 생성할 수 없습니다.'
        });
      } catch (apiError: any) {
        console.error('❌ OpenAI API 호출 중 오류:', apiError);
        return NextResponse.json(
          { error: 'OpenAI API 호출 중 오류가 발생했습니다.', details: apiError.message },
          { status: 500 }
        );
      }
    } 
    else if (type === 'minutes') {
      // 입력 데이터 검증
      if (!transcript || transcript.trim() === '') {
        return NextResponse.json(
          { error: '회의록 생성을 위한 회의 내용이 제공되지 않았습니다.' },
          { status: 400 }
        );
      }

      if (!meetingInfo || !meetingInfo.title) {
        return NextResponse.json(
          { error: '회의 정보가 충분히 제공되지 않았습니다.' },
          { status: 400 }
        );
      }

      // 회의 정보 문자열 변환
      const infoString = `
        회의 제목: ${meetingInfo.title}
        회의 일자: ${meetingInfo.date || '미지정'}
        참가자: ${meetingInfo.participants?.join(', ') || '미지정'}
      `;

      // 회의록 생성
      try {
        console.log('🔄 회의록 생성 API 호출 시작');
        const model = 'gpt-4o-mini';
        console.log('📊 사용 모델:', model);
        
        // 기본 프롬프트 또는 커스텀 프롬프트 사용
        const systemPrompt = customPrompt || `당신은 회의 내용을 전문적인 회의록으로 변환하는 비서입니다. 
          다음과 같은 형식으로 회의록을 작성해주세요:
          
          1. 회의 정보 (제목, 일자, 참가자)
          2. 회의 요약
          3. 주요 논의 사항 (토픽별로 구분)
          4. 결정된 사항
          5. 할당된 업무와 담당자
          
          내용이 없는 섹션은 생략해도 됩니다.`;
        
        const response = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `다음은 회의 정보입니다:\n${infoString}\n\n다음 회의 내용을 바탕으로 회의록을 작성해주세요:\n${transcript}`
            }
          ],
          temperature: 0.4,
        });
        console.log('✅ 회의록 생성 API 호출 완료');
        
        return NextResponse.json({
          result: response.choices[0]?.message?.content || '회의록을 생성할 수 없습니다.'
        });
      } catch (apiError: any) {
        console.error('❌ OpenAI API 호출 중 오류:', apiError);
        return NextResponse.json(
          { error: 'OpenAI API 호출 중 오류가 발생했습니다.', details: apiError.message },
          { status: 500 }
        );
      }
    }
    
    // 지원하지 않는 요청 타입
    return NextResponse.json(
      { error: '지원하지 않는 요청 타입입니다.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('🔴 AI 처리 중 오류:', error);
    return NextResponse.json(
      { error: 'AI 처리 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
} 