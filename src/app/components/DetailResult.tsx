'use client';

import React, { useEffect, useState } from 'react';
import { markdownToHtml } from '../utils/markdownToHtml';

/**
 * 상세 회의록 인터페이스
 */
interface DetailResultProps {
  detail?: {
    title: string;
    date: string;
    location: string;
    attendees: string[];
    host: string;
    objective: string;
    generatedText?: string; // OpenAI로 생성된 회의록 텍스트
  };
  isLoading?: boolean;
}

/**
 * 회의 상세 결과를 표시하는 컴포넌트
 * 회의 제목, 날짜, 참석자 정보와 GPT로 생성된 텍스트 회의록 표시
 */
const DetailResult: React.FC<DetailResultProps> = ({ detail, isLoading = false }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');

  // 마크다운을 HTML로 변환
  useEffect(() => {
    const convertToHtml = async () => {
      if (detail?.generatedText) {
        const html = await markdownToHtml(detail.generatedText);
        setHtmlContent(html);
      }
    };

    convertToHtml();
  }, [detail]);
  
  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">회의 상세</h3>
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">상세 내용 생성 중...</span>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">회의 상세</h3>
        <div className="p-3 bg-gray-50 rounded text-center text-gray-500">
          <p>아직 상세 내용이 생성되지 않았습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* 회의 헤더 정보 */}
      <div className="bg-yellow-100 p-4 rounded-md mb-6">
        <h2 className="text-2xl font-bold mb-3">{detail.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base">
          <div><span className="font-medium text-lg">회의 제목:</span> <span className="text-lg">{detail.title}</span></div>
          <div><span className="font-medium text-lg">회의 일시:</span> <span className="text-lg">{detail.date}</span></div>
          <div><span className="font-medium text-lg">장소:</span> <span className="text-lg">{detail.location}</span></div>
          <div className="md:col-span-2"><span className="font-medium text-lg">참석자:</span> <span className="text-lg">{detail.attendees.join(', ')}</span></div>
          <div><span className="font-medium text-lg">주최자:</span> <span className="text-lg">{detail.host}</span></div>
          <div><span className="font-medium text-lg">회의 목적:</span> <span className="text-lg">{detail.objective}</span></div>
        </div>
      </div>

      {/* 회의록 내용 - HTML로 변환된 마크다운 */}
      <div className="p-4 bg-gray-50 rounded-md leading-relaxed text-gray-800">
        {htmlContent ? (
          <div className="prose prose-sm md:prose max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          <p className="whitespace-pre-line">{detail.generatedText || '회의록이 생성되지 않았습니다.'}</p>
        )}
      </div>
    </div>
  );
};

export default DetailResult; 