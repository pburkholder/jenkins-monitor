var dashboardLastUpdatedTime = new Date();

var sounds = new Array();
var soundQueue = {
	add: function(sound_url) {
		sounds.push(sound_url)
	},
	play: function() {
		if (sounds.length > 0) {
			var soundPlayer = $("#sound")[0];
			if (soundPlayer.paused) {
				soundPlayer.src = sounds.shift();
				soundPlayer.play();
			}
		}
	}
}

function soundForCI(data, lastData) {
	if (lastData != null) {
		$(data.jobs).each(function(index) {
			if (lastData.jobs[index] != undefined) {
				if (lastData.jobs[index].color == 'blue_anime' && this.color == 'red') {
					soundQueue.add('http://translate.google.com/translate_tts?q=build+' + this.name + '+faild&tl=en');
				}
				if (lastData.jobs[index].color == 'blue' && this.color == 'blue') {
					soundQueue.add('sounds/build_fail_super_mario.mp3');
				}
			}
		});
	}
	return data;
}
$(document).ready(function() {
	ci_url = ci_url + "/api/json";
	var counter = 0;
	var lastData = null;
	var auto_refresh = setInterval(function() {
		counter++;
		$.jsonp({
			url: ci_url + "?format=json&jsonp=?",
			dataType: "jsonp",
			// callbackParameter: "jsonp",
			timeout: 10000,
			beforeSend: function(xhr) {
				if (counter == 1) {
					$.blockUI({
						message: '<h1 id="loading"><img src="img/busy.gif" />loading.....</h1>'
					});
				};
			},
			success: function(data, status) {
				$.unblockUI();
				lastData = soundForCI(data, lastData);
				jenkinsDashboard.updateBuildStatus(data);
			},
			error: function(XHR, textStatus, errorThrown) {
				if ($("#error_loading").length <= 0) {
					$.blockUI({
						message: '<h1 id="error_loading"> Ooooops, check out your network etc. Retrying........</h1>'
					});
				}
			}
		});
		soundQueue.play();
	}, 4000);
})