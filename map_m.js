
function goDesktop(){
    var url = "index.html";
    var split_url =  window.location.href.split("?");
    if (split_url.length > 1){
        url += "?"+split_url[1];
    }
    window.location.replace(url);
}