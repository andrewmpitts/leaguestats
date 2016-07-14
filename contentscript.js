let scriptRun = 0;
window.onpopstate = function (event) {
    if (document.getElementById("killstats_tab") == null && document.getElementsByClassName("tab-panel").length == 0 && scriptRun == 0) {
        init(extractGameId(document.location.href));
        scriptRun = 1;
        setTimeout(function(){
            scriptRun = 0;
        }, 2000);
        
    }
};

MAP_MIN = { x: 0, y: 0};
MAP_MAX = { x: 14820, y: 14881};

function getCountryCode(regionCode, language) {
    if (regionCode == "eune") {
        let euneCodes = {
            en: "GB",
            cs: "CZ",
            el: "GR",
            hu: "HU",
            pl: "PL",
            ro: "RO"
        };
        return euneCodes[language];
    }
    if (regionCode == "euw") {
        let euwCodes = {
            en: "GB",
            es: "ES",
            fr: "FR",
            it: "IT",
            de: "DE"
        };
        return euwCodes[language];
    }
    let countryCodes = {
        na: "US",
        br: "BR",
        eune: "GB",
        euw: "GB",
        jp: "JP",
        kr: "KR",
        lan: "MX",
        las: "MX",
        oce: "GB",
        ru: "RU",
        tr: "TR"
    };
    return countryCodes[regionCode];
}

function extractRegionCodes(url) {
    let result = /matchhistory\.([a-z]+?)\.leagueoflegends.com\/([a-z]+?)\/#match-details\/([A-Z0-9]+?)\//.exec(url);
    return result ? [result[1], result[2], result[3]]: extractAltRegionCodes(url);
}

function extractAltRegionCodes(url) {
    let result = /matchhistory\.leagueoflegends\.co\.([a-z]+?)\/([a-z]+?)\/#match-details\/([A-Z0-9]+?)\//.exec(url);
    return result ? [result[1], result[2], result[3]]: result;
}


// returns container of elements of class "tab-panel-body"
function getFrameContainers() {
    return document.getElementsByClassName("tab-panel-body");
}

// Gets player data
function parsePlayerData(playerData) {
    parsedPlayerData = {};
    playerData.participantIdentities.forEach(function(element, index){
        parsedPlayerData[element.participantId] = {
            championId: playerData.participants[index].championId,
            summonerName: element.participantId.player === undefined ? "null" : element.player.summonerName,
            team: index < 5 ? "blue" : "red"
        };
    });
    return parsedPlayerData;
}

// Adds champion names to player data
function parseChampionData(championData, playerData) {
    var championNames = {};
    for (champion in championData.data) {
        championNames[championData.data[champion].key] = championData.data[champion].name;
    }
    for (player in playerData) {
        playerData[player].championName = championNames[playerData[player].championId];
    }
    return playerData;
}

// Gets kills from timeline data
function parseTimelineData(timelineData, playerData) {
    var kills = [];

    timelineData.frames.forEach(function(frame){
        frame.events.forEach(function(event) {
            if (event.type == "CHAMPION_KILL") {
                kills.push({
                    killerId : event.killerId,
                    killerTeam:  event.killerId < 1 ? "neutral" : playerData[event.killerId].team,
                    killerChampion: event.killerId < 1 ? "Execution" : playerData[event.killerId].championName,
                    killerSummonerName: event.killerId < 1 ? "" : playerData[event.killerId].summonerName,
                    victimId: event.victimId,
                    victimTeam:  event.victimId <= 5 ? "blue" : "red",
                    victimChampion: playerData[event.victimId].championName,
                    victimSummonerName: playerData[event.victimId].summonerName,
                    killTime: event.timestamp,
                    killPosition: [event.position.x, event.position.y]
                });
            }
        });
    });

    return kills;
}

// takes a parameter of milliseconds and returns a minute:seconds formatted string, like MM:SS
function convertTime(time) {
    var time = time * 0.001;
    var minutes = Math.floor(time / 60).toString();
    var seconds = Math.floor(time - (minutes * 60)).toString();
    if (seconds.length < 2) {
        seconds = "0" + seconds;
    }
    if (minutes.length < 2) {
        minutes = "0" + minutes;
    }
    return minutes + ":" + seconds;
}

