let timezone = '+00:00';
let momentLoaded = true;
let globalCalendar;
timezone = moment().format('Z');
let parseTZ = function (utc) {
	switch (utc) {
		case '-12:00':
		case '-11:00':
			return 'Pacific%2FNiue'
		case '-10:00':
			return 'Pacific%2FTahiti'
		case '-09:30':
			return 'Pacific%2FMarquesas'
		case '-09:00':
			return 'Pacific%2FGambier'
		case '-08:00':
			return 'Pacific%2FPitcairn'
		case '-07:00':
			return 'America%2FWhitehorse'
		case '-06:00':
			return 'America%2FSwift_Current'
		case '-05:00':
			return 'America%2FGuayaquil'
		case '-04:00':
			return 'America%2FPort_of_Spain'
		case '-03:30':
		case '-03:00':
			return 'America%2FParamaribo'
		case '-02:30':
			return 'America%2FSt_Johns'
		case '-02:00':
			return 'America%2FMiquelon'
		case '-01:00':
			return 'Atlantic%2FCape_Verde'
		case '+00:00':
		case '-00:00':
			return 'Atlantic%2FSt_Helena'
		case '+01:00':
			return 'Europe%2FJersey'
		case '+02:00':
			return 'Europe%2FSarajevo'
		case '+03:00':
			return 'Africa%2FAddis_Ababa'
		case '+04:00':
			return 'Asia%2FMuscat'
		case '+04:30':
		case '+05:00':
			return 'Asia%2FOral'
		case '+05:30':
			return 'Asia%2FKolkata'
		case '+05:45':
			return 'Asia%2FKathmandu'
		case '+06:00':
			return 'Asia%2FOmsk'
		case '+06:30':
			return 'Asia%2FYangon'
		case '+07:00':
			return 'Asia%2FPhnom_Penh'
		case '+08:00':
			return 'Asia%2FUlaanbaatar'
		case '+08:30':
			return 'Asia%2FPyongyang'
		case '+08:45':
			return 'Australia%2FEucla'
		case '+09:00':
			return 'Asia%2FChita'
		case '+09:30':
			return 'Australia%2FBroken_Hill'
		case '+10:00':
			return 'Australia%2FSydney'
		case '+10:30':
			return 'Australia%2FLord_Howe'
		case '+11:00':
			return 'Pacific%2FNorfolk'
		case '+12:00':
			return 'Asia%2FAnadyr'
		case '+12:45':
			return 'Pacific%2FChatham'
		case '+13:00':
		case '+14:00':
			return 'Pacific%2FEnderbury'
	}
}
let parseCalendar = function (data) {
	let monthAndYear = $(data).find('#calendar')[0].childNodes[1].childNodes[1].childNodes[3].childNodes[3].childNodes[1].innerText;
	let month = monthAndYear.split(' ')[0];
	let year = monthAndYear.split(' ')[1];
	let nodes = $(data).find('#calendar')[0].childNodes[1].childNodes[5].children;
	let calendar = [];
	for(let i=0; i<nodes.length; i++) {
		let schedGroup = nodes[i].children[0];
		if (schedGroup) {
			let dayObject = {};
			dayObject.day = month + ' ' + Number(schedGroup.children[0].innerText.split(' ')[1]) + ', ' + year;
			dayObject.animes = [];
			let animes = schedGroup.children[1].children;
			for (let j=0; j<animes.length; j++) {
				let animeObject = {};
				let release = animes[j].children[1].children[1].innerText.split(' ');
				animeObject.name = animes[j].children[1].children[0].innerText + ' - ' + release[0] + ' ' + release[1];
				animeObject.release = moment(dayObject.day + ' ' + release[3] + ' -0500', 'MMM DD, YYYY HH:mm Z').format();
				animeObject.hyperlink = animes[j].children[1].children[0].href;
				dayObject.animes.push(animeObject);
			}
			calendar.push(dayObject);
		}
	}
	return calendar;
}
let getCalendar = function (month) {
	console.log(timezone);
	let vardata;
	$.ajax({
			 url: "https://9anime.to/schedule",
			 type: "GET",
			 data: {
				 'date': month,
				 'tz': timezone
			 },
			 crossDomain: true,
			 headers: {
				'Accept':'application/json, text/javascript, */*; q=0.01',
				'X-DevTools-Emulate-Network-Conditions-Client-Id':'0abc8a98-1b67-42ab-9ae1-b86b894d8d60',
				'X-Requested-With':'XMLHttpRequest',
				'X-DevTools-Request-Id':'9444.1270',
				'Accept-Language':'en-US,en;q=0.8',
			 },
			 async: false,
			 success: function(data) {
				 vardata = data;
			 }
		  });
	return parseCalendar(vardata)
}
let updateCalendar = function () {
	chrome.extension.getBackgroundPage().console.log("Updating calendar!");
	if (!globalCalendar) {
		globalCalendar = getCalendar(moment().format('YYYY-MM'))
	}
	else {
		if (moment(globalCalendar[0].day, 'MMM DD, YYYY').format('MMM, YYYY') != moment().format('MMM, YYYY')) {
			globalCalendar = getCalendar(moment().format('YYYY-MM'));
			chrome.extension.getBackgroundPage().console.log("New month! Updating calendar!");
		}
	}
	return globalCalendar;
}
let Notification = ( function (){
    let notification = null;
  
    return {
        display: function (hlink, opt){
            notification = chrome.notifications.create(hlink, opt, function(notificationId){ });
            notification.show();
        },
        hide: function (){
            notification.close();
        }
    };
})();
let checkAlarm = function () {
	let data = updateCalendar();
		if (data) {
			for (let i=0; i<data.length; i++) {
				for (let j=0; j<data[i].animes.length; j++) {
					if (moment(data[i].animes[j].release) >= moment() && moment(data[i].animes[j].release) < moment().add(5, 'minutes')) {
						let opt = {
							type: "basic",
							title: data[i].animes[j].name,
							message: "New episode has been released on 9Anime!",
							iconUrl: "https://9anime.to/favicons/favicon.png",
							requireInteraction: true
						};
						Notification.display(data[i].animes[j].hyperlink, opt);
					}
				}
			}
		}
		else {
			updateCalendar();
		}
}
chrome.alarms.create("5min", {
  delayInMinutes: 5,
  periodInMinutes: 5
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === "5min") {
    checkAlarm();
  }
});

chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.extension.getBackgroundPage().console.log(updateCalendar());
	alert("9Anime Notifier is already running!")
});

chrome.notifications.onClicked.addListener(function (notificationId) {
	chrome.tabs.create({url: notificationId});
	chrome.notifications.clear(notificationId);
});