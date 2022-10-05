module.exports = {
    content: [
        './src/dashboard/**/*.{html,js,ejs}',
        './src/dashboard/*.{html,js,ejs}'
    ],
    theme: {
        extend: {}
    },
    variants: {
        borderColor: ['responsive', 'hover', 'focus', 'group-hover'],
        textColor: ['group-hover']
    },
    plugins: []
}