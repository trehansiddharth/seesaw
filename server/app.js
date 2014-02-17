var express     = require('express'),
    htmlparser  = require("htmlparser"),
    request     = require("request"),
    select      = require("soupselect").select,
    cheerio     = require('cheerio'),
    sentiment   = require('./sentiment');

var AlchemyAPI = require('alchemy-api');
var alchemy = new AlchemyAPI("b5ba13134dc223a060687a98bb32dad096d80e9f");

var app = express();

var port = parseInt(process.env.PORT, 10) || 80;

app.use('/public', express.static(__dirname + '/public'));

app.get("/analyze", function (req, res) {
    if (req.query.url)
    {
        var url = req.query.url;
        console.log("request sent");
                //alchemy.text(url, {}, function (err, respo) {
                request.get("http://access.alchemyapi.com/calls/url/URLGetTitle?url=" + escape(url) + "&apikey=" + "b5ba13134dc223a060687a98bb32dad096d80e9f" + "&useMetadata=1&outputMode=json", function (err, respo, bodd) {
                    if (err) res.end("ERROR");
                    //var title = respo.text.title;
                    var title = JSON.parse(bodd).title;
                    /*console.log("we're good");*/
                    alchemy.sentiment(url, {}, function(err, responser) {
                        if (err) res.end("ERROR");
                        //console.log(responser);
                        // See http://www.alchemyapi.com/api/ for format of returned object
                        var sentiment = responser.docSentiment;
                        if (sentiment)
                        {
                            // Do something with data
                            alchemy.entities(url, {}, function (err, resp) {
                                if (err)
                                {
                                    res.end("ERROR");
                                }
                                else
                                {
                                    var keywords = resp.entities;
                                    res.end(JSON.stringify({ title : title, sentiment : sentiment.score, url : url, keywords : keywords }));
                                }
                            });
                        }
                        else
                        {
                            res.end("ERROR");
                        }
                    });
                });
    }
    else
    {
        res.end("ERROR");
    }
});
app.get("/scrape", function (req, res) {
    if (req.query.title)
    {
        var title = req.query.title.split(" ").join("+");
        var searchfor = "https://www.google.com/search?hl=en&gl=us&tbm=nws&authuser=0&q=" + title + "&qscrl=1";
        request.get(searchfor, function (error, response, body) {
            if (error)
            {
                res.end(JSON.stringify({ error : "ERROR" }));
            }
            else
            {
                var result = scrapeNewsLinks(cheerio.load(body));
                var output = [];
                var counter = -Math.min(13, result.length);
                console.log("HOW MANY: " + result.length.toString());
                setTimeout(function () {
                    if (counter < 0)
                    {
                        counter = 1;
                        var returns = output.slice(0, 1);
                        returns.push(output[Math.floor(output.length / 2)]);
                        returns.push(output.slice(-1)[0]);
                        console.log("DONE!");
                        console.log(returns);
                        res.json(returns);
                    }
                }, 15000);
                for (i = 0; i < Math.min(13, result.length); i++)
                {
                    var linkurl = result[i].split("&amp;").join("&").split("&sa=")[0];
                    /*console.log(linkurl);*/
                    request.get("http://localhost/analyze?url=" + escape(linkurl), function (err, resp, bod) {
                        console.log("COUNTER: " + counter.toString());
                        if (counter > 1)
                        {
                            
                        }
                        else
                        {
                            if (err || bod == "ERROR")
                            {
                                console.log(err + " ERROR");
                            }
                            else
                            {
                                //console.log(bod);
                                var input = JSON.parse(bod);
                                var old_title = input.title;
                                var new_sent = input.sentiment;
                                var new_title = old_title;
                                /*var lowers = "qwertyuiopasdfghjklzxcvbnm";
                                var uppers = "QWERTYUIOPASDFGHJKLZXCVBNM";
                                var numbers = "1234567890";
                                
                                while (lowers.indexOf(new_title.slice(0, 1)) == -1 && uppers.indexOf(new_title.slice(0, 1)) == -1 && numbers.indexOf(new_title.slice(0, 1)) == -1)
                                {
                                    new_title = new_title.slice(1);
                                }*/
                                if (new_sent)
                                {
                                    output.push({ title : new_title, url : input.url, sentiment : new_sent });
                                    output.sort(function (a, b) { return a.sentiment - b.sentiment; });
                                }
                            }
                            counter += 1;
                            if (counter == 0)
                            {
                                var returns = output.slice(0, 1);
                                returns.push(output[Math.floor(output.length / 2)]);
                                returns.push(output.slice(-1)[0]);
                                console.log("DONE!");
                                console.log(returns);
                                try
                                {
                                    res.json(returns);
                                }
                                catch (e)
                                {
                                    console.log("Unexpected error");
                                }
                            }
                        }
                    });
                }
            }
        });
    }
    else
    {
        res.end("You didn't say the magic word");
    }
});

function scrapeNewsLinks($) {
	//Returns a list of urls to new news articles from a google news search page
	/*magically generate DOM here*/
	//Get all divs with class 'g'
    var links = [];
	$('#res a').each(function (i, element) {
        /*select(element, 'a').forEach(function (subelement) {
            links.push(unescape(subelement.attribs.href.slice(7)));
        });
        select(element, 'a.news-non-lead-article').forEach(function (subelement) {
            links.push(unescape(subelement.attribs.href.slice(7)));
        });*/
        console.log(element.attribs.href);
        links.push(unescape(element.attribs.href.split("?q=")[1].split("&sa")[0]));
    });
    /*console.log($("a.Headline"))*/
    /*$('a.news-non-lead-article').forEach(function (element) {
        links.push(element.attribs.href.slice(7));
    });*/
	//Take out the bad urls
    var final_links = [];
	for (var i = 0; i < links.length; i++)
    {
		if (links[i].indexOf(".google.") == -1 && links[i].indexOf("javascript:void") == -1)
        {
			final_links.push(links[i]);
		}
	}
	return final_links;
}

app.listen(port);

console.log("Now listening on port " + port);

function toArray(list) {
    var i, array = [];
    for (i=0; i<list.length;i++)
    {
        array[i] = list[i];
    }
    return array;
}

unique = function (array) {
    i = 0;
    var results = [];
    while (i < array.length)
    {
        var j = array.indexOf(array[i]);
        if (j == -1 || j >= i)
        {
            results.push(array[i]);
        }
        i++;
    }
    return results;
}

/*
YAHOO API:
var q = 'select * from contentanalysis.analyze where text=\'Edward Snowden is, in the eyes of many, a secular saint. The fugitive NSA contractor has sacrificed his career and risked his freedom to expose systematic wrongdoing by Western intelligence agencies: America and Britain spy on other Western countries; they hoover up and store vast quantities of information about domestic emails and phone calls; they use secret court orders to force cooperation, and they can bug almost any international communication.\''
request.get("http://query.yahooapis.com/v1/public/yql?q=" + escape(q), function (err, resp, bod) { console.log(bod); }); */
