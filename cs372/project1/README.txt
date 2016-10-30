# Programming Assignment 1

This assignment has three parts:
1. A chat client written in C.
2. A chat server written in Python.
3. An identical chat server written in C.

## Building
This project requires Python 2 and a GCC which supports C99. It should build on
most POSIX compliant systems, including OS X and Linux.
The Python chat server does not need to be preprocessed or built.
To build the C chat client and server run the following command:
make

## Running
The server must be started and listening before the client can connect.
The server has the following arguments:

chatserv.py port handle

The port must be valid. If it is a reserved port, it the server may have to be
run as root. It is recommended to run the server with a port which is not
reserved.
The handle may be at most 10 characters.
The client has the following arguments:

chatclient host port handle

The host must be a DNS resolvable hostname.
The port must be valid.
The handle must be at most 10 characters.

# Example Usage

On one terminal:
./chatserv.py 10000 server

In another on the same host:
./chatclient localhost 10000 client

Alternately, to connect to the flip server:
./chatclient access.engr.oregonstate.edu 10000 client
