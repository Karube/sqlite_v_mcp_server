import { chunkText } from '../src/modules/chunker';

describe('Text Chunker', () => {
  test('should handle empty text', () => {
    const result = chunkText('');
    expect(result).toEqual([]);
  });

  test('should handle short text (under chunk size)', () => {
    const text = 'This is a short text.';
    const result = chunkText(text);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      text: 'This is a short text.',
      index: 0
    });
  });

  test('should chunk long text properly', () => {
    // Create text longer than default chunk size (700 chars)
    const longText = 'A'.repeat(1000);
    const result = chunkText(longText);
    
    expect(result.length).toBeGreaterThan(1);
    expect(result[0].index).toBe(0);
    expect(result[1].index).toBe(1);
  });

  test('should break at sentence boundaries for Japanese text', () => {
    const japaneseText = 'これは最初の文です。' + 'B'.repeat(700) + 'これは二番目の文です。';
    const result = chunkText(japaneseText);
    
    expect(result.length).toBeGreaterThan(1);
    expect(result[0].text).toContain('これは最初の文です。');
  });

  test('should normalize whitespace', () => {
    const textWithSpaces = 'This   has    multiple     spaces.';
    const result = chunkText(textWithSpaces);
    
    expect(result[0].text).toBe('This has multiple spaces.');
  });
});