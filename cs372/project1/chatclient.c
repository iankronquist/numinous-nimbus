#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <fcntl.h>
#include <assert.h>

#define IP_PROTOCOL 0
#define BUFFER_SIZE 512
#define HANDLE_SIZE 10

int init_connection(char *address, int port);
int read_loop(const int fd, char *local_handle, char *remote_handle);
void get_remote_handle(const int fd);

static char remote_handle[HANDLE_SIZE + 1];

int main(int argc, char *argv[]) {

    if (argc != 4) {
        fprintf(stderr, "%s host port handle\n", argv[0]);
        exit(EXIT_FAILURE);
    }
    if (strlen(argv[3]) > 10) {
        fprintf(stderr, "Handle must be no greater than %d characters.\n",
                HANDLE_SIZE);
        exit(EXIT_FAILURE);
    }
    int port = strtol(argv[2], NULL, 10);
    int fd = init_connection(argv[1], port);
    char *local_handle = argv[3];
    get_remote_handle(fd);
    read_loop(fd, local_handle, remote_handle);
    close(fd);
    return 0;
}

void get_remote_handle(const int fd) {
    read(fd, &remote_handle, HANDLE_SIZE);
    remote_handle[HANDLE_SIZE] = '\0';
}

int init_connection(char *readable_address, int port) {
    int socketfd, ret;
    struct sockaddr_in serv_addr;
    struct hostent *host;

    socketfd = socket(AF_INET, SOCK_STREAM, IP_PROTOCOL);
    if (socketfd < 0) {
        perror("Couldn't open socket!");
        exit(1);
    }
    bzero((char*) &serv_addr, sizeof(serv_addr));
    //inet_pton(AF_INET, readable_address, &serv_addr.sin_addr);
    host = gethostbyname(readable_address);
    if (host == NULL) {
        herror("Couldn't get host name");
        exit(EXIT_FAILURE);
    }
    memcpy(&serv_addr.sin_addr, host->h_addr, host->h_length);
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(port);
    ret = connect(socketfd, (struct sockaddr *)&serv_addr, sizeof(serv_addr));
    if (ret < 0) {
        perror("Couldn't connect to the socket");
        exit(1);
    }
    return socketfd;
}

int read_loop(const int fd, char *local_handle, char *remote_handle) {
    char *line = NULL;
    size_t linecap = 0;
    ssize_t linelen;
    char buffer[BUFFER_SIZE+1];
    char *message = (char *)&buffer + 10;
    printf("%s> ", local_handle);
    while ((linelen = getline(&line, &linecap, stdin)) > 0) {
        line[linelen-1] = '\0';
        if (strcmp(line, "\\quit") == 0) {
            break;
        }
        bzero(buffer, BUFFER_SIZE);
        strncpy(buffer, local_handle, HANDLE_SIZE);
        strncpy(message, line, BUFFER_SIZE-(HANDLE_SIZE + 1));
        if (linelen > BUFFER_SIZE) {
            fprintf(stderr, "message must be less than 500 characters\n");
            continue;
        }
        if (write(fd, buffer, BUFFER_SIZE) == -1) {
            perror("writing message");
            exit(EXIT_FAILURE);
        }
        if (read(fd, &buffer, BUFFER_SIZE) == -1) {
            perror("reading message");
            exit(EXIT_FAILURE);
        }
        printf("%s> %s\n", remote_handle, message);
        if (strcmp(message, "\\quit") == 0) {
            break;
        }
        printf("%s> ", local_handle);
    }
    close(fd);
    return 0;
}

int get_fd_size(int fd) {
    struct stat statfd;
    int err = fstat(fd, &statfd);
    if (err == -1) {
        perror("fstat");
        exit(-1);
    }
    return statfd.st_size;
}
