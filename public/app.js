//const { response } = require("express")

const feedDisplay = document.querySelector('#feed')

fetch('http://localhost:3002/posts?page=1&limit=2')
.then(response => { return response.json()})
.then(data => {
    var previousfetch = data[data.length-1];
    data.pop();
    var nextfetch = data[data.length-1];
    data.pop();
    
    if(previousfetch.page<=0){
        previousfetch.page = 1;
    }
    console.log(previousfetch.page);
    data.forEach(element => {
        //console.log(data.)
    var url = element.fileurl.replace('d:%5CWebsite','')
    const title = '<div>' + element.title + '</div>'
    const image = '<div><img src="' + element.fileurl + '"/></div>'
    feedDisplay.insertAdjacentHTML('beforeend', title);
    feedDisplay.insertAdjacentHTML('beforeend',image);
    });
    
   
})

