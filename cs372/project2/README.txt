# Programming Assignment 1

This assignment has two parts:
1. An FTP-like client written in Python
2. An FTP-like server written in C.

## Building
This project requires Python 2.7 and a GCC which supports C99. It should build
on most POSIX compliant systems, including OS X and Linux.  The Python FTP
client does not need to be preprocessed or built.  To build the C FTP server
and server run the following command:
make

## Running
The server must be started and listening before the client can connect.
The server has the following arguments:

ftpserv port

The port must be valid. If it is a reserved port, it the server may have to be
run as root. It is recommended to run the server with a port which is not
reserved.

The client has the following arguments:

ftpclient.py <SERVER_HOST> <SERVER_PORT> <COMMAND> <FILENAME> <DATA_PORT>

The <SERVER_HOST> must be a DNS resolvable hostname.
The <SERVER_PORT> and <DATA_PORT> must be valid.
The command may be `-l` or `-g`.
The filename must be a valid unix filename.


# Example Usage

In one terminal:
./ftpserv 8888

Then, in another on the same host:
./ftpclient.py  localhost 8889 -g ../ass2.tex 8000

Alternately, to connect to the flip server:
./ftpclient.py  access.engr.oregonstate.edu 8888 -g ../ass2.tex 8000

## Resources Used
I consulted some old code I had from CS 411 which had a very similar
assignment. I also consulted the man pages, pydoc, and the Python sockets
tutorial.
https://docs.python.org/2/howto/sockets.html
