/*jslint browser:true, sloppy: true, plusplus: true */
/*globals $: false, config: false */

var dashboardLastUpdatedTime = new Date();

var jenkinsDashboard = {
  addTimestampToBuild : function (elements) {
    elements.each(function () {
      var worker = $(this).attr("class"),
      y = parseInt($(this).offset().top + $(this).height() / 2) - 16,
      x = parseInt($(this).offset().left + $(this).width() / 2) - 16,
      id = x + "-" + y,
      html = '<div class="job_disabled_or_aborted" id="' + id + '">' + worker + '</div>',
      new_element;
      $("#content").append(html);
      new_element = $("#" + id);
      new_element.css("top", parseInt(y - new_element.height() / 2)).css("left", parseInt(x - new_element.width() / 2));
      new_element.addClass('rotate');
      $(this).addClass('workon');
    });
  },

  // Composes and injects the dashboard HTML content.
  componseHtmlContent: function(jobs) {
    var content = new String;

    content += jenkinsDashboard.composeHtmlEnvironmentSections(jobs);
    dashboardLastUpdatedTime = new Date();
    content += "<article class='time'>" + dashboardLastUpdatedTime.toLocaleString()  + "</article>";

    $("#content").html(content);
  },

  // Composes and returns HTML sections for each environment.
  composeHtmlEnvironmentSections: function(jobs) {
    var sections = new String;

    config.environments.forEach(function(environment) {
      var matches = new Array;

      jobs.forEach(function(job) {
        if (job.name.match(new RegExp(environment + "$"))) {
          // Remove the environment name from the job to reduce clutter.
          job.name = job.name.replace(new RegExp("(-)?(?!firefox)" + environment), "");
          matches.push(job);
        }
      });

      sections += "<section>"
      sections += "<h1>" + environment + "</h1>";
      sections += jenkinsDashboard.composeHtmlJob(matches);
      sections += "</section>"
    });

    return sections;
  },

  // Composes and returns HTML articles for each job.
  composeHtmlJob: function (jobs) {
    var article = new String;
    var jobs_to_be_filtered = config.jobs_to_be_filtered,
        jobs_to_be_excluded = config.jobs_to_be_excluded;
    $.each(jobs, function () {
      if ((jobs_to_be_filtered.length === 0 || $.inArray(this.name, jobs_to_be_filtered) !== -1) && ($.inArray(this.name, jobs_to_be_excluded) === -1) && this.color != 'grey' && this.color != 'disabled') {
        article += ("<article class=" + this.color + "><head>" + jenkinsDashboard.filterName(this.name)+ "</head></article>");
      }
    });

    return article;
  },

  updateBuildStatus : function (data) {
    jenkinsDashboard.componseHtmlContent(data.jobs);
    jenkinsDashboard.addTimestampToBuild($(".disabled, .aborted"));
  },

  filterName: function(name) {
    name = name.replace(/^acceptance\-/, '');
    name = name.replace(/^jslint.*\-/, 'js');
    return name;
  }
};

$(document).ready(function () {

  var ci_url = config.ci_url + "/api/json",
  counter = 0,
  lastData = null,
  auto_refresh;

  if (!ci_url.match(/^http/)) { ci_url = "http://" + ci_url; }
  auto_refresh = setInterval(function () {
    counter++;
    $.jsonp({
      url: ci_url + "?format=json&jsonp=?",
      dataType: "jsonp",
      timeout: 10000,
      beforeSend: function (xhr) {
        if (counter === 1) {
          $.blockUI({
            message: '<h1 id="loading"><img src="img/busy.gif" />loading.....</h1>'
          });
        }
      },
      success: function (data, status) {
        $.unblockUI();
        jenkinsDashboard.updateBuildStatus(data);
      },
      error: function (XHR, textStatus, errorThrown) {
        if ($("#error_loading").length <= 0) {
          $.blockUI({
            message: '<h1 id="error_loading"> Ooooops, check out your network etc. Retrying........</h1>'
          });
        }
      }
    });
  }, 10000);

});
