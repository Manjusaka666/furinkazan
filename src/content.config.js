import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const culture = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/culture' }),
  schema: z.object({
    title: z.string(),
    ja: z.string(),
    cat: z.enum(['history', 'literature', 'aesthetics', 'tradition', 'food', 'wakan', 'sengoku']),
    order: z.number(),
    summary: z.string(),
    art: z.string().optional(),
    art2: z.string().optional(),
    sources: z.array(z.object({ t: z.string(), u: z.string().url() })).min(1),
  }),
});

export const collections = { culture };
