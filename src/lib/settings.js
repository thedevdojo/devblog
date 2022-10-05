const fs = require('fs-extra');
const globalModulesPath = require("global-modules-path");
const folder = require(globalModulesPath.getPath("devblog") + '/src/lib/folder.js');

const self = module.exports = {
    
    load() {

        self.createSettingsFolderIfItDoesNotExist();
console.log(folder.settingsPath());
        let settings = fs.readdirSync( folder.settingsPath() );
        let settingsArr = [];
        for(var i=0; i<settings.length; ++i){
            let settingKey = settings[i].replace('.json', '');
            settingsArr[settingKey] = self.loadSetting(settingKey);
        }
        console.log(settingsArr);
        return Object.assign({}, settingsArr);
    },

    loadSetting(name) {

        try{
            return fs.readJsonSync( folder.settings() + name + '.json');
            console.log('reading settings from ' + folder.settings());
        } catch (err){
            self.createSettingsFolderIfItDoesNotExist();

            let defaultSettings = fs.readJsonSync( folder.defaultSettings() + name + '.json');
            fs.outputJsonSync(folder.settings() + name + '.json', defaultSettings);
            return fs.readJsonSync( folder.settings() + name + '.json');
        }
    },

    createSettingsFolderIfItDoesNotExist() {
        // if settings folder does not exist, create it
        if (!fs.existsSync(folder.settings())){
            fs.mkdirSync(folder.settings(), { recursive: true });
        }
    },

    updateOption(name, key, value) {
        
        try{
            data = fs.readJsonSync( folder.settings() + name + '.json');
        } catch (err){
            var data = fs.readJsonSync( folder.defaultSettings() + name + '.json');
        }

        data[key] = value;

        self.update(name, data);
    },

    update(name, data) {
        fs.outputJsonSync(folder.settings() + name + '.json', data);
    }
}
