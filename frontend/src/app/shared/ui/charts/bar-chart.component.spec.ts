import {niceStep} from './bar-chart.component';

describe('niceStep', () => {
  it('picks a round step so four ticks cover the highest bar', () => {
    expect(niceStep(3800)).toBe(1000);
    expect(niceStep(9000)).toBe(2500);
    expect(niceStep(150)).toBe(50);
  });

  it('never uses fractional steps', () => {
    //an empty period: the highest bar is the minimum of 1
    expect(niceStep(1)).toBe(1);
    expect(niceStep(10)).toBe(5);
  });
});
