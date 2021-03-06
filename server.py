import json

from flask import Flask
from flask import render_template

from flask_socketio import SocketIO
from flask_socketio import rooms
from flask_socketio import emit

app = Flask(__name__)
socketio = SocketIO(app)
chat_namespace = '/chat'

clients = {}


# Default Websocket event
@socketio.on('connect', namespace=chat_namespace)
def on_connection():
    print 'user connected !'


@socketio.on('message', namespace=chat_namespace)
def on_message(data):

    if 'from' in data and 'text' in data:
        if data['from'] in clients:  # else received a message from fake client
            sid = clients[data['from']]

            if sid is rooms()[0]:  # else client is faking his identity !'
                distribute_message(data)


def distribute_message(message):
    """
    Handle the distribution of message to users
    """

    data = {}
    data['from'] = message['from']
    data['text'] = message['text']
    data['private'] = False

    if 'to' in message:

        destination = message['to']
        sender = message['from']

        data['to'] = destination
        data['private'] = True

        if destination in clients:

            emit('message', data, room=clients[destination])
            emit('message', data, room=clients[sender])


@socketio.on('disconnect', namespace=chat_namespace)
def on_disconnect():

    sid = rooms()[0]
    username = None

    for client in clients:
        if clients[client] is sid:
            username = client
            clients.pop(client, None)
            break

    if username is not None:
        emit('user_disconnected', username, broadcast=True)


# Custom WebSocket events
@socketio.on('register', namespace=chat_namespace)
def register_user(data):
    """
    Register a user with username:sid.
    """
    username = data['username']
    sid = rooms()[0]

    # add the user to the clients dictionary
    clients[username] = sid

    emit('user_registered', username, broadcast=True)


@socketio.on('get_user_list', namespace=chat_namespace)
def get_connected_user():
    """
    Return the list of connected users.
    """
    usernames = clients.keys()
    data = json.dumps(usernames)
    emit('on_client_list_received', data)


# Standard Flask routes
@app.route('/')  # Route the index page
def index():
    return render_template('index.html')


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')
