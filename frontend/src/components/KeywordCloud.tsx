'use client';

import { useEffect, useState } from 'react';
import { KeywordData } from './types';

interface KeywordCloudProps {
  keywords: KeywordData[];
  onKeywordClick?: (keyword: string) => void;
}

export default function KeywordCloud({ keywords, onKeywordClick }: KeywordCloudProps) {
  const [cloudWords, setCloudWords] = useState<KeywordData[]>([]);

  useEffect(() => {
    if (keywords && keywords.length > 0) {
      // Filter and prepare words for the cloud
      // Only take top 50 words for better display
      const topWords = [...keywords]
        .sort((a, b) => b.value - a.value)
        .slice(0, 50);
      
      setCloudWords(topWords);
    }
  }, [keywords]);

  // Calculate font size based on value (simple linear scaling)
  const calculateFontSize = (value: number) => {
    const minValue = Math.min(...cloudWords.map(w => w.value));
    const maxValue = Math.max(...cloudWords.map(w => w.value));
    const minSize = 12;
    const maxSize = 40;
    
    if (maxValue === minValue) return (minSize + maxSize) / 2;
    
    const scale = (value - minValue) / (maxValue - minValue);
    return minSize + scale * (maxSize - minSize);
  };

  if (!cloudWords.length) {
    return <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">Loading keyword data...</div>;
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Trending Keywords</h2>
      <div className="bg-gray-50 rounded-lg p-6 h-[400px] flex flex-wrap justify-center items-center overflow-hidden">
        {cloudWords.map((word) => {
          // Generate a color based on the word's value
          const hue = (word.value * 137) % 360; // Use golden angle for color variety
          const fontSize = calculateFontSize(word.value);
          
          return (
            <div
              key={word.text}
              className="m-2 cursor-pointer hover:bg-gray-100 px-2 rounded"
              style={{
                fontSize: `${fontSize}px`,
                color: `hsl(${hue}, 70%, 50%)`,
                fontWeight: word.value > (cloudWords[0].value / 2) ? 'bold' : 'normal'
              }}
              onClick={() => onKeywordClick && onKeywordClick(word.text)}
              title={`${word.text}: ${word.value} occurrences`}
            >
              {word.text}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-gray-600">
        Click on a keyword to filter papers containing that term.
      </p>
    </div>
  );
}