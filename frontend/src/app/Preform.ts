import {catchError, Observable} from 'rxjs';

export class Preform<T>{
  data: T | undefined;
  isLoading: boolean = false;
  hasError: boolean = false;
  private action: Observable<T> | undefined;

  load(action: Observable<T>):void {
    this.isLoading = true;
    this.hasError = false;
    this.action = action;
    this.action
      .pipe(
        catchError(() =>{
          this.data = undefined;
          this.isLoading = false;
          this.hasError = true;
          return [];
        })
        )
      .subscribe((data: T) => {
        this.data = data;
        this.isLoading = false;
        this.hasError = false;
      });
  }

}
