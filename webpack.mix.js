const mix = require('laravel-mix');

require('laravel-mix-tailwind');
//require('laravel-mix-purgecss');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.js('src/assets/js/app.js', 'src/dashboard/assets/js')
   .sass('src/assets/sass/app.scss', 'src/dashboard/assets/css')
   .tailwind('./tailwind.config.js');

// if (mix.inProduction()) {
//   mix
//    .version()
//    .purgeCss();
// }
