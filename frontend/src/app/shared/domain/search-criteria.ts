import {Join, SearchCriteria} from '../../api';

/**
 * Turns a property path into the nested join the backend expects:
 * 'checkin' -> {key: 'checkin'}, 'camperPlace.camperPlaceType.id' -> camperPlace -> camperPlaceType -> id.
 */
export function joinPath(path: string): Join {
  const [key, ...rest] = path.split('.');
  return rest.length ? {key, inner: joinPath(rest.join('.'))} : {key};
}

/** A criteria on a (possibly nested) property path, joined with AND unless stated otherwise. */
export function criteria(
  path: string,
  operation: SearchCriteria['operation'],
  value: string,
  extra: Partial<SearchCriteria> = {}
): SearchCriteria {
  return {object: joinPath(path), operation, value, joinOperator: 'AND', ...extra};
}
