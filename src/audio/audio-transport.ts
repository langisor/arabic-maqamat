export interface TransportSessionStatus {
  scope: string;
  activity: string;
}

export interface AudioTransportStatus {
  audioContextReady: boolean;
  activeSessions: TransportSessionStatus[];
}

export interface TransportSession {
  readonly scope: string;
  readonly activity: string;
  isActive(): boolean;
  onCancel(callback: () => void): void;
  setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
  setInterval(callback: () => void, intervalMs: number): ReturnType<typeof setInterval>;
  finish(): void;
}

interface SessionRecord {
  id: number;
  scope: string;
  activity: string;
  active: boolean;
  timers: Set<() => void>;
  cancelCallbacks: Set<() => void>;
}

export class AudioTransport {
  private static sessions = new Map<string, SessionRecord>();
  private static listeners = new Set<(status: AudioTransportStatus) => void>();
  private static globalStopHandlers = new Set<() => void>();
  private static nextSessionId = 1;
  private static audioContextReady = false;
  private static audioStartup: Promise<void> | null = null;

  public static getStatus(): AudioTransportStatus {
    return {
      audioContextReady: this.audioContextReady,
      activeSessions: Array.from(this.sessions.values(), ({ scope, activity }) => ({
        scope,
        activity,
      })),
    };
  }

  public static subscribe(
    listener: (status: AudioTransportStatus) => void
  ): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  public static ensureAudioContext(
    start: () => Promise<void>,
    isReady?: () => boolean
  ): Promise<void> {
    if (this.audioContextReady && (!isReady || isReady())) return Promise.resolve();
    if (this.audioContextReady) {
      this.audioContextReady = false;
      this.publish();
    }
    if (this.audioStartup) return this.audioStartup;

    this.audioStartup = start()
      .then(() => {
        this.audioContextReady = true;
        this.publish();
      })
      .catch((error: unknown) => {
        this.audioContextReady = false;
        this.publish();
        throw error;
      })
      .finally(() => {
        this.audioStartup = null;
      });

    return this.audioStartup;
  }

  public static startSession(scope: string, activity: string): TransportSession {
    this.stopScope(scope);

    const record: SessionRecord = {
      id: this.nextSessionId++,
      scope,
      activity,
      active: true,
      timers: new Set(),
      cancelCallbacks: new Set(),
    };
    this.sessions.set(scope, record);
    this.publish();

    const isCurrent = () =>
      record.active && this.sessions.get(scope)?.id === record.id;

    return {
      scope,
      activity,
      isActive: isCurrent,
      onCancel: (callback) => {
        if (isCurrent()) record.cancelCallbacks.add(callback);
        else callback();
      },
      setTimeout: (callback, delayMs) => {
        const timer = globalThis.setTimeout(() => {
          if (!isCurrent()) return;
          callback();
        }, delayMs);
        record.timers.add(() => globalThis.clearTimeout(timer));
        return timer;
      },
      setInterval: (callback, intervalMs) => {
        const timer = globalThis.setInterval(() => {
          if (isCurrent()) callback();
        }, intervalMs);
        record.timers.add(() => globalThis.clearInterval(timer));
        return timer;
      },
      finish: () => this.finishSession(record),
    };
  }

  public static stopScope(scope: string): void {
    const record = this.sessions.get(scope);
    if (!record) return;

    this.sessions.delete(scope);
    record.active = false;
    record.timers.forEach((clearTimer) => clearTimer());
    record.timers.clear();
    record.cancelCallbacks.forEach((callback) => {
      try {
        callback();
      } catch {
        // Continue cancelling the remaining session resources.
      }
    });
    record.cancelCallbacks.clear();
    this.publish();
  }

  public static stopWhere(predicate: (session: TransportSessionStatus) => boolean): void {
    Array.from(this.sessions.values())
      .filter(({ scope, activity }) => predicate({ scope, activity }))
      .forEach(({ scope }) => this.stopScope(scope));
  }

  public static stopAll(): void {
    Array.from(this.sessions.keys()).forEach((scope) => this.stopScope(scope));
    this.globalStopHandlers.forEach((handler) => handler());
    this.publish();
  }

  public static registerGlobalStopHandler(handler: () => void): () => void {
    this.globalStopHandlers.add(handler);
    return () => this.globalStopHandlers.delete(handler);
  }

  private static finishSession(record: SessionRecord): void {
    if (this.sessions.get(record.scope)?.id !== record.id) return;

    this.sessions.delete(record.scope);
    record.active = false;
    record.timers.forEach((clearTimer) => clearTimer());
    record.timers.clear();
    record.cancelCallbacks.clear();
    this.publish();
  }

  private static publish(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }
}
