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
Standard Flask routes
"""

@app.route('/') #Route the index page
def index():
    return render_template('index.html')


if __name__ == '__main__':
    socketio.run(app)
