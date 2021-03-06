// chat variables
var username;
var userColor;
var chatTarget = null;
var activeConversationObj = null;

var history = {};

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
var conversationList = $('#current-conversations');

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

function checkEnter(e)
{
    if(e.keyCode == 13)
        sendMessage();
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
    onlineUserList.html('');
    conversationList.html('');

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
function targetUser(user) // user is HTML element
{
    var userString = user.text;
    chatTarget = userString;

    console.log('targeting : ' + userString);

    if(userString in history)
    {
        console.log('found ' + userString + ' in history');
        var conversationObj = findConversationInList(userString);
        openConversation(conversationObj);
    }
    else
        chatArea.html('Chatting with: ' + userString);
}

// sends a message to the server
function sendMessage()
{
    content = messageInput.val();

    if(/\S/.test(content)) // check if string is empty or contains more than just whitespace
    {
        if(chatTarget == null)
            message = {'from': username, 'text': content};
        else
            message = {'from': username, 'text': content, 'to': chatTarget};

        socket.emit('message', message);

        // clear the input area
        messageInput.val('');
    }
}


function addMessageToChatArea(message)
{
    conversation = message['from'] === username ? message['to'] : message['from'];

    if(chatTarget == conversation)
    {
        element = "<span class='user-message'> [" + message['from'] + "] : "+ message['text'] +"</span>";
        chatArea.append(element);
    }
    else
    {
        addUnreadMessage(conversation);
    }
}

function addUnreadMessage(conversation)
{
    history[conversation]['unread']++;

    var span = '<span class="badge">'+ history[conversation]['unread'] +'</span>';

    conversationList.children('a').each(function () {

        if($(this).attr('username') == conversation)
            $(this).html(conversation + span ); // "this" is the current element in the loop
    });
}

function addMessageToHistory(message)
{
    conversation = message['to'] === username ? message['from'] : message['to'];

    if(history[conversation] == undefined)
    {
        history[conversation] = {'messages' : [], 'unread' : 0};
        addConversation(conversation);
    }

    history[conversation]['messages'].push(message); // add the message to the history of messages with this user
}

function addConversation(name)
{
    var element = '<a href="#" onclick="openConversation(this)" username="'+ name +'" class="list-group-item">'+ name +'</a>'
    conversationList.append(element);
}

function removeConversation(user)
{
    if(history[user] != undefined)
    {
        delete history[user];

        conversationList.children('a').each(function (){
        if(this.text === user )
            this.remove();
        });
    }
}

function findConversationInList(name) // find and return the conversation item in the conversations list
{
    var item = null;

    conversationList.children('a').each(function () {

        if($(this).attr('username') == name)
        {
            item = this;
            return false;
        }
    });

    return item;
}

function openConversation(conversationObj)// conversation is HTML element
{
    if(activeConversationObj != null && activeConversationObj != undefined)
    {
        // Remove the active class from this conversation item
        $(activeConversationObj).removeClass('active');
    }

    var conversationString = $(conversationObj).attr('username');

    $(conversationObj).html(conversationString); // wipe the unread messages badge
    $(conversationObj).addClass('active');
    activeConversationObj = conversationObj;

    chatArea.html(''); // wipe current displayed messages
    chatArea.append('Chatting with : ' + conversationString);

    chatTarget = conversationString;

    messages = history[conversationString]['messages'];

    for(var i = 0; i < messages.length; i++)
        addMessageToChatArea(messages[i]);
}

// Websocket Event handling
socket.on('connect', function(){
    console.log('connect to server !');
});

socket.on('message', function(data){
    addMessageToHistory(data);
    addMessageToChatArea(data);
});

socket.on('disconnect', function(data){
    console.log('disconnected from server !');
});

// Custom Websocket Event handling
socket.on('on_client_list_received', function(message){

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
    removeConversation(user);

    if(user === chatTarget)
        chatTarget = null;
});
