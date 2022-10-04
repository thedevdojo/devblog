import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import LinkTool from '@editorjs/link';
import RawTool from '@editorjs/raw';
import ImageTool from '@editorjs/image';
import List from '@editorjs/list';
import Delimiter from '@editorjs/delimiter';
import Quote from '@editorjs/quote';
import Warning from '@editorjs/warning';
import InlineCode from '@editorjs/inline-code';
import axios from 'axios';
import ace from 'ace-builds';
import modeJson from 'ace-builds/src-min-noconflict/mode-json.js';
import themeChrome from 'ace-builds/src-min-noconflict/theme-chrome.js';
import slugify from 'slugify';
import helper from './helper';
let socket = require('socket.io-client')();
let countdownClose = 3;

socket.on('console', function(data){
    let consoleHTML = document.getElementById('log').innerHTML;
    if(data.message.indexOf('[CLOSE_VIKING_CONSOLE]') != -1){
        let closingMessage = '<span class="text-gray-500" id="exit_msg">Exiting Console (' + countdownClose +')</span>';
        document.getElementById('log').innerHTML = consoleHTML + closingMessage;
        let cntDownInt = setInterval(function(){
            if(countdownClose <= 1){
                closeConsole();
                clearInterval(cntDownInt);
                countdownClose = 3;
                document.getElementById('exit_msg').remove();
            } else {
                countdownClose -= 1;
                document.getElementById('exit_msg').innerText = 'Exiting Console (' + countdownClose + ')';
            }
        }, 900);
    } else {
        document.getElementById('log').innerHTML = consoleHTML + data.message;
    }
});
socket.on('dev', function(data){
    console.log('dt: ' + data);
});

// these two functions rely on the "createPost" flag, set above
// do not move to helper.js
window.setCreatePostTrue =  function() {
    document.getElementById('title').focus();
    createPost = true;
    document.getElementById('delete-post').classList.add('hidden');
}

window.setCreatePostFalse = function() {
    createPost = false;
    if( document.getElementById('delete-post') ){
        document.getElementById('delete-post').classList.remove('hidden');
    }
}

window.openConsole = function(){
    document.getElementById('console').classList.add('open')
}

window.closeConsole = function(){
    document.getElementById('console').classList.remove('open')
}

let createPost = null;
setCreatePostFalse();

if(document.getElementById('createPost') && parseInt(document.getElementById('createPost').value)){
    setCreatePostTrue();
}

window.editor = '';
if( document.getElementById('editor') ){
    editor = new EditorJS({
    /**
     * Id of Element that should contain Editor instance
     */
    holderId: 'editor',
    tools: {
        header: Header,
        linkTool: {
            class: LinkTool,
            config: {
                endpoint: 'http://localhost:8008/fetchUrl', // Your backend endpoint for url data fetching
            }
        },
        raw: RawTool,
        image: {
            class: ImageTool,
            config: {
                endpoints: {
                    byFile: '/dashboard/uploadFile', // Your backend file uploader endpoint
                    byUrl: 'http://localhost:8008/fetchUrl', // Your endpoint that provides uploading by Url
                }
            }
        },
        paragraph: {
            config: {
                placeholder: 'Tell your story...'
            }
        },
        list: {
            class: List,
            inlineToolbar: true,
        },
        delimiter: Delimiter,
        inlineCode: {
            class: InlineCode,
            shortcut: 'CMD+SHIFT+M',
        },
        warning: Warning,
        quote: Quote
    },
    autofocus: !createPost,
    onReady: () => {
        if(document.getElementById('editor').dataset.blocks){
            helper.renderBlocks();
        }
    }
    });
}

if( document.getElementById('settings') ){

    document.getElementById('settings-open').addEventListener('click', function(){
        document.getElementById('settings').classList.add('open');
        
        setTimeout(function(){
            document.getElementById('settings-sidebar').classList.add('open');
        }, 10);
    });

    document.getElementById('settings-backdrop').addEventListener('click', function(){
        helper.closeSettingsBar();
    });

    document.getElementById('settings-close').addEventListener('click', function(){
        helper.closeSettingsBar();
    });

}

let openToggles = document.getElementsByClassName('open-toggle');
for(let i = 0; i < openToggles.length; i++){
    openToggles[i].addEventListener('click', function(){
        let toggleId = this.dataset.toggle;
        let toggleElement = document.getElementById( toggleId );
        if(toggleElement.classList.contains('open')){
            toggleElement.classList.remove('open');
        } else {
            toggleElement.classList.add('open');
        }
    });
}

// tab toggles

let tabs = document.getElementsByClassName('tab');
for(let i = 0; i < tabs.length; i++){
    tabs[i].addEventListener('click', function(){
        this.parentNode.parentNode.classList.toggle('open');
        if(tabs[i].parentNode.parentNode.id == "preview"){
            addIframePreview();
        }
    });
}


