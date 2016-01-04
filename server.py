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

"""
WebSocket event handler
"""

@socketio.on('connect', namespace=chat_namespace)
def on_connection():
    #TODO:Register the user
    pass

@socketio.on('message', namespace=chat_namespace)
def on_message():
    pass

@socketio.on('disconnect', namespace=chat_namespace)
def on_disconnect():
    #TODO: Remove the user and warn the other clients
    pass

"""
Custom WebSocket events
"""
@socketio.on('register', namespace=chat_namespace)
def register_user(data):

    content = json.loads(data)
    username = content['username']
    sid = rooms()[0]

    clients[username] = sid

    print '{0}:{1} added to the clients.'.format(username, sid)


"""
Standard Flask routes
"""

@app.route('/') #Route the index page
def index():
    return render_template('index.html')


if __name__ == '__main__':
    socketio.run(app)
