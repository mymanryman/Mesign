import { describe, expect, it } from 'vitest';
import { classifySwipe } from './swipe';

describe('classifySwipe', () => {
  it('känner igen svajp åt vänster och höger', () => {
    expect(classifySwipe(-80, 5)).toBe('left');
    expect(classifySwipe(120, -20)).toBe('right');
  });
  it('ignorerar korta rörelser', () => {
    expect(classifySwipe(-30, 0)).toBeNull();
  });
  it('ignorerar rörelser som mest går uppåt eller nedåt', () => {
    expect(classifySwipe(-60, 90)).toBeNull();
  });
});
