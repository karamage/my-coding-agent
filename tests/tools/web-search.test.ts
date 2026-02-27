import { webSearch } from '../../src/tools/web-search';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeHtmlResponse(results: { url: string; title: string; snippet: string }[]): string {
  return results
    .map(
      (r) =>
        `<a rel="nofollow" class="result__a" href="${r.url}">${r.title}</a>` +
        `<a class="result__snippet">${r.snippet}</a>`
    )
    .join('\n');
}

describe('webSearch', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns formatted results on success', async () => {
    const html = makeHtmlResponse([
      { url: 'https://example.com', title: 'Example Site', snippet: 'An example website.' },
      { url: 'https://foo.org', title: 'Foo Org', snippet: 'Foo description.' },
    ]);
    mockFetch.mockResolvedValue({ ok: true, text: async () => html });

    const result = await webSearch('test query', 5);

    expect(result.success).toBe(true);
    expect(result.output).toContain('Web Search Results for: "test query"');
    expect(result.output).toContain('[1] Example Site');
    expect(result.output).toContain('URL: https://example.com');
    expect(result.output).toContain('Snippet: An example website.');
    expect(result.output).toContain('[2] Foo Org');
    expect(result.output).toContain('URL: https://foo.org');
  });

  it('returns no results message when HTML has no matches', async () => {
    mockFetch.mockResolvedValue({ ok: true, text: async () => '<html><body>No results</body></html>' });

    const result = await webSearch('nothing here');

    expect(result.success).toBe(true);
    expect(result.output).toBe('No results found for: "nothing here"');
  });

  it('returns error on HTTP failure', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

    const result = await webSearch('query');

    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
    expect(result.error).toContain('Internal Server Error');
  });

  it('returns error when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network unreachable'));

    const result = await webSearch('query');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network unreachable');
  });

  it('strips HTML tags from title and snippet', async () => {
    const html =
      '<a rel="nofollow" class="result__a" href="https://x.com"><b>Bold Title</b></a>' +
      '<a class="result__snippet"><em>italic</em> snippet</a>';
    mockFetch.mockResolvedValue({ ok: true, text: async () => html });

    const result = await webSearch('html entities');

    expect(result.success).toBe(true);
    expect(result.output).toContain('Bold Title');
    expect(result.output).not.toContain('<b>');
    expect(result.output).toContain('italic snippet');
    expect(result.output).not.toContain('<em>');
  });

  it('decodes HTML entities in snippet', async () => {
    const html =
      '<a rel="nofollow" class="result__a" href="https://x.com">Title</a>' +
      '<a class="result__snippet">A &amp; B &lt;tag&gt; &quot;quoted&quot;</a>';
    mockFetch.mockResolvedValue({ ok: true, text: async () => html });

    const result = await webSearch('entities');

    expect(result.success).toBe(true);
    expect(result.output).toContain('A & B <tag> "quoted"');
  });

  it('limits results to max_results', async () => {
    const html = makeHtmlResponse([
      { url: 'https://a.com', title: 'A', snippet: 'snap a' },
      { url: 'https://b.com', title: 'B', snippet: 'snap b' },
      { url: 'https://c.com', title: 'C', snippet: 'snap c' },
    ]);
    mockFetch.mockResolvedValue({ ok: true, text: async () => html });

    const result = await webSearch('limit test', 2);

    expect(result.success).toBe(true);
    expect(result.output).toContain('[1] A');
    expect(result.output).toContain('[2] B');
    expect(result.output).not.toContain('[3] C');
  });

  it('uses default max_results of 5 when not specified', async () => {
    const items = Array.from({ length: 6 }, (_, i) => ({
      url: `https://site${i}.com`,
      title: `Site ${i}`,
      snippet: `Snippet ${i}`,
    }));
    const html = makeHtmlResponse(items);
    mockFetch.mockResolvedValue({ ok: true, text: async () => html });

    const result = await webSearch('default limit');

    expect(result.success).toBe(true);
    expect(result.output).toContain('[5]');
    expect(result.output).not.toContain('[6]');
  });

  it('sends POST request to DuckDuckGo with encoded query', async () => {
    mockFetch.mockResolvedValue({ ok: true, text: async () => '' });

    await webSearch('hello world');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://html.duckduckgo.com/html/',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('hello%20world'),
      })
    );
  });

  it('handles result without snippet gracefully', async () => {
    const html = '<a rel="nofollow" class="result__a" href="https://example.com">Title Only</a>';
    mockFetch.mockResolvedValue({ ok: true, text: async () => html });

    const result = await webSearch('no snippet');

    expect(result.success).toBe(true);
    expect(result.output).toContain('[1] Title Only');
    expect(result.output).toContain('URL: https://example.com');
  });
});
