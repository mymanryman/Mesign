import { describe, expect, it } from 'vitest';
import { chooseSigns, parseCategoryPage, parseSignPage } from './lexicon.mjs';

const categoryHtml = `
<table>
  <tr><td><a href="/ord/00257"><div class="badge"> 1</div><img src="/photos/00/barn-00257-photo-1-small.jpg"></a></td>
      <td><a href="https://teckensprakslexikon.su.se/ord/00257">barn <span>1 varianter finns</span></a></td>
      <td><a href="/kategori/familj">Familj</a></td><td>549</td></tr>
  <tr><td><a href="/ord/00111">dotter</a></td></tr>
  <tr><td><a href="/ord/01943">dotter</a></td></tr>
  <tr><td><a class="ord" href="/ord/03563"><strong>bror</strong></a></td></tr>
  <tr><td><a href="/ord/09999">f&ouml;r&auml;ldrar</a></td></tr>
  <tr><td><a href="/ord/00188">mamma, mor, morsa, moder<br><small>2 varianter finns</small></a></td></tr>
</table>`;

describe('parseCategoryPage', () => {
  it('hittar tecknen och hoppar över bildlänkar med variantbricka och dubbletter', () => {
    expect(parseCategoryPage(categoryHtml)).toEqual([
      { id: '00257', word: 'barn', synonyms: [] },
      { id: '00111', word: 'dotter', synonyms: [] },
      { id: '01943', word: 'dotter', synonyms: [] },
      { id: '03563', word: 'bror', synonyms: [] },
      { id: '09999', word: 'föräldrar', synonyms: [] },
      { id: '00188', word: 'mamma', synonyms: ['mor', 'morsa', 'moder'] },
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
    const chosen = chooseSigns(listed, ['bror', 'katt', 'dotter'], 3);
    expect(chosen.map((s: { id: string }) => s.id)).toEqual(['03563', '00111', '00257']);
  });
  it('hittar önskade ord bland synonymerna', () => {
    const chosen = chooseSigns(parseCategoryPage(categoryHtml), ['mor'], 1);
    expect(chosen.map((s: { id: string }) => s.id)).toEqual(['00188']);
  });
});
