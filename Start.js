const request = require('request');
const redis = require("redis");

const token = "?access_token=829794167161240|f3f1697d5230b58304a9d0dc2bbf788e";
const baseUrl = "https://graph.facebook.com/";

const merkmale = [
    {"name":"afd", "seiten":["alternativefuerde", "AfDNuernberg", "afdrheinlandpfalz", "AfD.Thueringen", "AfDfuerNRW", "SachsenAnhalt.AfD", "AfD.BW", "AfD.Schleswig.Holstein.de", "AfDSaar"]},
    {"name":"spd", "seiten":["sigmar.gabriel", "SPD", "spdbw", "spdbundestagsfraktion", "spdhamburg", "spdstuttgart", "SPDStuttgartOst", "SPD.Berlin", "spdnds"]},
    {"name":"cdu", "seiten":["AngelaMerkel", "CDU", "cduberlin", "CDU.BW", "cduhessen", "CDUnrw", "cducsubundestagsfraktion", "cdusaar", "cdush", "cduhamburg"]},
    {"name":"gruene", "seiten":["Cem", "B90DieGruenen", "diegruenen", "diegruenensteiermark", "Buendnis90DieGruenenBerlin", "diegruenenwien", "gruene.leopoldstadt", "diegrazergruenen", "GRUENEsalzburg", "DieGruenenTirol", "gruenekaernten", "Gruene.im.Bundestag"]},
    {"name":"linke", "seiten":["linkspartei", "sahra.wagenknecht", "gregor.gysi", "DIELINKE.Berlin", "dielinke.nrw", "dielinke.brandenburg", "DIELINKE.Potsdam", "Hundestrasse14", "DieLinkeHessen", "dielinkebw", "DIELINKE.Bayern", "linksfraktion", "DIELINKE.Niedersachsen", "DIELINKE.ApoldaWeimar"]},
    {"name":"fdp", "seiten":["FDP", "fdp.dieliberalen", "fdpbw", "fdpnrw", "fdprlp"]},
    {"name":"christentum", "seiten":["Jesus-täglich-erleben-245097428843878", "Jesus-lebt-164528340324604", "Jesus.Die.Einzige.Hoffnung"]},
    {"name":"islam", "seiten":["IslamDerSchluesselZumParadies", "islamfaktenoffiziell"]},
    {"name":"antifa", "seiten":["Antifaschistisches-Aktionsbündnis-Stuttgart-und-Region-260705110668693"]},
    {"name":"npd", "seiten":["npd.de", "npd.sachsen", "afdnpd", "npdnrw", "npdmup"]},
 ];

//Executing

let timeOffset = 0;
let requests = 0;
let requestsToDo = 0;
let commentCount = 0;

client = redis.createClient();
client.on('connect', function() {
    client.select(1, function(err, res){ 
        if(err != null)
            console.log(err)
        else{

            //Main code
            /*client.keys('*', function (err, keys) {
                console.log(keys);
            });*/

            for(let m = 0; m < merkmale.length; m++)
                for(let s in merkmale[m].seiten)
                    downloadPages(baseUrl + merkmale[0].seiten[s] + "/posts" + token, gotPostsPage, {label:merkmale[0].name, page:merkmale[0].seiten[s]});
        }
    });
});

function gotPostsPage(posts, callbackArg, getPreviousPage, getNextPage){

    if(posts != undefined)
        for(let i in posts)
        {
            if(posts[i].message != "" && posts[i].message != " " && posts[i].message != null && posts[i].message != undefined)
                client.lpush(callbackArg.label + "_" + callbackArg.page, posts[i].message, function(err, reply){if(err != null) console.log(err);});

            downloadPages(baseUrl + posts[i].id + "/comments" + token, gotCommentsPage, callbackArg);
        }
    else
        console.log("Posts undefined :(");

    //console.log(getPreviousPage);
    //console.log(getNextPage);

    if(getNextPage != undefined)
        getNextPage();
}

function gotCommentsPage(comments, callbackArg, getPreviousPage, getNextPage)
{
    if(comments != undefined)
    {
        console.log("= " + (commentCount += comments.length));
        for(let i in comments)
        {
            if(comments[i].message != "" && comments[i].message != " " && comments[i].message != null && comments[i].message != undefined)        
                client.lpush(callbackArg.label + "_" + callbackArg.page, comments[i].message, function(err, reply){if(err != null) console.log(err);});
        }
    }
    else
        console.log("Comments undefined :(");

    //console.log(getPreviousPage);
    //console.log(getNextPage);

    if(getNextPage != undefined)
        getNextPage();
}

//Supporting function

function downloadPages(url, callback, callbackArg)
{   
    requestsToDo++;
    setTimeout(function(){
        request(url, function(error, response, body){
            
            console.log("Requests done: " + requests++ + " / " + requestsToDo + " (" + (requests / requestsToDo) + ")");

            let res;
            try {
                res = JSON.parse(body);
            }catch(e){
                console.log("JSON ERROR: ");
                console.log(e);
                console.log("Body:");
                console.log(body);
                console.log("Response:");
                console.log(response);
                callback([], callbackArg, undefined, undefined);
            }

            if(res != undefined)
            {
                let getNextPage;
                let getPreviousPage;

                if(res.paging != undefined)
                {
                    if(res.paging.previous != undefined)
                    {
                        getPreviousPage = function(){downloadPages(res.paging.previous, callback, callbackArg);};
                    }

                    if(res.paging.next != undefined){
                        getNextPage = function(){downloadPages(res.paging.next, callback, callbackArg);};
                    }
                }

                callback(res.data, callbackArg, getPreviousPage, getNextPage);
            }
        });
    }, timeOffset += 25);
}