// Searches the current tab's url and returns the game ID
function extractGameId(url) {
    let result = /#match-details\/.+?\/([0-9]+)/.exec(url);
    return result ? result[1]: result;
    
}

// Adds click event listeners and classes to match tab buttons
function updateTabUI() {
    var tabParentNodes = document.getElementsByClassName("tab-panel-header")[0].childNodes[0].childNodes;
    for (var i = 0; i < tabParentNodes.length; i++) {
        tabParentNodes[i].style = "width:200px;margin-left:17px;margin-right:17px;margin-bottom:8px;";
    }
    var tabNodes = document.getElementsByClassName("tab");
    for (var i = 0; i < tabNodes.length; i++) {
        document.getElementById(tabNodes[i].id).style.width = "200px";
        document.getElementById(tabNodes[i].id).style.margin = "0px;";
        
        document.getElementById(tabNodes[i].id).addEventListener("click", function() {
            document.getElementById("killstats_tab").className = "tab";
            document.getElementById("killstats_frame_container").style = "display: none;";
        });
    }

    document.getElementById("killstats_tab").addEventListener("click", function() {
        for (var n = 0; n < tabNodes.length; n++) {
            document.getElementById(tabNodes[n].id).className = "tab";
        }
        document.getElementById("killstats_tab").className = "tab active";
        document.getElementById("killstats_frame_container").style = "display: block;";
    });

}

// Creates the killstats tab button and adds an onclick function
// to the button that hides non-killstat data.
function createKillStatsTab(tabContainer, frameContainers) {
    
    var container = tabContainer[0].childNodes[0].childNodes;
    var div = document.createElement("div");
    var tab = document.createElement("div");
    var t = document.createTextNode("Kill Timeline");
    tab.className = "tab";
    tab.id = "killstats_tab"
    container[0].appendChild(div);
    div.appendChild(tab);
    tab.appendChild(t);
    tab.style = "width: 200px;";

    tab.onclick = function() {
        document.getElementById("killstats_tab").className = "tab active";
        for (var i = 0; i < frameContainers.length; i++) {
            frameContainers[i].style.display = "none";
        }
    };
}

// Adds killstats button to the DOM
function addKillstatsButton(tabContainer) {
    var frameContainers = getFrameContainers()[0].childNodes;
    createKillStatsTab(tabContainer, frameContainers);
    var tabPanel = document.getElementsByClassName("header-primary");

}

// Creates and adds the killstat frame HTML to the DOM
function addKillstatsHTML(playerKillData) {
    var frameContainers = getFrameContainers();
    var contentContainerDiv = document.createElement("div");
    var contentSubcontainerDiv = document.createElement("div");
    var contentBorderDiv = document.createElement("div");
    var contentHeader = document.createElement("header");
    var contentHeaderH1 = document.createElement("h1");

    //Add properties to contentContainerDiv
    contentContainerDiv.id = "killstats_frame_container";
    contentContainerDiv.className = "killstats_frame_container";
    contentContainerDiv.style = "display:none";

    //Add properties to contentBorderDiv
    contentBorderDiv.id = "killstats_frame_border";
    contentBorderDiv.className = "content-border";

    //Add properties to contentHeader
    contentHeader.id = "killstats_header";
    contentHeader.className = "header-primary";

    //Add properties to contentHeaderH1
    contentHeaderH1.id = "killstats_h1";
    contentHeaderH1.className = "killstats_h1";
    contentHeaderH1.innerHTML = "Kill Timeline";

    //Add header
    contentBorderDiv.appendChild(contentHeader);
    contentHeader.appendChild(contentHeaderH1);

    contentContainerDiv.appendChild(contentSubcontainerDiv);
    contentSubcontainerDiv.appendChild(contentBorderDiv);
    frameContainers[0].appendChild(contentContainerDiv);

    // Add killstats table
    var contentTable = document.createElement("table");
    var contentTableHeaders = document.createElement("tr");

    //table style and html
    var tableStyle = "<style type='text/css'>.red {color:#F23C1D;} .blue {color:#0C82F0;} .neutral {color:#848786;}  .tg {border-collapse:collapse;border-spacing:0;}.tg td{text-align:center;font-size:1.1em;padding:10px 5px;overflow:hidden;word-break:normal;width: 333px; margin: auto;}.tg th{font-family:Arial, sans-serif;font-size:1.2ems;font-weight:bold;padding:10px 5px;overflow:hidden;word-break:normal;text-align:center;}.tg .tg-header{vertical-align:top;}</style>";
    var tableHtml = "<table class='tg'><tr><th class='tg-header'>Time</th><th class='tg-header'>Killer</th><th class='tg-header'>Victim</th>" + generateTable(playerKillData) + "</tr></table>";
    var aboutLink = "<div class = 'aboutContainer' style = 'width:100%; margin: auto;'><div class = 'aboutLink' style = 'text-align: center;color: black; margin: auto;font-size: 0.8em;'>Chrome Extension by <a href='mailto:leaguestatsextension@gmail.com'>Andrew Pitts</a></div></div>"
    //adds style and html to table elements
    contentBorderDiv.innerHTML += tableStyle;
    contentBorderDiv.innerHTML += tableHtml;
    contentBorderDiv.innerHTML += aboutLink;

}

