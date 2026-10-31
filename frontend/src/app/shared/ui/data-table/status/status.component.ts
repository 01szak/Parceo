import {Component, Input} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-status',
  imports: [
    NgClass
  ],
  template: `
  <div
    [ngClass]="{
      'active': status?.toLowerCase() === 'active',
      'coming': status?.toLowerCase() === 'coming',
      'expired': status?.toLowerCase() === 'expired',
      'other': !statuses.includes(status.toLowerCase()),
      'shadow' : true
    }"
  >
    <p>{{status}}</p>
  </div>
  `,
  styles: `
    div {
      border-radius: 8px;
      text-align: center;
      width: 100%;
      max-width: 60px;
      max-height: 30px;
    }
    .active {
      border: solid 4px #036703;
      background-color: #5ad65a;
      color: #014201;
    }
    .coming {
      border: solid 4px #9a9a04;
      background-color: yellow;
      color: #636303;
    }
    .expired {
      border: solid 4px #535353;
      background-color: #a5a3a3;
      color: #4a4949;
    }
    p {
      padding: 2px;
      margin: 0;
      font-size: small;
      font-weight: bold;
    }
  `
})
export class StatusComponent {
  @Input() status: string = '';
  statuses: string[] = ['active', 'coming', 'expired' ]
}
