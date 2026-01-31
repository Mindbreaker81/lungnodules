const js = require("@eslint/js");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const nextPlugin = require("@next/eslint-plugin-next");

module.exports = [
	js.configs.recommended,
	...tsPlugin.configs["flat/recommended"],
	{
		files: ["**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 2020,
			sourceType: "module",
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
			"@next/next": nextPlugin,
		},
		rules: {
			...nextPlugin.configs["core-web-vitals"].rules,
			"no-console": ["warn", { allow: ["warn", "error"] }],
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
	{
		files: [
			"eslint.config.js",
			"jest.config.js",
			"postcss.config.js",
			"tailwind.config.js",
			"**/*.config.js",
		],
		languageOptions: {
			sourceType: "script",
			globals: {
				module: "readonly",
				require: "readonly",
				__dirname: "readonly",
				process: "readonly",
			},
		},
		rules: {
			"@typescript-eslint/no-require-imports": "off",
			"no-undef": "off",
		},
	},
	{
		files: ["**/__tests__/**/*.{js,jsx,ts,tsx}", "**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}", "**/test/**/*.{js,jsx,ts,tsx}"] ,
		rules: {
			"no-console": "off",
		},
	},
	{
		files: ["public/sw.js"],
		languageOptions: {
			globals: {
				self: "readonly",
				caches: "readonly",
				fetch: "readonly",
			},
		},
		rules: {
			"no-undef": "off",
		},
	},
	{
		ignores: [".next/", "node_modules/", "dist/"],
	},
];
