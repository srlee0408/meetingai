'use client';

import React, { useEffect, useState } from 'react';
import { markdownToHtml } from '../utils/markdownToHtml';

/**
 * 요약 결과 인터페이스
 */
interface SummaryResultProps {
  summary?: string;
  isLoading?: boolean;
}

/**
 * 회의 요약 결과를 표시하는 컴포넌트
 * 약 500자 분량의 회의 내용 요약을 표시
 */
const SummaryResult: React.FC<SummaryResultProps> = ({ summary, isLoading = false }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');

  // 마크다운을 HTML로 변환
  useEffect(() => {
    const convertToHtml = async () => {
      if (summary) {
        const html = await markdownToHtml(summary);
        setHtmlContent(html);
      }
    };

    convertToHtml();
  }, [summary]);
  
  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">회의 요약</h3>
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">요약 생성 중...</span>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">회의 요약</h3>
        <div className="p-3 bg-gray-50 rounded text-center text-gray-500">
          <p>아직 요약이 생성되지 않았습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">회의 요약</h3>
      <div className="p-4 bg-gray-50 rounded leading-relaxed text-gray-800">
        {htmlContent ? (
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          <p>{summary}</p>
        )}
      </div>
    </div>
  );
};

export default SummaryResult; 