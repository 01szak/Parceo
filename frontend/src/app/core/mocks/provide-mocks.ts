/*
 * MOCK: every frontend mock is registered here. Switching a feature to the backend means providing
 * a real implementation of its abstract API instead of the mock one (see README.md, "Mocks").
 */
import {Provider} from '@angular/core';
import {DisplaySettingsApi, DisplaySettingsMockApi} from './display-settings.mock';

export function provideMocks(): Provider[] {
  return [
    {provide: DisplaySettingsApi, useClass: DisplaySettingsMockApi},
  ];
}
