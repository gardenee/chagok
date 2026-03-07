/** @type {import('tailwindcss').Config} */

// bg → cream | text → black-soft | 강조 → brown | primary/CTA → butter(=primary)
const palette = {
	butter: {
		lighter: "#FEF3C7",
		light: "#FCE89E",
		DEFAULT: "#FAD97A",
		dark: "#E8BF50",
		darker: "#C9A030",
	},
	brown: {
		light: "#A88459",
		DEFAULT: "#7B5E3A",
		dark: "#573F25",
		darker: "#3A2918",
	},
	cream: {
		light: "#FFFFFF",
		DEFAULT: "#FEFCF5",
		dark: "#F0E8D0",
	},
	peach: {
		light: "#FDE0D7",
		DEFAULT: "#F7B8A0",
		dark: "#EE9070",
	},
	lavender: {
		light: "#EBE4F8",
		DEFAULT: "#D4C5F0",
		dark: "#B8A5E3",
	},
	black: {
		DEFAULT: "#000000",
		warm: "#1A1208",
		soft: "#1A1A1A",
	},
};

module.exports = {
	content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: {
				...palette,
				primary: palette.butter,
			},
			fontFamily: {
				"ibm-bold": ["IBMPlexSansKR-Bold"],
				"ibm-semibold": ["IBMPlexSansKR-SemiBold"],
				"ibm-regular": ["IBMPlexSansKR-Regular"],
			},
		},
	},
	plugins: [],
};