window.addIframePreview = function(){
    let ifr = document.createElement('iframe');
    ifr.src = window.location.protocol + '//' + window.location.host;
    ifr.addEventListener("load", function(){
        document.getElementById('iframe_url').innerText = this.contentWindow.location.href;
    });
    ifr.className = 'w-full h-full';
    document.getElementById('preview_container').appendChild(ifr);
}

if( document.getElementById('save-post') ){
    document.getElementById('save-post').addEventListener('click', function(){
        helper.savePost();
    });
}

if( document.getElementById('delete-post') ){
    document.getElementById('delete-post').addEventListener('click', function(){
        helper.getPostData(function(data){
            axios.post('/dashboard/posts/delete', {
                slug: data.slug
            })
            .then(function (response) {
                let data = response.data;
                if(data.status == "success"){
                    window.location = '/dashboard/posts';
                }

                if(data.status == "fail"){
                    helper.showNotification('danger', JSON.stringify(data.message) )
                }
            })
            .catch(function (error) {
                console.log(error);
            });
        });
    });
}

if ( document.getElementById('title') ){
    document.getElementById('title').addEventListener('keydown', function(evt){
        // if(evt.keyCode){
        //     document.getElementById('editor').click();
        // }
    });
}

if( document.getElementById('deploy') ){
    document.getElementById('deploy').addEventListener('click', function(){
        modal.open(`<div class="flex flex-col justify-center items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-20 h-auto fill-current" viewBox="0 0 64 80"><path d="M52 44a8 8 0 00-6.634 3.526l-.525.779-.81-.476a5.982 5.982 0 00-8.676 3.154l-.4 1.11-1.03-.572a3.949 3.949 0 00-4.723.624L28.131 53.2l-.554-1.4a5.977 5.977 0 00-7.533-3.465l-.768.265-.416-.7A8 8 0 1012 60h40a8 8 0 000-16z"/><path d="M32 37a2 2 0 012 2 8.591 8.591 0 01-2 5.535A8.591 8.591 0 0130 39a2 2 0 012-2zM36 27h2V13.616A10.537 10.537 0 0032 4.1a10.537 10.537 0 00-6 9.518V27h10zm-4-17a4 4 0 11-4 4 4 4 0 014-4z"/><circle cx="32" cy="14" r="2"/><path d="M44 26.324a7.766 7.766 0 00-4-6.8V27h4zM30 29h4v2h-4zM41 29h2v2h-2zM21 29h2v2h-2zM24 19.526a7.766 7.766 0 00-4 6.8V27h4zM22 37a1 1 0 011 1 3.855 3.855 0 01-1 2.58A3.855 3.855 0 0121 38a1 1 0 011-1zM42 37a1 1 0 011 1 3.855 3.855 0 01-1 2.58A3.855 3.855 0 0141 38a1 1 0 011-1z"/></svg>
                        <h2 class="text-gray-700 font-sans text-lg pb-8 py-0 text-center">Are you sure you want to deploy your site?</h2>
                        <div class="flex">
                            <div class="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-3 cursor-pointer modal-close">Cancel</div>
                            <a href="/dashboard/deploy" class="bg-black text-white px-4 py-2 rounded">Yep, Let's Do It</a>
                        </div>
                    </div>`)
    });
}

if( document.getElementById('toggleDev') ){
    document.getElementById('toggleDev').addEventListener('change', function(){
        helper.updateSettings(this.dataset.settings, this.dataset.key, ( (this.checked) ? true: false ) );
        if(this.checked){
            socket.emit('devOn');
        } else{
            socket.emit('devOff');
        }
    });
}

