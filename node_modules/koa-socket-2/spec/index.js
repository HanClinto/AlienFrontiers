const path = require('path');
const minimist = require('minimist');
const glob = require('glob');

const argv = minimist( process.argv.slice( 2 ) );

argv._.forEach( file => {
  glob(`./${file}`, function (er, files) {
    for(let i in files) {
      require(path.resolve(files[i]));
    }
  });
});
