// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-preset-env': {
      browsers: 'last 2 versions, > 0.5%, not dead, IE 11',
    },
  },
};
