#!/usr/bin/env python

from __future__ import print_function

import StringIO
import multiprocessing
import os
import pickle
import socket
import struct
import sys


TCP_PROTOCOL = 6

# Based on HTTP status codes.
class Status(object):
    ok = 200
    bad_request = 400
    forbidden = 403
    not_found = 404
    internal_server_error = 501
    im_a_teapot = 418


# Defines how to pack the structs which will be sent over the control channel.
control_request = 'iic'
control_resp = 'ii'

def build_request(command, file_name, data_port):
    return struct.pack(control_request, data_port, len(file_name),
            command[1]) + file_name

def build_response(length, status_code):
    return struct.pack(control_request, length, status_code)


def usage():
    print(('{} <SERVER_HOST> <SERVER_PORT> <COMMAND> <FILENAME> <DATA_PORT>'
          ).format(sys.argv[0]))


def async_open_request(data_port, queue):
    print('socket')
    data_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM, TCP_PROTOCOL)
    print('bind')
    data_sock.bind(('0.0.0.0', data_port))
    print('listen')
    data_sock.listen(5)
    print('put')
    queue.put('accepting')
    print('accept')
    (clientsock, address) = data_sock.accept()
    print('get')
    (status_code, data_length) = queue.get()
    print('stat')
    if status_code == Status.ok:
        data = clientsock.recv(data_length)
        if command == '-l':
            print(data)
        else:
            with open(os.path.basename(file_name), 'w') as f:
                f.write(data)
    else:
        print('Error: ', status_code)
    clientsock.close()
    data_sock.close()



if __name__ == '__main__':
    if (len(sys.argv) < 5 or not sys.argv[2].isdigit() or not sys.argv[5] or
            sys.argv[3] not in ['-l', '-g']):
        usage()
        exit(-1)
    control_name = sys.argv[1];
    control_port = int(sys.argv[2])
    command = sys.argv[3]
    file_name = sys.argv[4]
    data_port = int(sys.argv[5])
    queue = multiprocessing.Queue()

    proc = multiprocessing.Process(target=async_open_request, args=(data_port, queue))
    proc.start()

    control_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM,
            TCP_PROTOCOL)
    control_sock.connect((socket.gethostbyname(control_name), control_port))
    request = build_request(command, file_name, data_port)
    # ready signal
    queue.get()
    control_sock.send(request)

    resp = control_sock.recv(struct.calcsize(control_resp))
    (data_length, status_code) = struct.unpack(control_resp, resp)
    queue.put((data_length, status_code))

    proc.join()
    control_sock.close()
