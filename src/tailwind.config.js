// tailwind.config.js
module.exports = {
    // ... other configurations
    theme: {
        extend: {
            // ... other extensions
        },
    },
    plugins: [
        function ({ addUtilities }) {
            const newUtilities = {
                '.text-outline-2': {
                    '-webkit-text-stroke': '2px black', // Adjust width and color as needed
                    'text-stroke': '2px black', // For broader browser support
                },
                '.text-outline-4': {
                    '-webkit-text-stroke': '4px black',
                    'text-stroke': '4px black',
                },
                // Add more outline sizes/colors as needed
            };
            addUtilities(newUtilities, ['responsive', 'hover']); // Apply to responsive and hover variants
        },
    ],
};