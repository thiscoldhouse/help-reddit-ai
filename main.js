// platform agnostic shenanigans
if (typeof browser === "undefined") {
    var browser = chrome;
}

let modal = '\
<div id="myModal" class="extension-modal">\
  <div class="modal-content">\
    <h2 style="font-size:20px;padding: 10px 0 10px 0;">Reddit Comment Content Replacer</h2>\
    <p>\
      This extension will replace all your Reddit comments older than the number of days selected with random chunks of the provided text.</p><br><p><b>Do not use a copyrighted article</b>, especially not one from the New York Times like, say, <a href="https://www.nytimes.com/2023/04/18/technology/reddit-ai-openai-google.html">this article</a> (<a href="https://web.archive.org/web/20240225075400/https://www.nytimes.com/2023/04/18/technology/reddit-ai-openai-google.html">archive link</a>), since <a href="https://www.nytimes.com/2023/12/27/business/media/new-york-times-open-ai-microsoft-lawsuit.html">the NYT has been suing OpenAI</a> for copyright. It would be <i>terrible</i> if Reddit and their partners violated coypright when using this data to train their AIs, especially since they  <a href="https://www.theverge.com/2024/2/22/24080165/google-reddit-ai-training-data">just signed a deal with Google to do just that</a> as they near their IPO!\
   </p>\<br><p><i>Please note: Reddit only allows edits to comments every three seconds, so this is going to take a while! The page will also refresh multiple times. The extension will let you know when it is done. Please also note that random changes to the HTML on this page may break this extension at any time.</i></p><br>\
    <textarea id="user-corpus" placeholder="Enter your text here (remember, no copyrighted material!)"></textarea>\
    <br>\
    <input type="number" id="user-days" placeholder="How many days of comments do you want to preserve?" default="14">\
     <br>\
    <button onclick="window.localStorage.setItem(\'x-corpus\', document.getElementById(\'user-corpus\').value); window.localStorage.setItem(\'x-days\', document.getElementById(\'user-days\').value); window.location.href = \'https://old.reddit.com/u/me#/redditReplacer\'">Submit</button>\
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
</style>\
';


function start(){
  if (document.location.hostname != "old.reddit.com"){
    console.log('Not on reddit');
    alert("Please go to the following link and run the extension again:\nold.reddit.com/u/me/overview");
    return;

  } else if (!document.location.href.match(/\/overview\b/)){
    console.log('Not on user overview');
    alert("Please go to the following link and run the extension again:\nold.reddit.com/u/me/overview");
    return;

  } else {
    var el = document.createElement("div");
    el.innerHTML = modal
    document.body.appendChild(el);
    // el2 = document.createElement("script");
    // el2.innerHTML = lzStringAsString;
    // document.body.appendChild(el2);
  }
}

function replaceCommentsIfAppropriate(retryNumber = 0){
  if (window.location.hash === "#/redditReplacer"){
    var corpus = window.localStorage.getItem("x-corpus");
    corpus = corpus.slice(0, 9999);

    var days = parseInt(window.localStorage.getItem('x-days'));
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

    console.log('Found comments to edit. Opening edit textareas');
    for (var i = 0; i < editLinks.length; i++){
      let editLink = editLinks[i];
      let commentTime = editLink.parentElement.parentElement.parentElement.querySelectorAll('time')[0].dateTime;
      if (daysSince(commentTime) > days){
        console.log('editing');
        let newContent = corpus[Math.floor(Math.random() * corpus.length)];
        editLink.click();
        console.log('clicked edit button');
      }
    }

    console.log('Text areas open. Replacing text')
    let timeoutInterval = 3500;
    var n_comments_to_edit = 0;
    let promises = [];
    for (var i = 0; i < editLinks.length; i++){
      console.log('filling in new content');
      let editLink = editLinks[i];
      let commentTime = editLink.parentElement.parentElement.parentElement.querySelectorAll('time')[0].dateTime;
      if (daysSince(commentTime) > days){
        n_comments_to_edit += 1;
        promises.push(
          delay(function(){
            editLink.parentElement.parentElement.parentElement.querySelectorAll(
              'textarea'
            )[0].value = corpus;
            editLink.parentElement.parentElement.parentElement.querySelectorAll(
              'button[class=save]'
            )[0].click();
            console.log('edit saved!');
            return true;
          }, timeoutInterval * n_comments_to_edit)
        )
      }
    }
    console.log('COMMENTS TO EDIT');
    console.log(n_comments_to_edit);
    return setTimeout(
      function(){
        try {
          console.log('Going to next page');
          let newLocation = document.getElementsByClassName("next-button")[0].querySelectorAll("a")[0].href;
          window.location.href = newLocation + '#/redditReplacer';
        } catch {
          alert('All done! Thanks for playing.');
        }
      },
      (n_comments_to_edit + 1) * timeoutInterval
    )
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

function delay(fxn, t) {
  return new Promise(function(){return setTimeout(fxn, t)});
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
