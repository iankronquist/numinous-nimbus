// Required for bzero and getline
#define _GNU_SOURCE
#include <dirent.h>
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

#define TCP_PROTOCOL 6
#define BUFFER_SIZE 512
#define HANDLE_SIZE 10

// Based on HTTP status codes.
#define STATUS_OK 200
#define STATUS_INVALID_REQUEST 400
#define STATUS_FORBIDDEN 403
#define STATUS_ABSENT 404
#define STATUS_SERVER_ERROR 501
#define STATUS_IM_A_TEAPOT 418

// Requests have this header optionally followed by some data, such as a file
// name.
struct control_request {
    int data_port;
    int control_length;
    char type;
} __attribute__((packed));

// Responses have this header.
struct control_response {
    int status_code;
    int data_length;
} __attribute__((packed));

int control_loop(int);
int handle_request(int control, struct sockaddr_in *cli_addr);
int transmit_file(char *filename, int data_sock, int control_sock);
int transmit_listing(char *filename, int data_sock, int control_sock);

int main (int argc, char *argv[]) {
    int port;

    if (argc != 2) {
        fprintf(stderr, "USAGE: %s port\n", argv[0]);
        exit(EXIT_FAILURE);
    }

    port = strtol(argv[1], NULL, 10);
    if (port == 0 && errno == EINVAL) {
        perror("Bad port number");
        exit(EXIT_FAILURE);
    }

    return control_loop(port);
}

// Send a control message to the client.
int send_control_response(int fd, int message, int data_length) {
    struct control_response resp;
    resp.status_code = message;
    resp.data_length = data_length;
    return write(fd, &resp, sizeof(resp)) == -1;
}

// Listen for client connections.
int control_loop(int port) {
    int socketfd, newsockfd;
    int err = 0;
    socklen_t clilen;
    struct sockaddr_in serv_addr, cli_addr;

    socketfd = socket(AF_INET, SOCK_STREAM, TCP_PROTOCOL);
    if (socketfd < 0) {
        perror("Couldn't open socket!");
        exit(EXIT_FAILURE);
    }

    bzero((char*)&serv_addr, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(port);
    serv_addr.sin_addr.s_addr = INADDR_ANY;

    err = bind(socketfd, (struct sockaddr *) &serv_addr, sizeof(serv_addr));
    if (err < 0) {
        perror("Failed to bind to the socket");
        exit(EXIT_FAILURE);
    }

    while (true) {
        err = listen(socketfd, 5);
        if (err != 0) {
            perror("Failed to listen on the socket");
            close(socketfd);
            return err;
        }

        clilen = sizeof(cli_addr);
        newsockfd = accept(socketfd, (struct sockaddr *)&cli_addr, &clilen);
        if (newsockfd == -1) {
            perror("Failed to accept connection");
            err = newsockfd;
        }

        err = handle_request(newsockfd, &cli_addr);
        if (err != 0) {
            break;
        }
    }
    close(socketfd);
    return err;
}

// Handle a request from the client address. Opens and owns a data connection
// with the client.
int handle_request(int control, struct sockaddr_in *cli_addr) {
    struct sockaddr_in data_addr;
    int data;
    int err;
    char *file_name = NULL;
    struct control_request message;

    err = read(control, &message, sizeof(struct control_request));
    if (err == -1) {
        fprintf(stderr, "Error reading from control socket\n");
        return err;
    }


	printf("-1\n");
	sleep(1);
	printf("0\n");
    data = socket(AF_INET, SOCK_STREAM, TCP_PROTOCOL);
    if (data < 0) {
        perror("Couldn't open data socket");
        err = send_control_response(control, STATUS_SERVER_ERROR, 0);
        return err;
    }
    memcpy(&data_addr.sin_addr, &cli_addr->sin_addr, sizeof(data_addr.sin_addr));
    data_addr.sin_family = AF_INET;
    data_addr.sin_port = htons(message.data_port);
	printf("1\n");
    err = connect(data, (struct sockaddr *)&data_addr, sizeof(data_addr));
	printf("2\n");
    if (err == -1) {
        perror("Couldn't connect to data socket");
        err = send_control_response(control, STATUS_SERVER_ERROR, 0);
        goto out;
    }

    file_name = malloc(message.control_length + 1);
    if (file_name == NULL) {
        perror("Couldn't allocate memory for file name\n");
        err = send_control_response(control, STATUS_SERVER_ERROR, 0);
        goto out;
    }
    file_name[message.control_length] = '\0';

    if (read(control, file_name, message.control_length) == -1) {
        perror("Couldn't read from control socket");
        err = send_control_response(control, STATUS_SERVER_ERROR, 0);
        goto out;
    }

    if (message.type == 'g') {
        if (transmit_file(file_name, data, control) != 0) {
            err = send_control_response(control, STATUS_SERVER_ERROR, 0);
        }
    } else if (message.type == 'l') {
        if (transmit_listing(file_name, data, control) != 0) {
            err = send_control_response(control, STATUS_SERVER_ERROR, 0);
        }
    } else {
        err = send_control_response(control, STATUS_INVALID_REQUEST, 0);
    }

out:
    free(file_name);
    close(data);
    return 0;
}

// Transmit the contents of the given file name over the data socket, and send
// a control response.
int transmit_file(char *filename, int data_sock, int control_sock) {
    int err;
    int file;
    int data_length = 0;
    ssize_t bytes;
    char buffer[BUFFER_SIZE];

    file = open(filename, O_RDONLY);
    if (file < 0) {
        err = send_control_response(control_sock, STATUS_FORBIDDEN, 0);
        return err;
    }
    while (true) {
        bytes = read(file, &buffer, BUFFER_SIZE);
        if (bytes == -1) { // Error reading from file.
            err = send_control_response(control_sock, STATUS_SERVER_ERROR,
                    data_length);
            break;
        } else if (bytes == 0) { // End of file
            err = send_control_response(control_sock, STATUS_OK, data_length);
            break;
        }
        data_length += bytes;
        write(data_sock, &buffer, bytes);
    }
    close(file);
    return err;
}

// Transmit the contents of the given directory name over the data socket, and
// send a control response.
int transmit_listing(char *filename, int data_sock, int control_sock) {
    int err;
    DIR *dir;
    struct dirent *ent;
    int data_length = 0;

    dir = opendir(filename);
    if (dir == NULL) {
        err = send_control_response(control_sock, STATUS_FORBIDDEN, 0);
        return err;
    }

    while (true) {
        ent = readdir(dir);
        if (ent == NULL) { // Error reading from directory.
            err = send_control_response(control_sock, STATUS_OK,
                    data_length);
            break;
        }
        data_length += dprintf(data_sock, "%s\n", ent->d_name);
    }
    closedir(dir);
    return err;
}
