import os
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
def on_message():
    pass

@socketio.on('disconnect', namespace=chat_namespace)
def on_disconnect():

    sid = rooms()[0]
    username = None

    for client in clients:
        if clients[client] is sid:
            username = client
            break

    print '{0} Disconnected !'.format(username)


# Custom WebSocket events
@socketio.on('register', namespace=chat_namespace)
def register_user(data):
    """
    Register a user with username:sid.
    """
    content = json.loads(data)
    username = content['username']
    sid = rooms()[0]

    clients[username] = sid

@socketio.on('get_user_list', namespace=chat_namespace)
def get_connected_user():
    """
    Return the list of connected users.
    """
    usernames = clients.keys()
    data = json.dumps(usernames)
    emit('on_client_list_received', data)

#Standard Flask routes
@app.route('/') #Route the index page
def index():
    return render_template('index.html')


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')
