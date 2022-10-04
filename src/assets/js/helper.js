let self;
import axios from 'axios';
import slugify from 'slugify';

let meta_schema = '';
if( document.getElementById('meta_schema') ){
    meta_schema = ace.edit('meta_schema', {
        mode: 'ace/mode/json',
        selectionStyle: 'text',
        showPrintMargin: false,
        theme: 'ace/theme/chrome'
    });
    meta_schema.getSession().setUseWorker(false);
    
}

let meta_data = '';
if( document.getElementById('meta_data') ){
    meta_data = ace.edit('meta_data', {
        mode: 'ace/mode/json',
        selectionStyle: 'text',
        showPrintMargin: false,
        theme: 'ace/theme/chrome'
    });
    meta_data.getSession().setUseWorker(false);
    
}

export default self = {
    
    createNotification(type, message) {
        let title = 'Notice';
        let color = 'gray';
        if (type == 'success') {
            title = 'Victory!';
            color = 'green';
        } else if (type == 'danger') {
            title = 'Dagummit!'
            color = 'red';
        } else if (type == 'info') {
            title = 'Goodaye!'
            color = 'indigo';
        } else if (type == 'warning') {
            title = 'Be Warned!'
            color = 'orange';
        }
        let dynamicElement = document.createElement('div');
        dynamicElement.innerHTML = self.notificationTemplate(type, message, title, color);
        document.body.appendChild(dynamicElement);
        document.getElementById('notification').addEventListener('click', function() {
            document.getElementById('notification').classList.remove('open');
            setTimeout(function() {
                document.getElementById('notification').remove();
            }, 300);
        });
        setTimeout(function() {
            if( document.getElementById('notification') ) {
                document.getElementById('notification').classList.remove('open');
                setTimeout(function() {
                    if( document.getElementById('notification') ) {
                        document.getElementById('notification').remove();
                    }
                }, 300);
            }
        }, 3000);
    },

    showNotification(type, message) {
        self.createNotification(type, message);
        
        setTimeout(() => {
            let notification = document.getElementById('notification');
            if( notification ){
                notification.classList.add('open');
            }
        }, 10);
    },

    notificationTemplate(type, message, title, color) {
        return `<div class="fixed bottom-0 shadow-2xl group rounded-t-lg bg-white border border-gray-100 cursor-pointer transition ` + type + `" id="notification">
            <div class="float-left w-24">
                <div class="rounded-full absolute left-0 bg-black bg-gray-100 border-` + color + `-400 border-l-4 border-b-4 bubble"></div>
                <img src="/dashboard/assets/img/notifications/` + type + `.png" class="h-48 -ml-8 -mt-8 relative">
            </div>
            <div class="flex flex-col justify-center h-full pl-4 pr-5">
                <h4 class="text-` + color + `-400 font-bold -mt-1 mb-1">` + title + `</h4>
                <p class="text-xs text-gray-500 overflow-scroll">` + message + `</p>
            </div>
            <div class="absolute right-0 top-0 bg-gray-100 group-hover:bg-gray-200 text-gray-400 rounded-full h-5 w-5 flex justify-center items-center text-xs leading-none font-bold mt-2 mr-2 cursor-pointer">&times;</div>
        </div>`;
    },

    // this is not being used
    async getb6(file) {
        return await (new Response(file)).text();
    },

    encodeImageFileAsURL(element) {
        var file = element.files[0];
        var reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('image').src = event.target.result;
            document.getElementById('image').dataset.name = file.name;
        }
        reader.readAsDataURL(file);
    },

    nth(d) {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
          case 1:  return "st";
          case 2:  return "nd";
          case 3:  return "rd";
          default: return "th";
        }
    },

    updateSettings(file, key, value) {
        axios.post('/dashboard/update/settings/' + file, { key: key, value: value })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });
    },

    removeOpenClasses() {
        var openClasses = document.getElementsByClassName('open');
        for(var i = 0; i < openClasses.length; i++){
            if(openClasses[i].id != 'settings'){
                openClasses[i].classList.remove('open');
            }
        }
    },

    closeSettingsBar() {
        document.getElementById('settings-sidebar').classList.remove('open');
        self.removeOpenClasses();
        setTimeout(function(){
            document.getElementById('settings').classList.remove('open');
        }, 300);
    },
    
    savePost() {
        self.getPostData(function(data){
            axios.post('/dashboard/posts/create', data)
                .then(function (response) {
                    let data = response.data;
                    if(data.status == "success"){
                        window.history.pushState({}, title, '/dashboard/post/' + data.slug);
                        document.getElementById('slug').value = data.slug;
                        setCreatePostFalse();
                        self.showNotification('success', 'Your new post has been successfull created.');
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
        });
    },
    
    getSlugValue() {
        let slug = document.getElementById('slug').value;
        if( slug == "" ){
            // return a slugified version of the title
            slug = slugify( document.getElementById('title').value );
        }
    
        // otherwise return the slug value since it is not empty
        return slug.toLowerCase();
    },

    getPostData(_callback) {
        editor.save().then(body => {
            _callback({
                title: document.getElementById('title').value,
                body: body,
                image: document.getElementById('image').src,
                image_filename: document.getElementById('image').dataset.name,
                slug: self.getSlugValue(),
                excerpt: document.getElementById('excerpt').value,
                type: document.getElementById('type').value,
                meta_title: document.getElementById('meta_title').value,
                meta_description: document.getElementById('meta_description').value,
                meta_schema: meta_schema.getValue(),
                meta_data: meta_data.getValue()
            });
    
        }).catch(error => {
          console.log('Saving failed: ', error);
          _callback({});
        });
    },

    renderBlocks() {
        let blocks = {};
        if( document.getElementById('editor').dataset.blocks ){
            blocks = JSON.parse(document.getElementById('editor').dataset.blocks);
        }
        if(blocks && editor){
            editor.blocks.render(
                blocks
            );
        }
    }
}