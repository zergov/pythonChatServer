var username;
var userColor;


var inbox = new WebSocket('ws://' + location.hostname + ':5000/receive');
var outbox = new WebSocket('ws://' + location.hostname + ':5000/send');

// setup the inital display ( show username form )
initDisplay();

// verify user username
var usernameInput = $('#username-input');
var joinChatBtn = $('#joinChat-btn');
var chatArea = $('#messages-box');
usernameInput.keyup(usernameOnChange);

joinChatBtn.click(allowUser);

// setup the initial display
function initDisplay()
{
    $('#chat-dashboard').addClass('blured-area');
    $('#chat-dashboard').css('pointer-events', 'none');

    userColor = [];

    for(i = 0; i < 3; i++)
        userColor[i] = Math.floor(Math.random() * 255) + 0;

    var rgbaColor = 'rgba('+ userColor[0] +','+ userColor[1] +','+ userColor[2] +', 0.5)';
    $('#bg-username').css('background-color', rgbaColor);
}

// verify the username form
function usernameOnChange()
{
    if(usernameInput.val().length > 2)
        joinChatBtn.removeAttr('disabled');
    else
        joinChatBtn.attr('disabled',true);
}

// let the user inside the chat
function allowUser()
{
    // store the username in the variable
    username = usernameInput.val();

    // hide the username form and clear the blur
    $('#bg-username').css('display','none');
    $('#chat-dashboard').css('pointer-events', 'all');
    $('#chat-dashboard').removeClass('blured-area');

    // display the username to the user
    $('#username-span').html(username);

    chatArea.html('');
}


// Event binding
var sendButton = $('#send-btn').click(sendMessage);

function sendMessage()
{
    var message = $('#user-message-input').val();

    outbox.send(JSON.stringify({ username: username, text: message }));
}

inbox.onopen = function()
{
    console.log('Connected to inbox !');
};

outbox.onopen = function()
{
    console.log('Connected to outbox !');
};

inbox.onmessage = function(e)
{
    console.log(e);

    var data = JSON.parse(e.data);
    var messageObj = "<span class='user-message'>[" + data['username'] + "] : "+ data['text'] +"</span>";
    chatArea.append(messageObj);
}
