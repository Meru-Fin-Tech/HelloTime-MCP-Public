import { ABOUT_MARKDOWN, CHANGELOG } from '../data/about.js';

export interface ResourceDescriptor {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const RESOURCES: ResourceDescriptor[] = [
  {
    uri: 'hellotime://about',
    name: 'About HelloTime',
    description: 'Markdown product summary covering features, plans, integrations, and supported markets.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'hellotime://changelog',
    name: 'HelloTime Changelog',
    description: 'Last 50 release notes (features, fixes, compliance updates).',
    mimeType: 'application/json',
  },
];

export function readResource(uri: string): { contents: { uri: string; mimeType: string; text: string }[] } {
  if (uri === 'hellotime://about') {
    return {
      contents: [{ uri, mimeType: 'text/markdown', text: ABOUT_MARKDOWN }],
    };
  }
  if (uri === 'hellotime://changelog') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            { count: CHANGELOG.length, entries: CHANGELOG },
            null,
            2,
          ),
        },
      ],
    };
  }
  throw new Error(`Unknown resource URI: ${uri}`);
}
