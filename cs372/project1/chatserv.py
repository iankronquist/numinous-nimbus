#!/usr/bin/env python

import os
import socket
import sys

def listen(sock):
    pass

def send_handle(handle, sock):
    sock.send(handle.ljust(10, '\0'))

def message_loop(server_handle, sock):
    while True:
        message = sock.recv(12 + 500)
        if len(message) == 0:
            return False
        handle = message[:10]
        body = message[10:]
        print('{}> {}'.format(handle, body))
        if body[:6] == '\\quit\0':
            return False
        while True:
            user_input = raw_input('{}> '.format(server_handle))
            if len(user_input) > 500:
                print 'message should be at most 500 characters'
            else:
                break
        send_body = user_input.ljust(500, '\0')
        send_message = server_handle.ljust(10, '\0') + send_body
        sock.send(send_message)
        if send_body[:5] == '\\quit':
            return True

def usage():
    print('''{} port handle
        handle must be less than 10 characters'''.format(sys.argv[0]))

if __name__ == '__main__':
    if len(sys.argv) < 3 or not sys.argv[1].isdigit() or len(sys.argv[2]) > 10:
        usage()
        exit(-1)
    port = int(sys.argv[1])
    handle = sys.argv[2]
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('0.0.0.0', port))
    while True:
        sock.listen(5)
        (clientsock, address) = sock.accept()
        send_handle(handle, clientsock)
        if message_loop(handle, clientsock):
            break
        clientsock.close()
