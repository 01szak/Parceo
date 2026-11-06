import {ResourceRef} from '@angular/core';
import {Page} from '@core/models/Page';

export function emptyPage<T>(): Page<T> {
  return {content: [], number: 0, size: 0, totalElements: 0, totalPages: 0};
}

//reading value() of a resource in the error state throws and breaks the whole view
export function safePage<T>(resource: ResourceRef<Page<T>>): Page<T> {
  return resource.hasValue() ? resource.value() : emptyPage<T>();
}
