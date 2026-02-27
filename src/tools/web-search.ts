import { ToolResult } from './types';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = [];

  const linkPattern = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetPattern = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  const links: { url: string; title: string }[] = [];
  const snippets: string[] = [];

  let match;
  while ((match = linkPattern.exec(html)) !== null && links.length < maxResults) {
    links.push({ url: match[1], title: stripHtml(match[2]) });
  }
  while ((match = snippetPattern.exec(html)) !== null && snippets.length < maxResults) {
    snippets.push(stripHtml(match[1]));
  }

  for (let i = 0; i < links.length; i++) {
    results.push({
      title: links[i].title,
      url: links[i].url,
      snippet: snippets[i] ?? '',
    });
  }

  return results;
}

export async function webSearch(query: string, maxResults = 5): Promise<ToolResult> {
  try {
    const response = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; coding-agent/1.0)',
      },
      body: `q=${encodeURIComponent(query)}&b=&kl=`,
    });

    if (!response.ok) {
      return {
        success: false,
        output: '',
        error: `Search request failed: ${response.status} ${response.statusText}`,
      };
    }

    const html = await response.text();
    const results = parseResults(html, maxResults);

    if (results.length === 0) {
      return { success: true, output: `No results found for: "${query}"` };
    }

    const lines: string[] = [
      `Web Search Results for: "${query}"`,
      `Found ${results.length} result${results.length === 1 ? '' : 's'}:`,
      '',
    ];

    results.forEach((result, index) => {
      lines.push(`[${index + 1}] ${result.title}`);
      lines.push(`URL: ${result.url}`);
      if (result.snippet) lines.push(`Snippet: ${result.snippet}`);
      lines.push('');
    });

    return { success: true, output: lines.join('\n') };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, output: '', error: `Web search failed: ${message}` };
  }
}
