const fs = require('fs-extra');
const globalModulesPath = require("global-modules-path");
const folder = require(globalModulesPath.getPath("devblog") + '/src/lib/folder.js');

class Post{

    constructor(){
        this.loadPosts();
    }

    orderBy(key, order){
        this.loadPosts();
        // default to ASC order
        if(typeof(order) == 'undefined'){
            order = 'ASC';
        }

        if(order == 'ASC'){
            this.posts = this.posts.sort((a, b) => (a[key] > b[key]) ? 1 : -1);
        } else {
            this.posts = this.posts.sort((a, b) => (a[key] < b[key]) ? 1 : -1);
        }
        return this;
    }

    loadPosts(){
        // if the posts path folder does not exist, create it
        if (!fs.existsSync(folder.postPath())){
            fs.mkdirSync(folder.postPath(), { recursive: true });
        }

        this.posts = [];
        let postFiles = fs.readdirSync( folder.postPath() )

        let self = this;
        postFiles.forEach(function (postFile, index) {
            self.posts.push( fs.readJSONSync( folder.postPath() + postFile ) );
        });
    }

    getPosts(){
        this.posts.forEach(function (post, index) {
            if(typeof post !== 'undefined' && typeof post.meta !== 'undefined' && typeof post.meta.data !== 'undefined'){
                if(post.meta.data){
                    post.meta.data = JSON.parse(post.meta.data);
                }
            }
        });
        return this.posts;
    }

}

module.exports = Post;