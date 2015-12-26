import os
import redis
import gevent

from flask import Flask
from flask_sockets import Sockets

#REDIS_URL = os.environ['REDISCLOUD_URL']
#REDIS_CHAN = 'chat'



class ChatBackend(object):
    """ Handling the websockets clients """

    def __init__(self):
        self.clients = []


    def register(self, client):
        self.clients.append(client)

    def send(self, message):

        toRemove = []

        for client in self.clients:
            try:
                client.send(message)
            except Exception:
                toRemove.append(client)

        for client in toRemove:
            self.clients.remove(client)



chats = ChatBackend()

app = Flask(__name__)
app.debug = 'DEBUG' in os.environ

sockets = Sockets(app)

@sockets.route('/send')
def outbox(ws):

    message = ws.receive()
    print message

    if message:
        chats.send(message)

@sockets.route('/receive')
def inbox(ws):

    chats.register(ws)

@app.route('/')
def hello():
    return 'Hello world !'
