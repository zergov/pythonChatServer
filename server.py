import os
import json

from flask import Flask
from flask import render_template

from flask_socketio import SocketIO
from flask_socketio import rooms
from flask_socketio import emit

app = Flask(__name__)
app.debug = True    #Use the debuger

socketio = SocketIO(app)

chat_namespace = '/chat'

clients = {}

# Default websocket event handling
@socketio.on('connect', namespace=chat_namespace)
def on_connection():
    pass

@socketio.on('message', namespace=chat_namespace)
def on_message():
    pass

@socketio.on('disconnect', namespace=chat_namespace)
def on_disconnect():
    #TODO: Remove the user and warn the other clients
    pass


# Custom WebSocket events
@socketio.on('register', namespace=chat_namespace)
def register_user(data):
    """
    Register a user with it's username:sid.
    """
    content = json.loads(data)
    username = content['username']
    sid = rooms()[0]

    clients[username] = sid

@socketio.on('get_user_list', namespace=chat_namespace)
def get_connected_user():
    """
    Return the list of all connected users.
    """
    usernames = clients.keys()
    data = json.dumps(usernames)
    emit('on_client_list_received', data)


# Standard Flask routes
@app.route('/') #Route the index page
def index():
    return render_template('index.html')


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')
