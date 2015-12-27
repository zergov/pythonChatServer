import os
import redis
import gevent
import json

from flask import Flask
from flask import render_template

from geventwebsocket import websocket
from geventwebsocket import handler

from flask_sockets import Sockets


REDIS_CHAN = 'chat'

app = Flask(__name__)
app.debug = 'DEBUG' in os.environ

sockets = Sockets(app)
redis = redis.from_url('127.0.0.1:6379')

class ChatBackend(object):
    """ Handling the websockets clients """

    def __init__(self):
        self.clients = []
        self.pubsub = redis.pubsub()
        self.pubsub.subscribe(REDIS_CHAN)

    def __iter_data(self):

        for message in self.pubsub.listen():

            data = message.get('data')

            if message['type'] == 'message':
                yield data


    def register(self, client):
        self.clients.append(client)


    def send(self, client, message):
        """ Send a message to a specific client """

        try:
            client.send(message)
        except Exception:
            self.clients.remove(client)


    def run(self):
        """For every message in the queu, send the message to the clients """

        for data in self.__iter_data():
            for client in self.clients:
                gevent.spawn(self.send, client, data)

    def start(self):
        """ Start the application and let it run in the background """

        gevent.spawn(self.run)


chats = ChatBackend()
chats.start()


@sockets.route('/send')
def inbox(ws):

    while not ws.closed:
        gevent.sleep()

        message = ws.receive()

        if message:
            redis.publish(REDIS_CHAN, message)

@sockets.route('/receive')
def outbox(ws):

    chats.register(ws)

    while not ws.closed:
        gevent.sleep()


@app.route('/')
def hello():
    return render_template('index.html')
