'use client';

import { useState } from 'react';
import { analytics } from '@lib/analytics';

interface NPSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NPSModal({ isOpen, onClose }: NPSModalProps) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (score !== null) {
      analytics.npsSubmitted(score, feedback || undefined);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setScore(null);
        setFeedback('');
      }, 2000);
    }
  };

  const getScoreLabel = (s: number): string => {
    if (s <= 6) return 'Not likely';
    if (s <= 8) return 'Neutral';
    return 'Very likely';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {submitted ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🙏</div>
            <h3 className="text-lg font-semibold text-gray-900">Thank you!</h3>
            <p className="text-gray-600 mt-2">Your feedback helps us improve.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                How likely are you to recommend this tool?
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              On a scale of 0-10, how likely are you to recommend this tool to a colleague?
            </p>

            <div className="flex justify-between gap-1 mb-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    score === n
                      ? n <= 6
                        ? 'bg-red-500 text-white'
                        : n <= 8
                        ? 'bg-yellow-500 text-white'
                        : 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="flex justify-between text-xs text-gray-500 mb-4">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>

            {score !== null && (
              <p className="text-center text-sm mb-4">
                <span className={`font-medium ${
                  score <= 6 ? 'text-red-600' : score <= 8 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {getScoreLabel(score)}
                </span>
              </p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Any additional feedback? (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="What could we improve?"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={score === null}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
