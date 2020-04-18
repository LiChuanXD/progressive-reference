document.addEventListener('DOMContentLoaded' , function(){
    //register 
    if("serviceWorker" in navigator){ //check if service worker is supported in your browser
        navigator.serviceWorker.register('/sw.js' , {scope : '/'}) //if yes, register to our sw.js file
        .then(reg => console.log("Service Worker registered successfully" , reg))
        .catch(err => console.log("Service worker register failed" , err))
    }else{ //else service worker is not supported
        console.log("Browser does not support service worker")
    };

    //init variables
    const blogForm = document.querySelector("#blog-form");
    const title = document.querySelector("#title");
    const body = document.querySelector("#body");
    const blogList = document.querySelector("#blog-list");

    //db
    const localDb = new PouchDB('blog');
    const remoteDb = new PouchDB('http://localhost:5984/blog');

    //functions
    //insert dom
    const renderDom = doc => {
        const newBlog = `
            <div class="card mb-3" id="${doc._id}">
                <div class="card-header">
                    ${doc.title}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${doc.title}</h5>
                    <p class="card-text">${doc.body}</p>
                    <br>
                    <i class="btn btn-danger float-right delete-btn" key=${doc._id}>Delete</i>
                </div>
            </div>
        `
        return blogList.innerHTML += newBlog;
    };
    //delete dom
    const deleteDom = id => {
        const deleteThis = document.getElementById(id);
        return deleteThis.remove();
    };

    //fetch all documents
    localDb.allDocs({include_docs : true})
    .then(docs => {
        return docs.rows.forEach(x => {
            console.log(x)
            return renderDom(x.doc) //render to dom after fetched
        })
    })
    .catch(err => console.log(err));


    //submit event handler
    blogForm.addEventListener("submit" , function(e){
        e.preventDefault();

        localDb.post({ //post to db
            title : title.value,
            body : body.value
        }).then(res => {
            console.log("Document created = " , res);
            //add to dom
            let html = `
                <div class="card mb-3" id="${res.id}">
                    <div class="card-header">
                        ${title.value}
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${title.value}</h5>
                        <p class="card-text">${body.value}</p>
                        <br>
                        <i class="btn btn-danger float-right delete-btn" key=${res.id}>Delete</i>
                    </div>
                </div>
            `
            return blogList.innerHTML += html;

        }).then(() => {
            //reset to init state
            title.value = "";
            body.value = "";
        }).catch(err => console.log(err));
    });

    //delete event handler
    blogList.addEventListener("click" , function(e){
        if(e.target.tagName === "I"){ //if the button we clicked is an I tag , which is our delete button
            const id = e.target.getAttribute("key"); //get the key attribute
            //delete from db
            return localDb.get(id) //find by id
                .then(doc => localDb.remove(doc._id , doc._rev)) //remove from db
                .then(res => {
                    console.log(res);
                    return deleteDom(res.id); //delete from dom
                }).catch(err => console.log(err))
        }
    });

    //duplicate to server
    localDb.sync(remoteDb , {
        live : true,
        retry : true
    }).on("change" , function(change){
        //fires when something has changed
        console.log("Change = " , change);

        change.change.docs.forEach(x => {
            if(!x._deleted && change.direction === "pull"){
                renderDom(x)
            }else if(x._deleted){
                deleteDom(x._id)
            }else{
                console.log("Something else")
            }

        });

    }).on("paused" , function(info){
        //when the duplicate is paused , maybe lost connection or something
        return console.log("Paused = " , info);
    }).on("active" , function(info){
        //fires when duplicate resume
        return console.log("Active = " , info);
    }).on("error" , function(err){
        //error
        return console.log(err)
    })

});