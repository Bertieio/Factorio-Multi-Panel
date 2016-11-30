function confim() {
    if (confirm("Create New Server?") === true) {
        startServer();
    }
}

function hide() {
  infoBox = document.getElementById('sysInfo');
  infoBox.className = "sysInfo";
}

function startServer(){
  console.log("Bang!");
  infoBox = document.getElementById('sysInfo');
  info = document.getElementById('info');
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
                  info.innerHTML = formedResult[1];
                  infoBox.className = "sysWarn";
                }else if (formedResult[0] == "sucess") {
                  info.innerHTML = formedResult[1];
                  infoBox.className = "sysSucess";
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

function loadServer(id){
  var content = document.getElementById('content');
  content.src = "server?id="+id;
  console.log("test");
  //content.innerHTML =
}
