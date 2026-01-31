// Analytics module for Lung Nodule Decision Support Tool
// Tracks key events and metrics for measuring tool effectiveness

export type AnalyticsEvent =
  | 'assessment_started'
  | 'assessment_completed'
  | 'result_copied'
  | 'result_exported'
  | 'error_displayed'
  | 'step_changed'
  | 'guideline_selected'
  | 'nps_submitted'
  | 'offline_mode_activated'
  | 'offline_mode_deactivated';

export interface EventProperties {
  // Common properties
  timestamp?: number;
  sessionId?: string;
  
  // Assessment properties
  guideline?: 'fleischner-2017' | 'lung-rads-2022';
  category?: string;
  noduleType?: string;
  stepName?: string;
  stepNumber?: number;
  
  // Timing
  timeToResultMs?: number;
  
  // Error properties
  errorType?: string;
  errorMessage?: string;
  
  // NPS
  npsScore?: number;
  npsFeedback?: string;
  
  // Device info
  isMobile?: boolean;
  isOffline?: boolean;
}

interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  endpoint?: string;
  batchSize: number;
  flushIntervalMs: number;
}

class Analytics {
  private config: AnalyticsConfig = {
    enabled: true,
    debug: process.env.NODE_ENV === 'development',
    batchSize: 10,
    flushIntervalMs: 30000,
  };

  private eventQueue: Array<{ event: AnalyticsEvent; properties: EventProperties }> = [];
  private sessionId: string = '';
  private assessmentStartTime: number = 0;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.sessionId = this.generateSessionId();
      this.startFlushTimer();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushIntervalMs);
  }

  private getDeviceInfo(): { isMobile: boolean; isOffline: boolean } {
    if (typeof window === 'undefined') {
      return { isMobile: false, isOffline: false };
    }
    return {
      isMobile: window.innerWidth < 768,
      isOffline: !navigator.onLine,
    };
  }

  track(event: AnalyticsEvent, properties: EventProperties = {}): void {
    if (!this.config.enabled) return;

    const enrichedProperties: EventProperties = {
      ...properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...this.getDeviceInfo(),
    };

    this.eventQueue.push({ event, properties: enrichedProperties });

    if (this.config.debug) {
      console.warn(`[Analytics] ${event}`, enrichedProperties);
    }

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Convenience methods for common events
  assessmentStarted(guideline: 'fleischner-2017' | 'lung-rads-2022'): void {
    this.assessmentStartTime = Date.now();
    this.track('assessment_started', { guideline });
  }

  assessmentCompleted(guideline: 'fleischner-2017' | 'lung-rads-2022', category: string, noduleType: string): void {
    const timeToResultMs = this.assessmentStartTime > 0 
      ? Date.now() - this.assessmentStartTime 
      : undefined;
    
    this.track('assessment_completed', {
      guideline,
      category,
      noduleType,
      timeToResultMs,
    });
    
    this.assessmentStartTime = 0;
  }

  stepChanged(stepName: string, stepNumber: number): void {
    this.track('step_changed', { stepName, stepNumber });
  }

  guidelineSelected(guideline: 'fleischner-2017' | 'lung-rads-2022'): void {
    this.track('guideline_selected', { guideline });
  }

  resultCopied(guideline: 'fleischner-2017' | 'lung-rads-2022', category: string): void {
    this.track('result_copied', { guideline, category });
  }

  resultExported(guideline: 'fleischner-2017' | 'lung-rads-2022', category: string): void {
    this.track('result_exported', { guideline, category });
  }

  errorDisplayed(errorType: string, errorMessage: string): void {
    this.track('error_displayed', { errorType, errorMessage });
  }

  npsSubmitted(score: number, feedback?: string): void {
    this.track('nps_submitted', { npsScore: score, npsFeedback: feedback });
  }

  offlineModeChanged(isOffline: boolean): void {
    this.track(isOffline ? 'offline_mode_activated' : 'offline_mode_deactivated');
  }

  // Get time-to-result for current assessment
  getTimeToResult(): number | null {
    if (this.assessmentStartTime === 0) return null;
    return Date.now() - this.assessmentStartTime;
  }

  // Flush events to backend (or localStorage for offline)
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    if (typeof window === 'undefined') return;

    // Store in localStorage for persistence
    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      const allEvents = [...storedEvents, ...eventsToSend];
      
      // Keep only last 1000 events
      const trimmedEvents = allEvents.slice(-1000);
      localStorage.setItem('analytics_events', JSON.stringify(trimmedEvents));

      if (this.config.debug) {
        console.warn(`[Analytics] Flushed ${eventsToSend.length} events`);
      }

      // If endpoint is configured, send to backend
      if (this.config.endpoint && navigator.onLine) {
        await this.sendToBackend(eventsToSend);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to flush events:', error);
      }
    }
  }

  private async sendToBackend(events: Array<{ event: AnalyticsEvent; properties: EventProperties }>): Promise<void> {
    if (!this.config.endpoint) return;

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch {
      // Silently fail - events are already stored in localStorage
    }
  }

  // Get stored events for analysis
  getStoredEvents(): Array<{ event: AnalyticsEvent; properties: EventProperties }> {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('analytics_events') || '[]');
    } catch {
      return [];
    }
  }

  // Calculate metrics from stored events
  getMetrics(): {
    totalAssessments: number;
    completionRate: number;
    averageTimeToResultMs: number;
    mobileUsageRate: number;
    averageNps: number;
    errorRate: number;
  } {
    const events = this.getStoredEvents();
    
    const started = events.filter(e => e.event === 'assessment_started').length;
    const completed = events.filter(e => e.event === 'assessment_completed');
    const completedCount = completed.length;
    
    const timesToResult = completed
      .map(e => e.properties.timeToResultMs)
      .filter((t): t is number => t !== undefined);
    
    const mobileEvents = events.filter(e => e.properties.isMobile);
    
    const npsEvents = events.filter(e => e.event === 'nps_submitted');
    const npsScores = npsEvents
      .map(e => e.properties.npsScore)
      .filter((s): s is number => s !== undefined);
    
    const errors = events.filter(e => e.event === 'error_displayed').length;

    return {
      totalAssessments: started,
      completionRate: started > 0 ? completedCount / started : 0,
      averageTimeToResultMs: timesToResult.length > 0 
        ? timesToResult.reduce((a, b) => a + b, 0) / timesToResult.length 
        : 0,
      mobileUsageRate: events.length > 0 ? mobileEvents.length / events.length : 0,
      averageNps: npsScores.length > 0 
        ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length 
        : 0,
      errorRate: started > 0 ? errors / started : 0,
    };
  }

  // Clear stored events
  clearStoredEvents(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analytics_events');
    }
  }

  // Configure analytics
  configure(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

// Singleton instance
export const analytics = new Analytics();

// Hook for React components
export function useAnalytics() {
  return analytics;
}
