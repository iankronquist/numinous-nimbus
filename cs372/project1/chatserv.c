#include <errno.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <netinet/in.h>
#include <fcntl.h>

#define IP_PROTOCOL 0
#define BUFFER_SIZE 512
#define HANDLE_SIZE 10

void server_loop(int, char*);

bool listen_loop(int fd, char *handle);

int main (int argc, char *argv[]) {
    if (argc != 3) {
        fprintf(stderr, "%s port handle\n", argv[0]);
        exit(EXIT_FAILURE);
    }
    int port = strtol(argv[1], NULL, 10);
    if (port == 0 && errno == EINVAL) {
        perror("Bad port number");
        exit(EXIT_FAILURE);
    }
    char *handle = argv[2];
    if (strlen(handle) > 10) {
        fprintf(stderr, "Handle must be no longer than 10 characters\n");
        exit(EXIT_FAILURE);
    }
    server_loop(port, handle);
    return 0;

}

void server_loop(int port, char *handle) {
    int socketfd, newsockfd, ret;
    socklen_t clilen;
    struct sockaddr_in serv_addr, cli_addr;

    socketfd = socket(AF_INET, SOCK_STREAM, IP_PROTOCOL);
    if (socketfd < 0) {
        perror("Couldn't open socket!");
        exit(EXIT_FAILURE);
    }
    bzero((char*)&serv_addr, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(port);
    serv_addr.sin_addr.s_addr = INADDR_ANY;
    ret = bind(socketfd, (struct sockaddr *) &serv_addr, sizeof(serv_addr));
    if (ret < 0) {
        perror("Failed to bind to the socket");
        exit(EXIT_FAILURE);
    }
    while (true) {
        ret = listen(socketfd, 5);
        if (ret < 0) {
            perror("Failed to listen on the socket");
            exit(EXIT_FAILURE);
        }
        clilen = sizeof(cli_addr);
        newsockfd = accept(socketfd, (struct sockaddr *)&cli_addr, &clilen);
        if (newsockfd < 0) {
            perror("Failed to accept connection");
            exit(EXIT_FAILURE);
        }
        if (listen_loop(newsockfd, handle)) {
            return;
        }
    }
    close(socketfd);
}


bool listen_loop(int fd, char *local_handle) {
    char *line = NULL;
    size_t linecap = 0;
    ssize_t linelen;
    char buffer[BUFFER_SIZE+1];
    char *message = (char *)&buffer + HANDLE_SIZE;
    bool done = false;
    write(fd, local_handle, HANDLE_SIZE);
    while (read(fd, &buffer, BUFFER_SIZE) > 0) {
        buffer[BUFFER_SIZE] = '\0';
        printf("%s> %s\n", (char *)&buffer, message);
        printf("%s> ", local_handle);
        if (strcmp(message, "\\quit") == 0) {
            done = false;
            puts("they quit");
            break;
        }

        linelen = getline(&line, &linecap, stdin);
        line[linelen-1] = '\0';
        if (linelen < 0) {
            fprintf(stderr, "End of input\n");
            strcpy((char *)&buffer, "\\quit");
            write(fd, line, BUFFER_SIZE);
            done = true;
            break;
        }
        if (linelen > BUFFER_SIZE) {
            fprintf(stderr, "message must be less than 500 characters\n");
            continue;
        }
        bzero(buffer, BUFFER_SIZE);
        strncpy(buffer, local_handle, HANDLE_SIZE);
        strncpy(buffer + HANDLE_SIZE, line, BUFFER_SIZE-(HANDLE_SIZE + 1));
        if (write(fd, buffer, BUFFER_SIZE) == -1) {
            perror("writing message");
            exit(EXIT_FAILURE);
        }
        if (strcmp(message, "\\quit") == 0) {
            puts("we quit");
            done = true;
            break;
        }
    }
    close(fd);
    return done;
}
