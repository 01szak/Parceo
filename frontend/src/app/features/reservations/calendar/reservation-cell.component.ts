import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {ReservationDto} from '../../../api';
import {DateFormater} from '@shared/helper/DateFormater';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-reservation-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass
  ],
  template: `
    <div [ngClass]="{'content': true, 'blink': isActiveOrExpiredUnpaid()}" [style]="setColor() + setParagraphPlacing()">
      <p><strong>{{ getGuestName() }} </strong></p>
    </div>
  `,
  styles: `
    .content {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      border-radius: 10px;
      display: flex;
      align-items: center;
      padding: 0 5px;
      overflow: hidden;
      white-space: nowrap;
    }

    p {
      margin: 0;
    }
  `
})
export class ReservationCellComponent {
  @Input() reservation!: ReservationDto;
  @Input() onlyCheckoutDisplay!: boolean;
  @Input() displayedLength!: number;

  protected getGuestName() {
    let fName = '';
    let lName = '';
    let delimeter = ' ';

    if (this.getResLength() <= 1 || this.displayedLength <= 1) {
      fName = this.reservation.guest?.firstname?.substring(0, 1) ?? '';
      lName = this.reservation.guest?.lastname?.substring(0, 1) ?? '';
      delimeter = '.'
    } else {
      fName = this.reservation.guest?.firstname ?? '';
      lName = this.reservation.guest?.lastname ?? '';
    }
    return (fName + delimeter + lName);
  }

  private getResLength() {
    const checkin = DateFormater.MOMENT(this.reservation.checkin);
    const checkout = DateFormater.MOMENT(this.reservation.checkout);
    let length = 0;
    if (checkin.month() < checkout.month()) {
      let daysToEOM = checkin.daysInMonth() - checkin.date();
      length = daysToEOM + checkout.date();
    } else {
      length = checkout.date() - checkin.date();
    }
    return length;
  }

  protected setColor() {
    const status = this.reservation.reservationStatus;
    let bgr = 'var(--res-active-bg)';
    let border = 'var(--res-active-border)';
    if (!this.reservation.paid) {
      bgr = 'var(--res-active-unpaid-bg)';
      border = 'var(--res-active-unpaid-border)';
    }
    if (status === 'COMING') {
      bgr = 'var(--res-coming-bg)';
      border = 'var(--res-coming-border)';
    } else if (status === 'EXPIRED' && !this.reservation.paid) {
      bgr = 'var(--res-unpaid-bg)';
      border = 'var(--res-unpaid-border)';
    } else if (status === 'EXPIRED') {
      bgr = 'var(--res-expired-bg)';
      border = 'var(--res-expired-border)';
    }

    return `background-color: ${bgr} !important; border: solid 5px ${border} !important;`;
  }

  protected isActiveOrExpiredUnpaid() {
    return (this.reservation.reservationStatus === 'ACTIVE' || this.reservation.reservationStatus === 'EXPIRED') && !this.reservation.paid;
  }

  protected setParagraphPlacing() {
    return `justify-content: flex-${!this.onlyCheckoutDisplay ? 'start' : 'end'} !important;`;
  }
}
