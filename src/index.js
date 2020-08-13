const poller = require("github-event-poller");
var GET = require("get-then");

var buffer = [];
var firstElement = true;
var sendWebCount = false;

$("#startButton").click(function () {
  const ghtoken = document.getElementById("githubTokenField").value;
  const url = `https://${ghtoken}@api.github.com/events`;

  function addElementToList() {
    const item = buffer.shift();

    const avatarUrl = item.actor.avatar_url;
    const username = item.actor.login;
    const eventCreated = item.created_at;
    const commits = item.payload.commits || [];

    var commitElements = "";
    commits.forEach(function (item, index) {
      commitElements += `
        <p class="subtitle is-6">
        ${item.message}</br>
         - <a href="${item.url}">${item.sha}</a>
        </p>
        `;
    });

    var payloadRef = item.payload.ref;

    var issue = "";
    if (item.payload.issue) {
      const issueUrl = item.payload.issue.html_url;
      const issueTitle = item.payload.issue.title;
      const issueBody = item.payload.issue.body;
      const issueNumber = item.payload.issue.number;
      issue += `
        <p class="subtitle is-6">
        issue #${issueNumber}: ${issueTitle}</br>
        ${issueBody}</br>
         - <a href="${issueUrl}">issue #${issueNumber}</a>
        </p>
        `;
    }
    var member = "";
    if (item.payload.member) {
      member += `
        <p class="subtitle is-6">
        ${username} added to repo
        </p>
        `;
    }

    var pullRequest = "";
    if (item.payload.pull_request) {
      member += `
        <p class="subtitle is-6">
        ${username} ${item.payload.action} pull request #${item.payload.pull_request.number}</br>
        ${item.payload.pull_request.title}</br>
        ${item.payload.pull_request.body}</br>
        </p>
        `;
    }

    const userUrl = `https://github.com/${username}`;
    const repoUrl = `https://${ghtoken}@${item.repo.url.replace(
      /^https?\:\/\//i,
      ""
    )}`;
    GET(repoUrl)
      .then((buffer) => {
        if (!sendWebCount) {
          sendWebCount = true;
          let xmlHttp = new XMLHttpRequest();
          xmlHttp.open(
            "GET",
            "https://hitcounter.pythonanywhere.com/count",
            false
          );
          xmlHttp.send(null);
        }
        const data = JSON.parse(buffer);
        const repoForksCount = data.forks_count;
        const repoDescription = data.description;
        const repoName = data.name;
        const repoOpenIssues = data.open_issues_count;
        const repoStars = data.stargazers_count;
        const repoLanguage = data.language;
        const repoLicense = data.license;
        const repoUrl = data.html_url;
        var forked = item.payload.forkee
          ? `${username} forked ${repoName}`
          : "";

        var $elem = $(`
        <div>
        <div class="card">
            <div class="card-content">
                <div class="media">
                    <div class="media-left">
                        <figure class="image is-64x64">
                        <img src="${avatarUrl}" alt="${username} avatar">
                        </figure>
                    </div>
                    <div class="media-content">
                        <p class="title is-6">
                    repo: <a href="${item.repo.url}">${repoName}</a> [${
          repoLanguage || "?"
        } / ${repoStars} stars]
                    </p>
                    <p class="subtitle is-6">
                    user: <a href="${userUrl}">${username}</a><br>
                    time: <time datetime="${eventCreated}">${eventCreated}</time>

                    </p>

                    </div>
                </div>
            
                <div class="content">
                    <p class="subtitle is-4">
                    ${repoDescription || repoName}
                    </p>
                    ${
                      commitElements ||
                      payloadRef ||
                      issue ||
                      member ||
                      pullRequest ||
                      forked
                    }
                    
                </div>
            </div>
        </div>
        </br>
        </div>

        `)
          .prependTo("#listticker")
          .hide();

        $elem.next().animate(
          {
            "margin-top": $elem.height(),
          },
          function () {
            $(this).css("margin-top", "0px");
            $elem.fadeIn();
          }
        );
      })
      .catch(String)
      .then(console.log);
    setTimeout(
      addElementToList,
      2000 + Math.floor(Math.random() * Math.floor(4000))
    );
  }

  poller(url, ({ data, limit, remaining, reset, interval }) => {
    console.log(
      "Rate Limit:",
      JSON.stringify({ limit, remaining, reset, interval })
    );
    buffer.push(...data);
    if (firstElement) {
      addElementToList();
      firstElement = false;
    }
  });

  poller.onerror = (error) => {
    console.log(error);
    return 60;
  };
});
