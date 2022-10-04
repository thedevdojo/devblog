const fs = require('fs-extra');
const request = require('superagent');
const globalModulesPath = require("global-modules-path");
const vikingNewFolder = globalModulesPath.getPath("viking") + '/src/site/';
const process = require('process');
const admZip = require('adm-zip');

const themeName = 'harold';
const href = `https://github.com/vikingcms/${themeName}/archive`;
const zipFile = 'master.zip';

const themeSource = `${href}/${zipFile}`;

module.exports = {
    welcome() {
        console.log('Welcome to Viking');
    },
    createFolder(folderName) {
        console.log('creating new folder ' + folderName);
        fs.mkdir('./' + folderName , { recursive: true }, (err) => {
            if (err) throw err;
          });
    },
    newProject(folderName) {
        console.log('Welcome Viking!');
        console.log('Generating your new site inside ' + folderName + ' folder.');
        fs.mkdirSync('./' + folderName , { recursive: true });
        fs.copySync(vikingNewFolder, './' + folderName);

        process.chdir(process.cwd() + '/' + folderName);
        console.log('Downloading default theme for your site');
        request
            .get(themeSource)
            .on('error', function(error) {
                console.log(error);
            })
            .pipe(fs.createWriteStream(zipFile))
            .on('finish', function() {
                console.log('Finished Downloading Theme');
                var zip = new admZip(zipFile);
                console.log('Extracting Theme Zip File');
                zip.extractEntryTo(`${themeName}-master/`, `./content/themes/${themeName}/`, false, true);
                console.log('Finished Unzipping');

                fs.unlinkSync(`./${zipFile}`);

                var serve = require(require("global-modules-path").getPath("viking") + '/src/cli/serve.js');

                console.log('Prepare your Hammer and Axe!')
                console.log('Because it\'s time to start building...');

                serve.launch();

            });
    }
}
