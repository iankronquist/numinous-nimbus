CC := gcc
CFLAGS :=  -O2 -Wall -Wextra -Werror -g -std=c99

all: chatserv chatclient

%: %.c
	$(CC) $< -o $@ $(CFLAGS)

clean:
	rm -f chatclient
	rm -f chatserv
	rm -rf *dSYM
