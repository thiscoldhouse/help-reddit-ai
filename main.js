// platform agnostic shenanigans
if (typeof browser === "undefined") {
    var browser = chrome;
}

let modal = '\
<div id="myModal" class="extension-modal">\
  <div class="modal-content">\
    <h2 style="font-size:20px;padding: 10px 0 10px 0;">Reddit Comment Content Replacer</h2>\
    <p>\
      This extension will replace all your Reddit comments older than the number of days selected with random chunks of the provided text.</p><p><b>Do not use a copyrighted article</b>, especially not one from the New York Times like, say, <a href="https://www.nytimes.com/2023/04/18/technology/reddit-ai-openai-google.html">this article</a> (<a href="https://web.archive.org/web/20240225075400/https://www.nytimes.com/2023/04/18/technology/reddit-ai-openai-google.html">archive link</a>), since <a href="https://www.nytimes.com/2023/12/27/business/media/new-york-times-open-ai-microsoft-lawsuit.html">the NYT has been suing OpenAI</a> for copyright. It would be <i>terrible</i> if Reddit and their partners violated coypright when using this data to train their AIs, especially since they  <a href="https://www.theverge.com/2024/2/22/24080165/google-reddit-ai-training-data">just signed a deal with Google to do just that</a> as they near their IPO!\
   </p>\
    <textarea id="user-corpus" placeholder="Enter your text here (remember, no copyrighted material!)"></textarea>\
    <br>\
    <input type="number" id="user-days" placeholder="How many days of comments do you want to preserve?" default="14">\
     <br>\
    <button onclick="window.location.href = \'https://old.reddit.com/u/me/?redditReplacer=1\' + \'&corpus=\' + encodeURIComponent(document.getElementById(\'user-corpus\').value ) + \'&days=\' + encodeURIComponent(document.getElementById(\'user-days\').value) ;">Submit</button>\
  </div>\
</div>\
<style>\
#user-corpus {\
  width: 99%;\
  padding: 15px 0 15px 0 !important;\
}\
#user-days {\
  width: 99%;\
  padding: 15px 0 15px 0 !important;\
}\
.extension-modal {\
  position: fixed;\
  z-index: 99;\
  left: 0;\
  top: 0;\
  width: 100%;\
  height: 100%;\
  overflow: auto;\
  font-size: 16px;\
  background-color: rgba(0,0,0,0.4);\
}\
\
.modal-content {\
  background-color: #fefefe;\
  margin: 15% auto;\
  padding: 20px;\
  border: 1px solid #888;\
  width: 80%;\
}\
\
</style>'

function start(){

  if (document.location.hostname != "old.reddit.com"){
    console.log('Not on reddit');
    alert("Please go to old.reddit.com/u/me/overview and run again");
    return;

  } else if (!document.location.href.match(/\/overview\b/)){
    console.log('Not on user overview');
    alert("Please go to old.reddit.com/u/me/overview and run again");
    return;

  } else {
    var el = document.createElement("div");
    el.innerHTML = modal;
    document.body.appendChild(el);
  }
}

function replaceCommentsIfAppropriate(retryNumber = 0){
  let qsValue = getQueryStringParam('redditReplacer');
  if (qsValue == '1'){
    let corpus = getQueryStringParam('corpus').split(/[!.?]/);
    let days = parseInt(getQueryStringParam('days'));

    if (isNaN(days)){
      alert('Please enter a valid number of days');
      return
    }
    console.log('Detecting edit links');
    let editLinks = document.getElementsByClassName("edit-usertext");
    if (editLinks.length == 0){
      if (retryNumber >= 5){
        alert('Didn\'t detect any comments to edit... Quitting.')
      }
      console.log('Retrying');
      return setTimeout(
        3000,
        function(){replaceCommentsIfAppropriate(retryNumber + 1)}
      )
    }
    for (var i = 0; i < editLinks.length; i++){
      let editLink = editLinks[i];
      let commentTime = editLink.parentElement.parentElement.parentElement.querySelectorAll('time')[0].dateTime;
      if (daysSince(commentTime) > days){
        console.log('editing');
        let newContent = corpus[Math.floor(Math.random() * corpus.length)];
        editLink.click();
        console.log('clicked edit button');
        setTimeout(
          function(){
            console.log('filling in new content');
            editLink.parentElement.parentElement.parentElement.querySelectorAll('textarea')[0].value = newContent;
            editLink.parentElement.parentElement.parentElement.querySelectorAll('button[class=save]').click();
            debugger;
            console.log('done!');
          },
          1000
        )
      }
    }
  }
}

function daysSince(date) {
  console.log('date is ' + date)
  console.log('date type is ' + typeof(date));
  if (typeof(date) === "string"){
    date = Date.parse(date);
  }
  var seconds = (new Date() - date) / 1000.0
  let days = seconds / 86400.0;
  console.log('DAYS SINCE ' + days);
  return days;
}


function getQueryStringParam(name, url = window.location.href) {
  // taken from:
  // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


replaceCommentsIfAppropriate();


browser.runtime.onMessage.addListener(function(request){
  start();
  return Promise.resolve({'success': true})
});



console.log('********************')
console.log('********************')
console.log('********************')
console.log('Reddit script loaded');
console.log('********************')
console.log('********************')
console.log('********************')