window.modal = {

    close : function(){
        let modalBackground = document.getElementById('modalBackground');
        let modalContent = document.getElementById('modalContent');
        let modalClose = document.getElementById('modalClose');
    
        modalBackground.classList.remove('opacity-25');
        modalContent.classList.add('opacity-0');
        modalClose.classList.remove('opacity-100');
        setTimeout(function(){
            document.getElementById('modal').remove();
        }, 200);
    },

    open : function(content, size){

            // size can be (s)mall, (m)edium, or (l)arge, or (f)ull
            // default size is (s) if not set
            size = (typeof size == 'undefined') ? 's' : size;

            // if the modal element already exists, we will make sure to close it
            if(document.getElementById('modal')) document.getElementById('modal').remove();

            let modalContentSize = 'container max-w-lg';
            let modalStyle = '';
            if(size == 'm'){
                modalContentSize = 'container max-w-2xl';
            } else if(size == 'l'){
                modalContentSize = 'w-full h-full';
                modalStyle = ' p-20';
            }
             
            let html = `<div id="modalBackground" class="bg-black absolute w-full h-full opacity-0 transition-all duration-100 ease-linear"></div>
                        <div id="modalContent" class="${modalContentSize} rounded-lg bg-white h-auto p-10 shadow-xl relative z-30 flex flex-col justify-center items-center transition-all duration-200 transform scale-75">
                            ${content}
                        </div>
                        <div id="modalClose" class="absolute right-0 top-0 z-40 mr-3 mt-3 w-8 h-8 bg-black flex justify-center items-center text-gray-300 font-bold text-xl rounded-full cursor-pointer border-b-2 border-black opacity-0 transition-all duration-200 ease-linear modal-close">&times;</div>`;
        
            let modal = document.createElement('div');
            modal.innerHTML = html;
            modal.id = "modal";
            modal.className = "fixed w-full h-full flex justify-center items-center z-30 left-0 top-0 modal" + modalStyle;
            document.body.appendChild(modal);
        
            setTimeout(function(){
                let modalBackground = document.getElementById('modalBackground');
                let modalContent = document.getElementById('modalContent');
                let modalClose = document.getElementById('modalClose');
                modalBackground.classList.add('opacity-25');
                modalContent.classList.add('scale-100');
                modalClose.classList.add('opacity-100');
        
                modalBackground.addEventListener('click', this.modal.close);
                let modalCloseBtns = document.getElementsByClassName('modal-close');
                for(var i=0; i < modalCloseBtns.length; i++){
                    modalCloseBtns[i].addEventListener('click', this.modal.close);
                }
            }, 10);
        
    }

}

// let readLogFile = null;

// window.readVikingLogFile =  function(){
//     let readLogFile = setInterval(function(){
//         var xobj = new XMLHttpRequest();
//         xobj.open('GET', './content/logs/viking.log', true); // Replace 'my_data' with the path to your file
//         xobj.onreadystatechange = function () {
//             if (xobj.readyState == 4 && xobj.status == "200") {
//                 // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
//                 let logRes = xobj.responseText;
//                 document.getElementById('log').innerHTML = logRes;
//                 if(logRes.indexOf('[CLOSE_VIKING_CONSOLE]') !== -1){
//                     clearInterval(readLogFile);
//                     closeConsole();
//                 }
//             }
//         };
//         xobj.send(null);  
//     }, 500);
// }

// Add event listener click for the build button
if( document.getElementById('build-btn') ){
    document.getElementById('build-btn').addEventListener('click', function(){
        openConsole();
        //readVikingLogFile();
        axios.post('/dashboard/build')
            .then(function (response) {
                let data = response.data;
                if(data.status == "success"){
                    helper.showNotification('success', 'Successfully built your site.');
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    });
}

// Uncomment each notification below to see an example of each one
//helper.showNotification('success', 'Your new post has been successfull created.');
//helper.showNotification('danger', 'Something has went wrong trying to save your post.');
//helper.showNotification('info', 'Did you know that you can upload an image for your post.');
//helper.showNotification('warning', 'Make sure to enter a good title in your post.');

if (document.getElementById('image_upload')) {
    document.getElementById('image_upload').addEventListener('change', function (event) {
        helper.encodeImageFileAsURL(this);
        showImagePreview();
    });
}

// these two functions are invoked in template files
// it might be necessary to attach them to the window object
// do not move to helper.js
window.hideImagePreview = function() {
    document.getElementById('image_preview_upload').classList.remove('hidden');
    document.getElementById('image_upload').classList.remove('hidden');
    document.getElementById('image_preview').classList.add('hidden');
    document.getElementById('image').src = document.getElementById('image').dataset.pixel;
    document.getElementById('image_upload').value = "";
    document.getElementById('image').dataset.name = "";
}

window.showImagePreview = function() {
    document.getElementById('image_preview_upload').classList.add('hidden');
    document.getElementById('image_upload').classList.add('hidden');
    document.getElementById('image_preview').classList.remove('hidden');
}

let secondTick = false;

// this function relies on the "secondTick" flag, set above
// do not move to helper.js
function DisplayCurrentTime() {
    let date = new Date();
    let hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
    let am_pm = date.getHours() >= 12 ? "PM" : "AM";
    let minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    let secondDelimiter = (secondTick) ? '<span class="text-gray-700">:</span>' : ':';
    secondTick = !secondTick;
    document.getElementById('time').innerHTML = hours + secondDelimiter + minutes + " " + am_pm;
    let time = setTimeout(DisplayCurrentTime, 500);
};

function DisplayCurrentDate() {
    let now = new Date();
    let days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    let months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let dayOfWeek = days[ now.getDay() ];
    let month = months[ now.getMonth() ];
    let day = now.getDate();
    let year = now.getFullYear();
    document.getElementById('date').innerHTML = dayOfWeek + ", " + month + " " + day + helper.nth(day) + " " + year;
    let time = setTimeout(DisplayCurrentDate, 500);
}

if( document.getElementById('time') ) {
    DisplayCurrentTime();
}

if( document.getElementById('date') ) {
    DisplayCurrentDate();
}