// Creates the killstat table HTML
function generateTable(playerKillData) {
    var tableRows = "";
    var enemyColor = {red: "#F23C1D", blue: "#0C82F0", neutral: "#848786"};
    for (var kill in playerKillData) {
        tableRows += "<tr class = '" + playerKillData[kill].killerTeam + "'><td>" + convertTime(playerKillData[kill].killTime)
                     + "</td><td class='tg'>" + playerKillData[kill].killerChampion + "</td><td class='tg-enemy' style='color:" + enemyColor[playerKillData[kill].victimTeam] + ";'>" + playerKillData[kill].victimChampion
                     + "</td></tr>";
    }
    return tableRows;
}

// Initializes UI changes
function initUI(playerData, killData) {
    var tabContainer = document.getElementsByClassName("tab-panel");
    if (tabContainer.length == 0 && document.getElementById("killstats_tab") == null) {
        setTimeout(function(){
            if (document.getElementById("killstats_tab") != null) {
                return;
            }
            addKillstatsHTML(killData);
            addKillstatsButton(tabContainer);
            updateTabUI();
        }, 1000);
    } else if (document.getElementById("killstats_tab") == null) {
        addKillstatsHTML(killData);
        addKillstatsButton(tabContainer);
        updateTabUI();
    }

}

// Initializes program
function init(gameId) {
    if (document.getElementById("killstats_tab") != null || document.getElementById("killstats_tab") != null || document.location.href.indexOf("#match-history") > -1) {
        return;
    }
    var fetchJSON = function(url) {
        return new Promise((resolve, reject) => {
            var request = new XMLHttpRequest();
            request.open('GET', url);

            request.onload = function() {
                if (request.status == 200) {
                    resolve(JSON.parse(request.response));
                }
                else {
                    reject(Error(request.statusText));
                }
            };

            request.onerror = function() {
              reject(Error("Network Error"));
            };

            request.send();
                });
    }
    let regionURLCodes = extractRegionCodes(document.location.href);

    let countryCode = getCountryCode(regionURLCodes[0], regionURLCodes[1]);
    let urls = [
            "https://acs.leagueoflegends.com/v1/stats/game/" + regionURLCodes[2] + "/" + gameId,
            "http://ddragon.leagueoflegends.com/cdn/6.12.1/data/" + regionURLCodes[1] + "_" + countryCode  + "/champion.json",
            "https://acs.leagueoflegends.com/v1/stats/game/" + regionURLCodes[2] + "/" + gameId + "/timeline"
        ]
    promises = urls.map(fetchJSON);

    Promise.all(promises)
        .then(function(results) {
            parsedData = {};
            parsedData.playerChampionRes = parseChampionData(results[1], parsePlayerData(results[0]));
            parsedData.killRes = parseTimelineData(results[2], parsedData.playerChampionRes);

            initUI(parsedData["playerChampionRes"], parsedData["killRes"]);
        })
        .catch(function(err) {
            console.log("Failed:", err);
        });
}

var gameId = extractGameId(document.location.href);
init(gameId);