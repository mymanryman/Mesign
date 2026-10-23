import { describe, expect, it } from 'vitest';
import { chooseSigns, parseCategoryPage, parseSignPage } from './lexicon.mjs';

const categoryHtml = `
<table>
  <tr><td><a href="/ord/00257"><img src="/photos/00/barn-00257-photo-1-small.jpg"></a></td>
      <td><a href="https://teckensprakslexikon.su.se/ord/00257">barn</a> <span>1 varianter finns</span></td>
      <td><a href="/kategori/familj">Familj</a></td><td>549</td></tr>
  <tr><td><a href="/ord/00111">dotter</a></td></tr>
  <tr><td><a href="/ord/01943">dotter</a></td></tr>
  <tr><td><a class="ord" href="/ord/03563"><strong>bror</strong></a></td></tr>
  <tr><td><a href="/ord/09999">f&ouml;r&auml;ldrar</a></td></tr>
</table>`;

describe('parseCategoryPage', () => {
  it('hittar tecknen och hoppar över bildlänkar och dubbletter', () => {
    expect(parseCategoryPage(categoryHtml)).toEqual([
      { id: '00257', word: 'barn' },
      { id: '00111', word: 'dotter' },
      { id: '01943', word: 'dotter' },
      { id: '03563', word: 'bror' },
      { id: '09999', word: 'föräldrar' },
    ]);
  });
});

describe('parseSignPage', () => {
  it('hittar tecknets video och stillbild', () => {
    const html = `<meta property="og:image" content="https://teckensprakslexikon.su.se/photos/41/kropp-41564-photo-1.jpg">
      <video><source src="/movies/41/kropp-41564-exempel-1.mp4"><source src="/movies/41/kropp-41564-tecken.mp4?v=2026-09-29"></video>`;
    expect(parseSignPage(html)).toEqual({
      video: 'https://teckensprakslexikon.su.se/movies/41/kropp-41564-tecken.mp4',
      poster: 'https://teckensprakslexikon.su.se/photos/41/kropp-41564-photo-1.jpg',
    });
  });
});

describe('chooseSigns', () => {
  it('tar önskade ord först, en variant per ord, och fyller på upp till taket', () => {
    const listed = parseCategoryPage(categoryHtml);
    const chosen = chooseSigns(listed, ['bror', 'mamma', 'dotter'], 3);
    expect(chosen.map((s: { id: string }) => s.id)).toEqual(['03563', '00111', '00257']);
  });
});
