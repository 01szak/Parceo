import {Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {ResourceType} from './service-facade.service';

/**
 * A counter per resource type, bumped after every successful create / update / delete.
 * Queries read it in their params, so every list of that type reloads after a change made anywhere in the app.
 */
@Injectable({providedIn: 'root'})
export class DataVersionService {
  private readonly versions = new Map<ResourceType, WritableSignal<number>>();

  public version(type: ResourceType): Signal<number> {
    return this.counter(type).asReadonly();
  }

  public bump(type: ResourceType): void {
    this.counter(type).update(v => v + 1);
  }

  private counter(type: ResourceType): WritableSignal<number> {
    if (!this.versions.has(type)) this.versions.set(type, signal(0));
    return this.versions.get(type)!;
  }
}
