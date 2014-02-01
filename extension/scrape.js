my_results = null;
articles = null;

/*function ajaxGet(theUrl)
{
    var xmlHttp = null;

    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false );
    xmlHttp.send( null );
    return xmlHttp.responseText;
}*/
//Create the objects which will hold our requests:
recommended_article_request = new XMLHttpRequest();
article_analysis_request = new XMLHttpRequest();

//Create the function which will handle the returning original article data. It fires on any state change
article_analysis_request.onreadystatechange = function() {
    //Continue to execute if the new state is the done state(4), and no error have risen (200)?
    if (article_analysis_request.readyState == 4 && article_analysis_request.status == 200) {
        if (article_analysis_request.responseText == "ERROR")
        {
            console.log("error");
        }
        else
        {
            my_results = JSON.parse(article_analysis_request.responseText);
            
            query = [];
            /*var title = my_results.title.split("-")[0].split("|")[0];
            for (i = 0; i < my_results.entities.length; i++)
            {
                if (title.indexOf(my_results.entities[i].text) != -1)
                {
                    my_results.entities[i].relevance += 0.35 * my_results.entities[i].relevance;
                }
            }
            my_results.entities.sort(function (a, b) { b.relevance - a.relevance });*/
            console.log(my_results);
            for (i = 0; i < Math.min(4, my_results.keywords.length); i++)
            {
                query.push(my_results.keywords[i].text)
            }
            
            //Now that we have analyzed the initial article, we can request more data
            recommended_article_request.open( "GET", "http://localhost/scrape?title=" + escape(query.join(" ")), true);
            recommended_article_request.send();
        }
        
    }
}

//Create the function which will handle the returning recommendation data
recommended_article_request.onreadystatechange = function() {
    if(recommended_article_request.readyState == 4 && recommended_article_request.status == 200) {
        
        articles = JSON.parse(recommended_article_request.responseText);
        if (articles.error)
        {
            // HANDLE ERROR
            console.log("ERROR: google news barfed up");
        }
        else
        {
            console.log(articles);
            chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
                if (message.action == "getData")
                {
                    sendResponse({ my_results : my_results, articles : articles });
                }
            });
            chrome.extension.sendRequest({}, function(response) {
                console.log(articles);
            });
        }
    }
}

article_analysis_request.open( "GET", "http://localhost/analyze?url=" + escape(location.href), true);
article_analysis_request.send();

/*
var pre_res1 = httpGet("http://localhost/analyze?url=" + escape(location.href));
my_results = JSON.parse(pre_res1);
console.log(my_results);
var pre_res2 = httpGet("http://localhost/scrape?title=" + escape(my_results.title));
articles = JSON.parse(pre_res2);
console.log(articles);*/
/*$.get("http://localhost/analyze", { url : unescape(location.href)}, function (res1) {
    my_results = res1;
    console.log(my_results);
    $.get("http://localhost/scrape", { title : my_results.title }, function (res2) {
        articles = res2;
        chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            if (message.action == "getArticles")
            {
                sendResponse({ articles : articles });
            }
            else if (message.action == "getMyResults")
            {
                sendResponse({ my_results : my_results });
            }
        });
        chrome.extension.sendRequest({}, function(response) {
            console.log(articles);
        });
    });
});*/