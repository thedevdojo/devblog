const getPort = require('get-port');
const fs = require('fs-extra');
const globalModulesPath = require("global-modules-path");
const folder = require(globalModulesPath.getPath("viking") + '/src/lib/folder.js');
const watch = require('node-watch');
const settings = require(folder.devblogPath() + '/src/lib/settings.js');

let watcher = '';

const self = module.exports = {
    getDateString(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth()+1).padStart(2, 0);
        const day = String(d.getDate()).padStart(2, 0);
    
        const hour = String(d.getHours()).padStart(2, 0);
        const minute = String(d.getMinutes()).padStart(2, 0);
        const second = String(d.getSeconds()).padStart(2, 0);
    
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    },

    async getRandomPort(preferredPort = 8000) {
        const port = await getPort({ port: preferredPort });
        return port;
    },

    consoleLog(io, message){
        var date = new Date();
        let timestamp = '<span class="text-green-500">[' + self.getDateString(date) + ']</span> ';

        if(message != '[CLOSE_VIKING_CONSOLE]'){
            message = timestamp + message;
        }

        message = '<span>' + message + '</span>';

        io.emit('console', { message: message });

        //return message;

        //fs.appendFile( folder.contentPath() + '/logs/viking.log', message + '\n');
    },

    devMode(io){
        if( settings.load().environment.dev ){
            self.watch(io);
        }

        io.on('connection', function(socket){
            socket.on('devOn', function(msg){
                console.log('on dev');
                self.watch(io);
            });
            socket.on('devOff', function(){
                console.log('off dev');
                self.watchClose();
            });
        });
    },

    watch(io){
        let builder = require(folder.devblogPath() + 'src/lib/builder.js');
        console.log('and hit here');
        self.consoleLog(io, '<span class="text-purple-500">Watching for changes inside: </span>' + folder.sitePath());
        watcher = watch(folder.contentPath(), { recursive: true }, function(evt, name) {
             self.consoleLog(io, '<span class="text-teal-500">' + name + ' changed. Executing Build Process.</span>');
             builder.build(io);
             io.emit('reload', { reload: true });
             console.log('changed abc abc');
        });
    },

    watchClose(){
        watcher.close();
    }


}