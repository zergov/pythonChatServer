
var username;
var userColor;
var chatTarget = null;

var socket = io.connect('http://'+ location.hostname +':5000/chat');

window.onbeforeunload = function(e)
{
    socket.disconnect();
};

// setup the inital display ( show username form )
initDisplay();

// ui element
var usernameInput = $('#username-input');
var joinChatBtn = $('#joinChat-btn');
var chatArea = $('#messages-box');
var onlineUserList = $('#connected-users-list');
var sendButton = $('#send-btn');
var messageInput = $('#user-message-input');

// Event binding
usernameInput.keyup(usernameOnChange);
joinChatBtn.click(allowUser);
sendButton.click(sendMessage);

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

    // register this user on the server
    socket.emit('register', {'username' : username});
    socket.emit('get_user_list');
}

// remove the element of the disconnected user from the online
// users's list
function removeOnlineUser(user)
{
    onlineUserList.children('a').each(function () {
        if(this.text === user)
            this.remove();
    });
}

// add an element in the online user's list
function addOnlineUser(user)
{
    var item = '<a href="#" onclick="targetUser(this)" class="list-group-item">'+ user +'</a>';
    onlineUserList.append(item);
}

// target a user from the list to send messages to
function targetUser(user)
{
    chatTarget = user.text;
    console.log('Target is now : ' + chatTarget);
}

// sends a message to the server
function sendMessage()
{
    content = messageInput.val();

    if(chatTarget == null)
        message = {'from': username, 'text': content};
    else
        message = {'from': username, 'text': content, 'to': chatTarget};

    socket.emit('message', message);

    // clear the input area
    messageInput.val('');
}


function receiveMessage(message)
{
    if(message['private'] === true)
    {
        element = "<span class='user-message'> >" + message['from'] + "< : "+ message['text'] +"</span>";
        chatArea.append(element);
    }
    else
    {
        element = "<span class='user-message'>[" + message['from'] + "] : "+ message['text'] +"</span>";
        chatArea.append(element);
    }
}


// Websocket Event handling
socket.on('connect', function(){
    console.log('connect to server !');
});

socket.on('message', function(data){
    console.log(data);
    receiveMessage(data);
});

socket.on('disconnect', function(data){
    console.log('disconnected from server !');
});

// Custom Websocket Event handling
socket.on('on_client_list_received', function(message){

    // wipe the old userlist
    onlineUserList.html('');

    users = JSON.parse(message);

    for(i in users)
    {
        // prevent to display ourselves in the list of users
        if(users[i] !== username)
            addOnlineUser(users[i]);
    }
});

// Update the list of online users
socket.on('user_registered', function(user){

    console.log(user + ' joined chat !');

    if(user !== username)
        addOnlineUser(user);
});

// Handle a user disconnecting
socket.on('user_disconnected', function(user){

    console.log(user + ' disconnected !');
    removeOnlineUser(user);

    if(user === chatTarget)
        chatTarget = null;
});
