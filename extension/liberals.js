window.onload = function () {
    
};

chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendMessage(tab.id, { action : "getData" }, function (response) {
        var positivity = response.my_results.sentiment - response.articles[0].sentiment;
        var negativity = response.articles[2].sentiment - response.my_results.sentiment;
        if (positivity > negativity)
        {
            $("#art1").text(response.articles[2].title);
            $("#art1").attr("href", response.articles[2].url);
            $("#art2").text(response.articles[1].title);
            $("#art2").attr("href", response.articles[1].url);
            $("#art3").text(response.articles[0].title);
            $("#art3").attr("href", response.articles[0].url);
        }
        else
        {
            $("#art1").text(response.articles[0].title);
            $("#art1").attr("href", response.articles[0].url);
            $("#art2").text(response.articles[1].title);
            $("#art2").attr("href", response.articles[1].url);
            $("#art3").text(response.articles[2].title);
            $("#art3").attr("href", response.articles[2].url);
        }
    });
});$