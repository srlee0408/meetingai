'use client';

import React from 'react';

/**
 * 문장 정보 인터페이스
 */
interface Utterance {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

/**
 * 음성 인식 결과 인터페이스
 */
interface TranscriptionResultProps {
  data: {
    text: string;
    utterances?: Utterance[];
    words?: Array<{
      text: string;
      start: number;
      end: number;
      confidence: number;
    }>;
  } | null;
}

/**
 * 시간을 포맷팅하는 함수
 * @param milliseconds 밀리초 단위 시간
 * @returns 포맷팅된 시간 문자열 (MM:SS)
 */
const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * 음성 인식 결과 표시 컴포넌트
 * Assembly AI로부터 받은 텍스트 변환 결과를 화자별로 구분하여 표시
 */
const TranscriptionResult: React.FC<TranscriptionResultProps> = ({ data }) => {
  if (!data) {
    return <div className="text-center text-gray-500 my-4">음성 인식 결과가 없습니다.</div>;
  }

  // 화자별 목록이 없는 경우 텍스트만 표시
  if (!data.utterances || data.utterances.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">음성 인식 결과</h3>
        <div className="p-3 bg-gray-50 rounded">
          <p>{data.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">음성 인식 결과</h3>
      
      <div className="space-y-3">
        {data.utterances.map((utterance, index) => (
          <div 
            key={index}
            className="p-3 bg-gray-50 rounded flex"
          >
            {/* 텍스트 내용 */}
            <div className="flex-grow">
              <div className="text-xs text-gray-500 mb-1">
                {formatTime(utterance.start)} - {formatTime(utterance.end)}
              </div>
              <p>{utterance.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TranscriptionResult; 