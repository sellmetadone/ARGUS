type Handler = (payload?: unknown) => void;

export const ArgusEvents = {
  MODULE_LOADED: 'module:loaded',
  CASE_SAVED: 'case:saved',
  CASE_LOADED: 'case:loaded',
  GRAPH_CHANGED: 'graph:changed',
  SEARCH_DONE: 'search:done',
} as const;

export type ArgusEventName = (typeof ArgusEvents)[keyof typeof ArgusEvents] | string;

class EventBus {
  private listeners = new Map<string, Set<Handler>>();

  on(event: ArgusEventName, handler: Handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: ArgusEventName, handler: Handler) {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: ArgusEventName, payload?: unknown) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const h of set) {
      try {
        h(payload);
      } catch (e) {
        console.error('[eventBus]', event, e);
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
