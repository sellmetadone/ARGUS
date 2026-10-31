/** Lightweight event bus — modules communicate without tight coupling */
type Handler = (payload?: unknown) => void;

class EventBus {
  private map = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler) {
    if (!this.map.has(event)) this.map.set(event, new Set());
    this.map.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: Handler) {
    this.map.get(event)?.delete(handler);
  }

  emit(event: string, payload?: unknown) {
    this.map.get(event)?.forEach((h) => {
      try {
        h(payload);
      } catch (e) {
        console.error('[EventBus]', event, e);
      }
    });
  }
}

export const eventBus = new EventBus();
export const ArgusEvents = {
  CASE_CHANGED: 'case:changed',
  ENTITY_ADDED: 'entity:added',
  GRAPH_LINKED: 'graph:linked',
  SEARCH_DONE: 'search:done',
  SETTINGS_CHANGED: 'settings:changed',
  MODULE_LOADED: 'module:loaded',
} as const;
