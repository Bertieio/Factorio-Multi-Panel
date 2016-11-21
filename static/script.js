function confim() {
    if (confirm("Create New Server?") == true) {
        startServer();
    }

}

function startServer(){
  console.log("Bang!");
  infoBox = document.getElementById('sysInfo');
  var xhr = new XMLHttpRequest();
  xhr.open("Get", "addServer");
  xhr.onload = function (e) {
    if (xhr.readyState === 4){
      if (xhr.status === 200){
        var result = xhr.responseText;
        if(result !== null){
              console.log(result);
              var formedResult = result.split(":");
              if(formedResult[0] == "warn"){
                  infoBox.innerHTML = formedResult[1];
                  infoBox.className = "sysWarn";
                }
        }
      }else {
        console.error(xhr.statusText);
      }
    }
  };
  xhr.onerror = function (e) {
  console.error(xhr.statusText);
};
  xhr.send(null);
}
