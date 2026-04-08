import { preprocessMeltUI, sequence } from '@melt-ui/pp';
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const origin = process.env.ORIGINS || process.env.ORIGIN;

/** @type {import('@sveltejs/kit').Config}*/
const config = {
  preprocess: sequence([vitePreprocess(), preprocessMeltUI()]),
  kit: {
    adapter: adapter({
      includeFiles: [
        'node_modules/geo-tz/data/timezones-1970.geojson.geo.dat',
        'node_modules/geo-tz/data/timezones-1970.geojson.index.json',
        'node_modules/geo-tz/data/timezones-now.geojson.geo.dat',
        'node_modules/geo-tz/data/timezones-now.geojson.index.json',
        'node_modules/geo-tz/data/timezones.geojson.geo.dat',
        'node_modules/geo-tz/data/timezones.geojson.index.json',
      ],
    }),
    version: { name: process.env.npm_package_version },
    csrf: {
      trustedOrigins: origin?.split(',').map((o) => o.trim()) ?? [],
    },
  },
};
export default config;
