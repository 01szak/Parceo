import {Injectable, signal, Signal, WritableSignal} from '@angular/core';

export interface SavedFilter<V extends string, F> {
  id: string;
  label: string;
  //the built-in view the filter starts from
  view: V;
  filters: F;
}

const STORAGE_PREFIX = 'parceo.savedFilters.';

/**
 * Named filters of a list, kept in localStorage (per device) until the backend can store them per user.
 * Each list has its own key, e.g. 'reservations'.
 */
@Injectable({providedIn: 'root'})
export class SavedFiltersService {
  private readonly lists = new Map<string, WritableSignal<SavedFilter<string, unknown>[]>>();

  public list<V extends string, F>(listId: string): Signal<SavedFilter<V, F>[]> {
    return this.store(listId).asReadonly() as Signal<SavedFilter<V, F>[]>;
  }

  public add<V extends string, F>(listId: string, label: string, view: V, filters: F): SavedFilter<V, F> {
    const saved: SavedFilter<V, F> = {id: `saved-${Date.now()}`, label, view, filters};
    this.store(listId).update(list => [...list, saved]);
    this.persist(listId);
    return saved;
  }

  public remove(listId: string, id: string): void {
    this.store(listId).update(list => list.filter(f => f.id !== id));
    this.persist(listId);
  }

  private store(listId: string): WritableSignal<SavedFilter<string, unknown>[]> {
    if (!this.lists.has(listId)) this.lists.set(listId, signal(this.read(listId)));
    return this.lists.get(listId)!;
  }

  private read(listId: string): SavedFilter<string, unknown>[] {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + listId);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(listId: string): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + listId, JSON.stringify(this.store(listId)()));
    } catch {
      //storage can be blocked (private mode); the filters still work until the page is reloaded
    }
  }
}
