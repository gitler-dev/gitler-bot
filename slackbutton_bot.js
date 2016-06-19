/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack Button application that adds a bot to one or many slack teams.

# RUN THE APP:
  Create a Slack app. Make sure to configure the bot user!
    -> https://api.slack.com/applications/new
    -> Add the Redirect URI: http://localhost:3000/oauth
  Run your bot from the command line:
    clientId=<my client id> clientSecret=<my client secret> port=3000 node slackbutton_bot.js
# USE THE APP
  Add the app to your Slack by visiting the login page:
    -> http://localhost:3000/login
  After you've added the app, try talking to your bot!
# EXTEND THE APP:
  Botkit has many features for building cool and useful bots!
  Read all about it here:
    -> http://howdy.ai/botkit
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

    /* Uses the slack button feature to offer a real time bot to multiple teams */
    var Botkit = require('botkit');
    var fs = require('fs')
    var _ = require('underscore')
    var gitcli = require('./gitcli.js')
    var Promise = require('bluebird')


//defer promies 
function defer() {
  var resolve, reject;
  var promise = new Promise(function() {
    resolve = arguments[0];
    reject = arguments[1];
  });
  return {
    resolve: resolve,
    reject: reject,
    promise: promise
  };
}

var controller = Botkit.slackbot({
  json_file_store: './db_slackbutton_bot/',
}).configureSlackApp(
{
  clientId: "52190302359.52209798785",
    clientSecret: "94822d98f44095d1e5606af506f11e98", //refresh these tokens when publishing :)
    scopes: ['bot'],
  }
  );

controller.setupWebserver(3000,function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver);

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});



// just a simple way to make sure we don't
// connect to the RTM twice for the same team
var _bots = {};
function trackBot(bot) {
  var promises = []
  // @ https://api.slack.com/methods/users.list
  promises.push(new Promise(function(res, rej){
    bot.api.users.list({}, function (err, response) {
        var fullTeamList = []
        if (response.hasOwnProperty('members') && response.ok) {
            var total = response.members.length;
            for (var i = 0; i < total; i++) {
                var member = response.members[i];
                fullTeamList.push({name: member.name, id: member.id});
            }

            res(fullTeamList)
        }
    });
  }))

  promises.push(new Promise(function(res, rej){
  // @ https://api.slack.com/methods/channels.list
    bot.api.channels.list({}, function (err, response) {
        if (response.hasOwnProperty('channels') && response.ok) {
            var total = response.channels.length;
            var fullChannelsList = []
            for (var i = 0; i < total; i++) {
                var channel = response.channels[i];
                fullChannelsList.push({name: channel.name, id: channel.id});
            }

            res(fullChannelsList)
        }
    });
  }))


  Promise.all(promises).then(function(results) {
    _bots[bot.config.token] = {bot: bot,
                               team: results[0],
                               channels: results[1]};

    bot.say({text: "No.", channel: results[1][0]["id"]})
  })
}

controller.on('create_bot',function(bot,config) {

  if (_bots[bot.config.token]) {
    // already online! do nothing.
  } else {
    bot.startRTM(function(err) {

      if (!err) {
        trackBot(bot);
      }

      bot.startPrivateConversation({user: config.createdBy},function(err,convo) {
        if (err) {
          console.log(err);
        } else {
          convo.say('I am a bot that has just joined your team');
          convo.say('You must now /invite me to a channel so that I can be of use!');
        }
      });

    });
  }

});


// Handle events related to the websocket connection to Slack
controller.on('rtm_open',function(bot) {
  console.log('** The RTM api just connected!');
});

controller.on('rtm_close',function(bot) {
  console.log('** The RTM api just closed');
  // you may want to attempt to re-open
});

controller.hears('hello','direct_message',function(bot,message) {
  bot.reply(message,'Hello!');
});

controller.hears('^stop','direct_message',function(bot,message) {
  bot.reply(message,'Goodbye');
  bot.rtm.close();
});

//respondToMessageWith lintResult bot.startPrivateConversation({user: config.createdBy},function(err,convo) {

function sendLintResultTo(email) {
  //we need to find the user with that email, but let's go by me now
  //we also need to find that email's team to find that team's bot

  bot = _bots[Object.keys(_bots)[0]]["bot"]
  startConversationAndSendLintResult(bot, {text: "Hello!", user: "U1J5S0UGH"})
}

var startConversationAndSendLintResult = function(bot,message) {
  var fileLintPromises = {}
  var LintStream = require('jslint').LintStream();
  debugger
  bot.startPrivateConversation({user: message.user}, function(err, conv){

    gitcli.getFilesChangedFromGit(__dirname, "HEAD", "HEAD~1").then(function(files){
      conv.say("*Here's the files you committed:*")

      files.forEach(function(e){
        if (typeof e.file == "undefined") return false

          conv.say("> *" + e.file + "*")
        
        fileLintPromises[e.file] = defer()
        LintStream.write(e)
      })

      conv.say("Processing \n\n")  
      var promises = _.map(fileLintPromises, function(e){return e.promise})

      Promise.all(promises).then(function(lintResults){

        lintResults.forEach(function(result){
          conv.say("\n")
          conv.say("> *" + result.file + "*" )
          conv.say("we have " + result.errors.length + " errors here")
          if (result.errors.length > 3) 
          {
            conv.say("How about you fix these 3 first?")
            result.errors = result.errors.slice(0, 3)
          }

          result.errors.forEach(function(error) {
            conv.say('`' + error.evidence + '`')
            conv.say("> " + error.reason)
          })

        })
        
      }).catch(function(wtf){
        debugger

      }).then(function(){
        conv.ask("\nThat's all! Will you fix these yourself?", function(response, askConv){

          askConv.say(response.text + "? I don't care either way, go fuck yourself")
          askConv.say("TODO: Let me fix these myself")
          askConv.next()
        })
      })

    })

    LintStream.on('data', function (chunk, encoding, callback) {
      var errors = [] 

      _(chunk.linted.errors).map(function(e){ 
        if (!e || !e.reason) return false; 
        
        return {reason: e.reason, evidence: e.evidence} 
      }).forEach(function(e){
        errors.push( {evidence: e.evidence, reason: e.reason } )
      })

      fileLintPromises[chunk.file].resolve({file: chunk.file, errors: errors})
      
      if (callback)
        callback()
      


    });

  })


  
  
}

controller.hears('lint',['direct_message', 'direct_mention'], function(){
  sendLintResultTo("nullstring")
});

controller.on(['direct_message','mention','direct_mention'],function(bot,message) {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face',
  },function(err) {
    if (err) { console.log(err) }
      bot.reply(message,'I heard you loud and clear boss.');
  });
});

controller.storage.teams.all(function(err,teams) {

  if (err) {
    throw new Error(err);
  }

  // connect all teams with bots up to slack!
  for (var t  in teams) {
    if (teams[t].bot) {
      controller.spawn(teams[t]).startRTM(function(err, bot) {
        if (err) {
          console.log('Error connecting bot to Slack:',err);
        } else {
          trackBot(bot);
        }
      });
    }
  }

});