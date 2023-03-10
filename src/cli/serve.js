const express = require('express');
const app = express();
const session = require('express-session');
var http = require('http').createServer(app);
var io = require('socket.io')(http, {
    pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false
});

const open = require('open');
const bodyParser = require('body-parser');
const globalModulesPath = require("global-modules-path");

const folder = require(globalModulesPath.getPath("devblog") + '/src/lib/folder.js');
const routes = require(folder.devblogPath() + 'src/lib/routes.js');
const helper = require(folder.devblogPath() + 'src/lib/helper.js');

let notificationShown = 0;

module.exports = {
    launch() {
        helper.getRandomPort(8080).then(function(port) {
            
            app.set('view engine', 'ejs');
            app.use('/dashboard/assets', express.static(folder.devblogPath() + 'src/dashboard/assets'));
            
            app.use('/images/', express.static(folder.imagePath()));
            app.use('/content/', express.static(folder.contentPath()));
            app.use('/', express.static( folder.sitePath() ));
            //app.use(express.json());
            app.use(express.json({limit: '10mb'}));
            app.use(express.urlencoded({ extended: true }));
            app.use(bodyParser.urlencoded({ extended: true }));
            app.use(session({secret:'QLZNQn1I1P'}));

            // notification functionality middleware
            app.use(function (req, res, next) {
                if(req.session.notification && req.session.notification_type){
                    if(notificationShown){
                        req.session.notification = '';
                        req.session.notification_type = '';
                        notificationShown = 0;
                    }
                    notificationShown = 1;
                }
                next()
              });

            routes.load(app, io);

            http.listen(port, () => console.log(`Devblog is running on port ${port}!`))
            
            open('http://localhost:' + port + '/dashboard');
              helper.devMode(io);
        });

    }
}
