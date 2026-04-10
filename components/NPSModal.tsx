'use client';

import { useState } from 'react';
import { analytics } from '@lib/analytics';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@components/ui/dialog';
import { Button } from '@components/ui/button';

interface NPSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NPSModal({ isOpen, onClose }: NPSModalProps) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🙏</div>
            <DialogTitle className="text-lg font-semibold text-foreground">Thank you!</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">Your feedback helps us improve.</DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>How likely are you to recommend this tool?</DialogTitle>
              <DialogDescription>
                On a scale of 0-10, how likely are you to recommend this tool to a colleague?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="flex justify-between gap-1 mb-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setScore(n)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors flex items-center justify-center ${
                      score === n
                        ? n <= 6
                          ? 'bg-destructive text-destructive-foreground'
                          : n <= 8
                          ? 'bg-warning text-primary-foreground'
                          : 'bg-success text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="flex justify-between text-xs text-muted-foreground mb-4">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>

              {score !== null && (
                <p className="text-center text-sm mb-4">
                  <span className={`font-medium ${
                    score <= 6 ? 'text-destructive' : score <= 8 ? 'text-warning' : 'text-success'
                  }`}>
                    {getScoreLabel(score)}
                  </span>
                </p>
              )}

              <div className="mb-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Any additional feedback? (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                  placeholder="What could we improve?"
                />
              </div>
            </div>

            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                Skip
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={score === null} className="flex-1 sm:flex-none">
                Submit
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
