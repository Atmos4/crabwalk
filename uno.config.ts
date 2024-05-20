import { defineConfig } from 'unocss';
import extractorSvelte from '@unocss/extractor-svelte';
import { presetUno } from 'unocss';

export default defineConfig({
	extractors: [extractorSvelte()],
	presets: [presetUno()]
});
