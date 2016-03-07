#!/local/pythonenv/bin/python
import argparse
import pika
import json

if __name__ == '__main__':
    try:
        parser = argparse.ArgumentParser(description='Set Ixia Debug Level')
        parser.add_argument('level', help='log level -- DEBUG|INFO|WARNING|ERROR|CRITICAL|NOTSET')
        parser.add_argument('--name', help='OPTIONAL name of logger component to change log level otherwise root logger')

        args = parser.parse_args()

        if args.level.upper() not in ['FATAL', 'CRITICAL', 'ERROR', 'WARNING', 'WARN', 'INFO', 'DEBUG', 'NOTSET']:
            raise Exception('Specified level %s not recognized' % (args.level, ))

        connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
        channel = connection.channel()

        channel.exchange_declare(exchange='diagnostics', type='topic')

        data = {'level': args.level}
        if args.name:
            data['name'] = args.name

        message = json.dumps(data)
        channel.basic_publish(exchange='diagnostics', routing_key='commands.logging.set_log_level', body=message)
        connection.close()

        print "Sent %r" % (message,)

    except Exception as e:
        print e
        exit(1)
