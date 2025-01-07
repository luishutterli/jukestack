/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			colors: {
				text: "#06131c",
				background: "#edf7fd",
				primary: "#2786ec",
				secondary: "#af8be5",
				accent: "#b469dd",
			},
		},
	},
	plugins: [],
};
