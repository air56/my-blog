import { marked } from 'marked';
import type { Token, Tokens } from 'marked';
import { slugifyHeading } from './heading.js';

function headingSourceText(tokens: Token[]): string {
  return tokens
    .map((token) => ('text' in token ? token.text : token.raw))
    .join('');
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export function renderMarkdown(content: string): string {
  const usedIds = new Map<string, number>();
  const renderer = new marked.Renderer();

  renderer.heading = function heading(this: InstanceType<typeof marked.Renderer>, { tokens, depth }: Tokens.Heading): string {
    const renderedText = this.parser.parseInline(tokens);
    const baseId = slugifyHeading(headingSourceText(tokens));
    const count = usedIds.get(baseId) || 0;
    usedIds.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count}`;

    return `<h${depth} id="${escapeAttribute(id)}">${renderedText}</h${depth}>\n`;
  };

  return marked.parse(content, {
    async: false,
    gfm: true,
    breaks: false,
    renderer,
  });
}