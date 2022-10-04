/**
 * ----------------------------------------------------------------------
 * Folder Locations
 * ----------------------------------------------------------------------
 * The folder directories and paths needed for Viking CMS, use as follows:
 * 
 * folder.root()        Root directory of the current project (ex. './')
 * folder.rootPath()    Root path to the current project (ex. '/Users/John/sites/website/')
 * folder.content()     Content directory
 * folder.contentPath() Content path
 * folder.image()       Image directory
 * folder.imagePath()   Image path
 * folder.post()        Post directory
 * folder.postPath()    Post path
 * folder.theme()       Theme directory
 * folder.themePath()   Theme path
 * folder.site()        Site directory
 * folder.sitePath()    Site path
 * folder.devblogPath()  Viking path
 * folder.defaultSettings() Viking default settings location
 */

const globalModulesPath = require("global-modules-path");

const contentFolder = 'content/';
const imageFolder = 'images/';
const postFolder = 'posts/json/';
const siteFolder = 'site/';
const themeFolder = 'themes/';
const settingsFolder = 'settings/';

const folder = module.exports = {
    root() {
        return './';
    },
    rootPath() {
        return process.cwd() + '/';
    },
    content() {
        return folder.root() + contentFolder;
    },
    contentPath() {
        return folder.rootPath() + contentFolder;
    },
    image() {
        return folder.content() + imageFolder;
    },
    imagePath() {
        return folder.contentPath() + imageFolder;
    },
    post() {
        return folder.content() + postFolder;
    },
    postPath() {
        return folder.contentPath() + postFolder;
    },
    theme() {
        return folder.content() + themeFolder;
    },
    themePath() {
        return folder.contentPath() + themeFolder;
    },
    site() {
        return folder.root() + siteFolder;
    },
    sitePath() {
        return folder.rootPath() + siteFolder;
    },
    settings() {
        return folder.root() + settingsFolder;
    },
    settingsPath() {
        return folder.rootPath() + settingsFolder;
    },
    devblogPath() {
        return globalModulesPath.getPath("devblog") + '/';
    },
    defaultSettings() {
        return folder.devblogPath() + 'src/site/settings/';
    }
}