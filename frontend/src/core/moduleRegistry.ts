/**
 * Module registry — gradual modular API for Argus features.
 */
import { eventBus, ArgusEvents } from './eventBus';

export type ArgusModule = {
  id: string;
  name: string;
  version?: string;
  description?: string;
  panel?: string;
  commands?: { id: string; label: string; run: () => void }[];
  init?: () => void | Promise<void>;
  dispose?: () => void;
};

class ModuleRegistry {
  private modules = new Map<string, ArgusModule>();
  private initializing = new Set<string>();

  async register(mod: ArgusModule, opts?: { replace?: boolean }) {
    const existing = this.modules.get(mod.id);
    if (existing) {
      if (!opts?.replace) {
        console.warn('[Modules] already registered:', mod.id, '(pass replace:true to overwrite)');
        return;
      }
      try {
        existing.dispose?.();
      } catch (e) {
        console.error('[Modules] dispose failed', mod.id, e);
      }
      this.modules.delete(mod.id);
    }

    this.modules.set(mod.id, mod);
    if (this.initializing.has(mod.id)) return;
    this.initializing.add(mod.id);
    try {
      await mod.init?.();
      eventBus.emit(ArgusEvents.MODULE_LOADED, { id: mod.id });
    } catch (e) {
      console.error('[Modules] init failed', mod.id, e);
    } finally {
      this.initializing.delete(mod.id);
    }
  }

  unregister(id: string) {
    const m = this.modules.get(id);
    try {
      m?.dispose?.();
    } catch (e) {
      console.error('[Modules] dispose failed', id, e);
    }
    this.modules.delete(id);
  }

  get(id: string) {
    return this.modules.get(id);
  }

  list() {
    return [...this.modules.values()];
  }

  runCommand(commandId: string) {
    for (const m of this.modules.values()) {
      const cmd = m.commands?.find((c) => c.id === commandId);
      if (cmd) {
        cmd.run();
        return true;
      }
    }
    return false;
  }
}

export const moduleRegistry = new ModuleRegistry();

export function registerBuiltinModules() {
  void moduleRegistry.register({
    id: 'graph',
    name: 'Investigation Graph',
    description: 'React Flow graph · Obsidian-like edges',
    panel: 'rightPanel',
  });
  void moduleRegistry.register({
    id: 'search',
    name: 'OSINT Search',
    description: 'Multi-provider search + validation',
    panel: 'search',
  });
  void moduleRegistry.register({
    id: 'maltego',
    name: 'Maltego Bridge',
    panel: 'maltego',
  });
  void moduleRegistry.register({
    id: 'timeline',
    name: 'Timeline',
    panel: 'timeline',
  });
  void moduleRegistry.register({
    id: 'cli-search',
    name: 'CLI Search',
    description: 'Terminal search shell (npm run argus)',
  });
}
