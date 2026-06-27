import { describe, expect, it } from 'vitest';
import { deriveCityLocation, normalizeKeywords } from './keywords.js';

describe('normalizeKeywords', () => {
  it('creates near_me and city variants per service', () => {
    const keywords = normalizeKeywords(['Burger', 'Craft Beer'], 'Tacoma');
    expect(keywords).toHaveLength(4);
    expect(keywords[0]).toEqual({
      keyword: 'burger near me',
      service: 'burger',
      type: 'near_me',
    });
    expect(keywords[1]).toEqual({
      keyword: 'burger tacoma',
      service: 'burger',
      type: 'city',
    });
    expect(keywords[2].type).toBe('near_me');
    expect(keywords[3].type).toBe('city');
  });

  it('omits city variants when city is empty', () => {
    const keywords = normalizeKeywords(['pizza'], '');
    expect(keywords).toHaveLength(1);
    expect(keywords[0].keyword).toBe('pizza near me');
  });

  it('derives full city keyword suffix from address', () => {
    const { display, keywordSuffix } = deriveCityLocation(
      '747 Main St, Roseville, CA 95747',
      'Roseville',
    );
    expect(display).toBe('Roseville CA 95747');
    expect(keywordSuffix).toBe('roseville ca 95747');
    const keywords = normalizeKeywords(['burgers'], keywordSuffix);
    expect(keywords[1]?.keyword).toBe('burgers roseville ca 95747');
  });
});
