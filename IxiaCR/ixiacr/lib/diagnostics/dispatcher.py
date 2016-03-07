import os
import pika
import sys
import json
import threading
import logging
from commands import COMMANDS

ixiacrlogger = logging.getLogger(__name__)

# Disable pika DEBUG logging.  It's to chatty
# XXX: Is there a better place to put this?
logging.getLogger('pika').setLevel(logging.INFO)


class CommandDispatcher(object):
    """ Listen for diagnostic commands and execute them from the diagnostics message bus
    """

    def __init__(self, commands=COMMANDS):
        """ Dispatcher is created in a dormant state until start_listening() is called.

        :param commands: dictionary of command routing_key => callable command class
        """
        self.thread = threading.Thread(target=self.listener, name='CommandThread', args=())
        self.thread.daemon = True               # Must run in daemon mode to allow shutdown
        self.commands = commands

    def start_listening(self):
        """ Start the thread to listen and process command messages.
        """
        ixiacrlogger.debug('Starting CommandListener thread')
        self.thread.start()

    @staticmethod
    def publish_event(channel, topic, data):
        """ Publish the specified event on the diagnostics message bus.
        """
        message = json.dumps(data)
        channel.basic_publish(exchange='diagnostics', routing_key=topic, body=message)
        ixiacrlogger.debug('Published events.process_started event')

    def listener(self):
        """ Thread and message processing loop for handling command messages. Thread should
            be run in daemon mode to allow process to shutdown.
        """

        try:
            ixiacrlogger.debug('Thread started')
            connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
            channel = connection.channel()

            channel.exchange_declare(exchange='diagnostics', exchange_type='topic')

            # private queue for receiving messages in this process
            result = channel.queue_declare(exclusive=True, durable=False, auto_delete=True)
            queue_name = result.method.queue
            ixiacrlogger.debug('Command queue_name=%s' % (queue_name, ))

            self.publish_event(channel, 'events.process_started', {
                'event': 'logging_init',
                'queue': queue_name,
                'cmd': str(sys.argv),
                'pid': os.getpid(),
            })

            channel.queue_bind(exchange='diagnostics', queue=queue_name, routing_key='commands.*.*')

            channel.basic_consume(self.process_command_messages, queue=queue_name, no_ack=True)

            channel.start_consuming()

        except Exception as e:
            ixiacrlogger.exception(str(e))

    def process_command_messages(self, ch, method, properties, body):
        """ Pika callback method for consuming commands.*.* messages on the queue for this process
        """
        try:
            ixiacrlogger.debug('Looking up command for routing_key=%s' % (method.routing_key, ))

            command_class = self.commands[method.routing_key]
            command = command_class()

            data = json.loads(body)

            ixiacrlogger.debug('Executing command=%s' % (command_class.__name__, ))
            command(data)

        except Exception as e:
            ixiacrlogger.exception('Failed processing command message for routing_key=%s' % (method.routing_key, ))
