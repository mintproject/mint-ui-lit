import prod from './prod.config';
import dev  from './dev.config';
import webpack from 'webpack';

let config: webpack.Configuration;

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("TRAVIS_BRANCH:", process.env.TRAVIS_BRANCH);

if (process.env.NODE_ENV === "production" || process.env.TRAVIS_BRANCH == 'master') {
    config = prod;
} else {
    config = dev;
}
webpack(config).run((err, stats) => { // Stats Object
  // ...
});
