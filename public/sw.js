//service worker
const staticCache = "static-cache-v2"; //cache name
const dynamicCache = "dynamic-cache-v2"; //cache name
const assets = [ //all the static assets wanted to cache stored in array
    "/",
    "/index.html",
    "/offline.html",
    "/js/main.js",
    "/css/style.css",
    "https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css",
    "https://code.jquery.com/jquery-3.4.1.min.js",
    "https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js",
    "//cdn.jsdelivr.net/npm/pouchdb@7.1.1/dist/pouchdb.min.js"
];

//limit cache size function
const limitCacheSize = (name , size) => {
    caches.open(name)
    .then(cache => { //open dynamic cache name return a promise
        cache.keys() //use keys() method to create an array of keys
        .then(keys => {
            if(keys.length > size){  //if keys.length > than desired size
                cache.delete(keys[0]) //delete the first key , delete function is async, .then()
                .then(limitCacheSize(name , size)) //callback the same function again until keys.length <= size
            }
        })
    })
};

//install event, fires when changed service worker file or initial register
//best to setup a static cache here
self.addEventListener("install" , e => {
    console.log("Service Worker Installed");
    e.waitUntil( //usually caches.open takes sometimes to complete, so use it inside e.waitUntil()
        caches.open(staticCache) //setup a static cache 
        .then(cache => { //caches.open() returns a promise, .then() <- takes in a name
            console.log("Cache static assets"); //cache is the promise returned by then open method
            cache.addAll(assets) //.add()method or .addAll([])method to add all the request as assets 
        })
    );
});

//activate event, fires after install successful and service worker is activated
//best to delete old cache and activate a new cache here
self.addEventListener("activate" , e => {
    console.log("Service Worker Activated");
    //cache versioning
    e.waitUntil(
        caches.keys()
        .then(keys => {
            return Promise.all(
                keys.filter(x => x !== staticCache && dynamicCache).map(y => caches.delete(y))
            )
        })
    );
});
/*
 * waitUntil() expects one promise to resolve but we are doing alot of async method,
 * so use Promise.all will take an array of promises when each of these promises resolve
 * promise.all will resolve then waitUntil will resolve
 * if the cache name is not equal to our new cache name it will be filtered out and keep it in the new array
 * then map through all these array using map method and delete them @@
 */

//fetch event, fires everytime user make a request
//best to fetch offline cached page, and add dynamic page to cache or get a offline fallback page here
self.addEventListener("fetch" , e => {
    console.log("Fetch event = " , e.request);
    if(e.request.url.indexOf("blog") === -1){ //we dont want to cache request from db, because it would cause showing old cache
        e.respondWith(
            caches.match(e.request) //if the request match with our cached assets = true
            .then(cacheRes => { //then dont go to server and instead return the cacheRes or go and fetch the request
                return cacheRes || fetch(e.request) //return a promise , .then()
                .then(fetchRes => {
                    return caches.open(dynamicCache) //open a new dynamic cache
                    .then(cache => {
                        limitCacheSize(dynamicCache , 8);
                        cache.put(e.request.url , fetchRes.clone()); 
                        /**
                         * use put method instead of add/addAll, it takes in 2 arguement,
                         * first is the resource url and second is the response but we want to clone it because
                         * if we used it without clone, we cant return it in the end
                         */
                        return fetchRes;
                    })
                })
            }).catch(() => { //if *offline* and trying to fetch a page that is not cached
                if(e.request.url.indexOf('.html') > -1){ //if our request is a html page instead of image or others (can replace indexOf with includes)
                    return caches.match('/offline.html') //return offline fallback page html
                } //else if() //if its other request can be done all here like png or others
            })
        )
    }
});


