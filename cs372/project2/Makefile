CC := gcc
CFLAGS :=  -O2 -Wall -Wextra -Werror -g -std=c99
OBJS := ftpserv

all: $(OBJS)

%: %.c
	$(CC) $< -o $@ $(CFLAGS)

clean:
	rm -f $(OBJS)
	rm -rf *dSYM
