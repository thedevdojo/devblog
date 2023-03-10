const path = require('path');
const fs = require('fs-extra');
// In newer Node.js versions where process is already global this isn't necessary.
const process = require("process");
const slugify = require('slugify');
const dateFormat = require('dateformat');
const sizeOf = require('image-size');
const minify = require('html-minifier').minify;
const globalModulesPath = require("global-modules-path");

const folder = require(globalModulesPath.getPath("devblog") + '/src/lib/folder.js');
const settings = require(folder.devblogPath() + '/src/lib/settings.js').load();
const Post = require(folder.devblogPath() + 'src/lib/post.js');

const helper = require(folder.devblogPath() + 'src/lib/helper.js');

const post = new Post();
const themePath = folder.themePath() + settings.theme.active + '/';

let siteMapContents = '';
let onlyOnce = false;

let totalPages = 0;
let builtPages = 0;

const builder = module.exports = {
    build(io) {
        
        helper.consoleLog(io, '<span class="text-yellow-500">### Starting The Build Process</span>');

        let posts = post.orderBy('created_at', 'DESC').getPosts();
        //io = ioInstance;

        totalPages = builder.getTotalPages(posts);

        // empty the site folder
        fs.emptyDirSync( folder.sitePath() );
        
        fs.readdir(themePath, function (err, files) {
            if (err) {
              console.error("Could not list the directory.", err);
              process.exit(1);
            }
          
            files.forEach(function (file, index) {

                if(index == 0){
                    builder.beginSitemap();
                }

                let extension = path.extname(file);
                if(typeof(extension) != 'undefined' && extension == '.axe'){

                    // if debug mode is on we will write all posts to a json file
                    if(settings.environment.dev){
                        fs.writeJsonSync( folder.sitePath() + '/posts.json', posts, { spaces: '\t' });
                    }

                    if(file == 'home.axe'){
                        builder.writeFile(file, '', {}, io);
                    }
                    
                    if(file == 'single.axe'){

                        posts.forEach(function (post, index) {
                            builder.writeFile(file, post.slug + '/', { post: post }, io);
                        });

                    }

                    if(file == 'amp.axe'){

                        posts.forEach(function (post, index) {
                            builder.writeFile(file, '/amp/' + post.slug + '/', { post: post }, io);
                        });

                    }

                    if(file == 'loop.axe'){
                        builder.writeFile(file, settings.site.loopRoute + '/', {}, io);
                    }
                    

                    // copy over all the assets
                    fs.copySync(themePath + '/site/', folder.sitePath());
                    // copy over all the images
                    fs.copySync(folder.imagePath(), folder.sitePath() + 'images/');

                    
                    

                }
                
            });
            builder.endSitemap();
            if( builder.isNotGithubURL() ){
                builder.createCNAME();
            }
            builder.addGitKeep();
        });

        return {'status' : 'success'};
    },

    isNotGithubURL: function(){
        if( settings.site.url.indexOf('github.io') == -1 && settings.site.url.indexOf('github.com') == -1 && settings.site.url.indexOf('github.page') == -1 ){
            return true;
        }
        return false;
    },

    getTotalPages(posts){
        // Multiply posts to include the amp pages
        totalPages = posts.length * 2;

        // Increase by 1 to get homepage
        totalPages += 1;

        return totalPages;
    },

    writeFile(file, directory, data, io) {

        builder.addToSitemap(file, directory, data);

        let contents = '';
        // turn into func used again below
        builder.replaceIncludes(file, function (contents){
            
                contents = builder.replaceTitle(contents, file, data );
                if(file == 'single.axe' || file == 'amp.axe'){
                    builder.replaceConditionals(contents, data, function (contents){
                        let amp = (file == 'amp.axe') ? true : false;
                        contents = builder.replacePostData( contents, data.post, amp);
                        contents = contents.replace('{{ meta_description }}', data.post.meta.description);
                        builder.minifyAndWrite(directory, contents, io);
                    });
                }
                if(file == 'home.axe'){
                    builder.replaceConditionals(contents, data, function (contents){
                        contents = contents.replace('{{ meta_description }}', settings.site.description);
                        builder.replacePostDataLoop(contents, function (contents){
                            builder.minifyAndWrite(directory, contents, io);
                        });
                    });
                }
                if(file == 'loop.axe'){
                    builder.replaceConditionals(contents, data, function (contents){
                        builder.replacePostDataLoop(contents, function (contents){
                            builder.minifyAndWrite(directory, contents, io);
                        });
                    });
                }
                
        });
        
    },

    minifyAndWrite(directory, contents, io) {

        contents = minify(contents, {
            removeComments: true,
            collapseWhitespace: true,
            collapseInlineTagWhitespace: true,
            minifyCSS: true,
            minifyJS: true
        });

        contents = contents.replace('{{ title }}', settings.site.title);
        contents = contents.replace(/\{\{ subfolder \}\}/g, settings.site.subfolder);
        contents = contents.replace(/\{\{ url \}\}/g, settings.site.url);
        contents = contents.replace('{{ currentURL }}', settings.site.url + '/' + directory);

        if(settings.environment.dev){
            contents = builder.addAdminBar(contents);
            contents = builder.addLiveReload(contents);
        }
        

        fs.outputFileSync(folder.sitePath() + directory + 'index.html', contents);

        directory = (directory == '') ? '/' : directory;
        helper.consoleLog(io, '<span class="text-blue-500">Built:</span> ' + directory);
        console.log('Built: ' + directory);

        if(builtPages >= totalPages){
            helper.consoleLog(io, '<span class="text-yellow-500">### Finished The Build Process</span>');
            helper.consoleLog(io, '[CLOSE_VIKING_CONSOLE]');
            builtPages = 0;
        } else {
            builtPages += 1;
        }
        

        // if(index >= 4){
        //     helper.consoleLog(io, '<span class="text-yellow-500">### Finished The Build Process</span>');
        //     console.log('Built: ' + file);
        //     helper.consoleLog(io, '[CLOSE_VIKING_CONSOLE] - index ' + 4);
        // }
    },

    beginSitemap() {
        siteMapContents = `<?xml version="1.0" encoding="UTF-8" ?>\n\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    },

    endSitemap() {
        siteMapContents += `\n\n</urlset>`;
        fs.writeFileSync(folder.sitePath() + 'sitemap.xml', siteMapContents);
    },

    addToSitemap(file, directory, data) {

        let urlStructure = `\n\t<url>\n\t\t<loc>{{ loc }}</loc>\n\t\t<lastmod>{{ lastmod }}</lastmod>\n\t\t<priority>{{ priority }}</priority>\n\t</url>`;

        //Check which file this is for
        if(file == 'home.axe'){
            urlStructure = urlStructure.replace('{{ loc }}', settings.site.url);
            urlStructure = urlStructure.replace('{{ lastmod }}', dateFormat(new Date(), "isoDateTime"));
            urlStructure = urlStructure.replace('{{ priority }}', '1.0');
        }

        if(file == 'loop.axe'){
            urlStructure = urlStructure.replace('{{ loc }}', settings.site.url + '/' + directory);
            urlStructure = urlStructure.replace('{{ lastmod }}', dateFormat(new Date(), "isoDateTime"));
            urlStructure = urlStructure.replace('{{ priority }}', '0.9');
        }

        if(file == 'single.axe'){
            urlStructure = urlStructure.replace('{{ loc }}', settings.site.url + '/' + directory);
            urlStructure = urlStructure.replace('{{ lastmod }}', dateFormat(new Date(data.post.updated_at), "isoDateTime"));
            urlStructure = urlStructure.replace('{{ priority }}', '0.9');
        }

        if(urlStructure.indexOf('{{ loc }}') == -1){

            siteMapContents += urlStructure;

        }
        
    },

    getPost(file) {
        return fs.readFileSync(file, 'utf8');
    },

    replaceConditionals(contents, data, _callback) {
        const conditionalTxt = '@if(';
        const endContiditionalTxt = '@endif';

        let startIndex = contents.indexOf(conditionalTxt);
        
        // check if Index is in loop
        const loopStartString = '@loop';
        const loopEndString = '@endloop';

        let loopStart = contents.indexOf( loopStartString );
        let loopEnd = contents.indexOf( loopEndString );

        if(startIndex > 0 && (startIndex < loopStart || startIndex > loopEnd) ){

            let post = data.post;

            let endOfCurLine = contents.indexOf('\n', startIndex);
            let endConditional = contents.lastIndexOf(')', endOfCurLine);
            let conditional = contents.substring(startIndex + conditionalTxt.length, endConditional);
            
            let BeginningOfEnd = contents.indexOf(endContiditionalTxt);


        let conditionalResult = false;
        eval('if( ' + conditional + '){ conditionalResult = true; }');

        let firstHalfOfContent = contents.slice(0, startIndex);
            try{
                // if it's try we only want to remove the conditional @if and leave the content inside
                if(conditionalResult){
                    // remove the @if() section
                    firstHalfOfContent = contents.slice(0, startIndex) + contents.slice(endConditional+1, BeginningOfEnd);
                }
            } catch (err){
                    firstHalfOfContent = contents.slice(0, startIndex);
            }
            let secondHalf = contents.slice(BeginningOfEnd + endContiditionalTxt.length, contents.length);
            contents = firstHalfOfContent + secondHalf;

            if(!onlyOnce){
                onlyOnce = true;
            }
        }

        let nextConditional = contents.indexOf(conditionalTxt);

        
        if(nextConditional > 0 && (nextConditional < loopStart || nextConditional > loopEnd) ){
            builder.replaceConditionals(contents, data, _callback);
        } else {
            _callback(contents);
        }
    },

    replaceIncludes(file, _callback) {
        let contents = fs.readFileSync(themePath + file, 'utf8');
        let include = contents.indexOf('@include', 0);

        while(include != -1){
            let endInclude = builder.endOfIncludeLocation(include, contents.substring(include, contents.length));
            let includeText = contents.substring(include, include+endInclude);
            let includeTemplate = includeText.split(" ");
            if(typeof(includeTemplate[1]) !== "undefined"){
                let allowedFileIncludes = ['.css', '.js', '.axe'];
                let partial = includeTemplate[1];
                let fileExt = path.extname(partial);
                if(allowedFileIncludes.includes( fileExt )){
                    // remove the extension
                    partial = partial.split('.').slice(0, -1).join('.');
                } else {
                    fileExt = '.axe';
                }
                includeTemplate = partial.replace(/\./g, '/') + fileExt;
                // fetch file contents and replace the template
                contents = contents.replace( includeText, fs.readFileSync( themePath + includeTemplate, 'utf8' ) );
            }
            include = contents.indexOf('@include', include+1);
        }

        _callback( contents );
    },

    replaceSettings(contents) {
        //let loadSettings = builder.loadSettingsFile();
        let settings = {
            "title": ""
        };

        contents = contents.replace('{{ title }}', settings.title);

        return contents;
    },

    replaceTitle(contents, file, data) {
        //let loadSettings = builder.loadSettingsFile();
        let settings = {
            "title": "Get Full Report",
            "description": "Background Checks, Phone Lookups, and People Search"
        };

        if(file == 'home.axe'){
            contents = contents.replace('{{ title }}', settings.title + ' - ' + settings.description);
        }

        if(file == 'loop.axe'){
            contents = contents.replace('{{ title }}', 'Background Check Guides - ' + settings.title);
        }

        if(file == 'single.axe'){
            contents = contents.replace('{{ title }}', data.post.title + ' - ' + settings.title);
        }

        return contents;
    },

    endOfIncludeLocation(start, str) {
        let endIncludeLocation = str.length;
        let nextSpaceIndex = str.indexOf(" ", 10);
        let nextNewLineIndex = str.indexOf("\n", 10);
        if(nextSpaceIndex != -1 && nextSpaceIndex <= nextNewLineIndex){
            endIncludeLocation = nextSpaceIndex;
        }
        if(nextNewLineIndex != -1 && nextNewLineIndex <= nextSpaceIndex){
            endIncludeLocation = nextNewLineIndex;
        }
        return endIncludeLocation;
    },

    replacePostData(contents, post, amp) {
        if(typeof amp == 'undefined'){
            amp = false;
        }
        for (var key in post) {
            if (post.hasOwnProperty(key)) {
                
                if(key == 'meta'){
                    for(meta_key in post.meta){
                        if (post.meta.hasOwnProperty(meta_key)) {
                            let replaceThis = '{{ post.meta.' + meta_key + ' }}';
                            let withThis = post.meta[meta_key];
                            
                            let regexReplaceThis = new RegExp(replaceThis, 'g');
                            contents = contents.replace(regexReplaceThis, withThis);
                        }
                    }
                } else {
                    let replaceThis = '{{ post.' + key + ' }}';
                    let withThis = post[key];
                    if(key == 'body'){
                        withThis = (amp) ? builder.renderAmp(post[key]) : builder.renderHTML(post[key]);
                    }
                    if(key == 'created_at'){
                        withThis = dateFormat( post[key], "mmmm d, yyyy");
                    }
                    let regexReplaceThis = new RegExp(replaceThis, 'g');
                    contents = contents.replace(regexReplaceThis, withThis);
                }
            }
        }
        return contents;
    },

    replacePostDataLoop(contents, _callback) {
        let posts = post.orderBy('created_at', 'DESC').getPosts();
        
        const loopStartString = '@loop';
        const loopEndString = '@endloop';

        let loopStart = contents.indexOf( loopStartString );
        let loopEnd = contents.indexOf( loopEndString );

        if(loopStart !== -1){
            let topHTML = contents.slice(0, loopStart);
            let loopHTML = contents.slice( loopStart + loopStartString.length, loopEnd );
            let bottomHTML = contents.slice(loopEnd + loopEndString.length, contents.length);

            let loopContent = '';

            posts.forEach(function (post, index){
                console.log('post title is: ' + post.title);
                if( typeof post.type !== 'undefined' && post.type == 'page'){
                    // ignoring type of `pages` in the loop
                    console.log('and post type is ' + post.type);
                } else {
                    builder.replaceConditionals(loopHTML, {post: post}, function (contents){
                        loopContent += builder.replacePostData( contents, post );
                    });
                }
            });

            // insert loop content between top and bottom half of file
            contents = topHTML + loopContent.trim() + bottomHTML;
        }

        // return updated contents
        _callback(contents);
    },

    checkIfIndexInLoop(contents, index, _callback) {
        const loopStartString = '@loop';
        const loopEndString = '@endloop';

        let loopStart = contents.indexOf( loopStartString );
        let loopEnd = contents.indexOf( loopEndString );

        if(index > loopStart && index < loopEnd){
            _callback( true );
        } else {
            _callback( false );
       }
        
    },

    renderHTML(data) {
        let result = ``;
        for (let block of data.blocks) {
          switch (block.type) {
            case 'paragraph':
              result += `<p>${block.data.text}</p>`;
              break;
            case 'header':
              result += `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
              if(block.data.level == 2){
                  result = result.replace('<h2>', '<h2 id="' + slugify(block.data.text, { remove: /[^\w\s]/gi, lower:true}) + '">');
              }
              break;
            case 'list':
                if(block.data.style == 'ordered'){
                    result += `<ol>`;
                } else {
                    result += `<ul>`;
                }
                for(var i=0; i<block.data.items.length; i++){
                    result += `<li>` + block.data.items[i] + `</li>`;
                }
                if(block.data.style == 'ordered'){
                    result += `</ol>`;
                } else {
                    result += `</ul>`;
                }
              break;
            case 'image':
                result += `<img src="${block.data.file.url}" alt="${block.data.file.caption}" class="w-full">`;
                break;
            case 'quote':
                result += `<blockquote>${block.data.text}</blockquote>`;
                break;
          }
        }
        return result;
    },

    renderAmp(data) {
        let result = ``;
        for (let block of data.blocks) {
          switch (block.type) {
            case 'paragraph':
              result += `<p>${block.data.text}</p>`;
              break;
            case 'header':
              result += `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
              if(block.data.level == 2){
                  result = result.replace('<h2>', '<h2 id="' + slugify(block.data.text, { remove: /[^\w\s]/gi, lower:true}) + '">');
              }
              break;
            case 'list':
                if(block.data.style == 'ordered'){
                    result += `<ol>`;
                } else {
                    result += `<ul>`;
                }
                for(var i=0; i<block.data.items.length; i++){
                    result += `<li>` + block.data.items[i] + `</li>`;
                }
                if(block.data.style == 'ordered'){
                    result += `</ol>`;
                } else {
                    result += `</ul>`;
                }
              break;
            case 'image':
                    let imagePath = folder.contentPath() + block.data.file.url;
                    if (fs.existsSync(imagePath)) {
                        var size = sizeOf(folder.contentPath() + block.data.file.url);
                        result += `<amp-img layout="responsive" src="${block.data.file.url}" width="${size.width}" height="${size.height}"></amp-img>`;
                    }
                
                break;
          }
        }
        return result;
    },

    createCNAME() {
        let domain = settings.site.url.replace('https://', '').replace('http://', '');
        fs.outputFileSync(folder.sitePath() + 'CNAME', domain);
    },

    addGitKeep() {
        // adding the .gitkeep to the folder will allow the empty site folder to remain in the repo
        fs.outputFileSync(folder.sitePath() + '.gitkeep', '');
    },

    addAdminBar(contents) {
        return contents.replace('</body>', builder.adminBarHTML() + '</body>');
    },

    adminBarHTML() {
        return `<a href="/dashboard" style="background-color: #000; z-index: 50; width: 2.5rem; left: 0; bottom:0; position: fixed; height: 2.5rem; -webkit-box-pack: justify; justify-content: space-between; -webkit-box-align: center; align-items: center; display: -webkit-box; display: flex; box-sizing: border-box; border-width:0px;">
                    <svg class="w-4 h-4 ml-3 h-auto" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M0 3h2.5v2.5H0zM3 3h2.5v2.5H3zM3 0h2.5v2.5H3z"/></svg>
                </a>`;
    },

    addLiveReload(contents){
        return contents.replace('</body>', builder.liveReloadScript() + '</body>');
    },

    liveReloadScript() {
        return `<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js"></script>
                <script>
                var socket = io.connect('${settings.site.url}');
                socket.on('reload', function(data){
                    location.reload();
                });
                </script>`;
    }
};