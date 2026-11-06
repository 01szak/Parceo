/*
 * MOCK: every frontend mock is registered here. Switching a feature to the backend means providing
 * a real implementation of its abstract API instead of the mock one (see PLAN.md, "Mocki we frontendzie").
 */
import {Provider} from '@angular/core';
import {OrganisationApi, OrganisationMockApi} from './organisation.mock';
import {StaffApi, StaffMockApi} from './staff.mock';
import {ReservationNotesApi, ReservationNotesMockApi} from './reservation-notes.mock';
import {DisplaySettingsApi, DisplaySettingsMockApi} from './display-settings.mock';

export function provideMocks(): Provider[] {
  return [
    {provide: OrganisationApi, useClass: OrganisationMockApi},
    {provide: StaffApi, useClass: StaffMockApi},
    {provide: ReservationNotesApi, useClass: ReservationNotesMockApi},
    {provide: DisplaySettingsApi, useClass: DisplaySettingsMockApi},
  ];
}
