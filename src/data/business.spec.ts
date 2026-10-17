import { BUSINESS, openingHoursLabel } from './business';

describe('business data', () => {
  it('formats the current opening hours as Bulgarian copy', () => {
    expect(openingHoursLabel()).toBe('всеки ден от 9:00 до 18:00');
  });

  it('lists partial weeks by day', () => {
    expect(openingHoursLabel([
      { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' },
      { days: ['Saturday'], opens: '10:00', closes: '14:00' }
    ])).toBe('пон.–пет. от 9:00 до 18:00; съб. от 10:00 до 14:00');
  });

  it('keeps the identity the map listing uses', () => {
    expect(BUSINESS.name).toBe('3dpechat');
    expect(BUSINESS.technologies).toEqual(['FDM']);
    expect(BUSINESS.displayAddress).toContain('1700 София');
  });
});
