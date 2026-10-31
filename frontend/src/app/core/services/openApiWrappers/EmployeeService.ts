import {inject, Injectable} from '@angular/core';
import {Employee} from '@core/models/Employee';
import {BehaviorSubject, from, Observable, tap} from 'rxjs';
import {Api, getUser} from '../../../api';


@Injectable({providedIn: "root"})
export class EmployeeService {
  private api = inject(Api);

  private employeeBs = new BehaviorSubject<Employee | null>(null);
  public employee$ = this.employeeBs.asObservable();

  public getAppUser(): Observable<Employee> {
    return from(this.api.invoke(getUser)).pipe(
      tap(e => {
        this.employeeBs.next(e as Employee);
      })
    ) as unknown as Observable<Employee>;
  }

}
