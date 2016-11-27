Title: CS 290 How to Integrate the Dropbox and Imgur REST APIs into a Python Flask web application
Date: 2010-12-03 10:20
Authors: Ian Kronquist

## Introduction

Dropbox is an excellent tool for storing files, but isn't widely used for sharing files with the wider internet. Additionally, it doesn't provide many social or sharing features like those provided by image sharing websites like Imgur. In this how to guide we will demonstrate how to authenticate and use both the Dropbox and Imgur APIs to download and upload files as well as the basics of creating a Python web application. To keep from getting bogged down with the details or writing a web application or sending HTTP requests we'll take advantage of the Flask and Requests libraries. To limit the scope to the uses of the REST APIs we won't create fancy CSS designs or anything more than a bare bones interface. Additionally, error handling will not be as robust as it should be to make the examples straightforward and easy to understand.


## An Overview of the Flask Web Application Framework
Flask is a simple easy to use web application framework written in Python. It was the inspiration for similar frameworks in other ecosystems such as NodeJS' Express framework. Flask uses a Python language feature called ``decorators'' to indicate that certain functions should be run when a route is requested with a given method. For instance, in this example, POSTing the route **/hello** will run this function. The return value of the function is sent back in the response as the request body. In this case, we use Flask's **render\_template** function to pass variables to a template to display.

### Flask Endpoint Example
```python
@app.route('/hello', methods=['POST'])
def hello():
    filename = request.form.get('name')
    return render_template('helloworld.html', name=name)
```


## Authenticating with the Dropbox API
Dropbox has a relatively straightforward REST API. To access it you need to register a dropbox application. To get started with Dropbox first you need to create an account. Next log in and go to https://droppbox.com/developers/apps. Fill out the application name and register the application. On the next page get the App key and App secret secret for your application. Additionally, generate and save an access token for your API.

<img src="{filename}/images/dropboxcreateapp.png" alt="Drawing" style="width: 80%;"/>


This authentication method is designed so that your application has a public authentication key which can be shared in plain text, as well as a secret which should be hidden to prevent other developers from using the API as you. Additionally, each individual client, i.e. web browser or mobile application, should get their own access token so they can be individually rate limited.

<img src="{filename}/images/dropboxauthkeys.png" alt="Drawing" style="width: 80%;"/>


You can authenticate to use the API with the OAuth 2 protocol. Alternatively, API keys can be bundled as part of the application, which we will demonstrate here for simplicity.

To authenticate with the API and make a request, you need to set the HTTP header **Authentication** to the string "Bearer " and then the dropbox client token. With the requests library we can build the headers using a simple Python dictionary.

### Creating the Headers Dictionary
```python
    dropbox_secret = '1cl1sajsenyfiz7'
    dropbox_key = 'rn7wvvbi1tb5ap2'
    dropbox_token = 'VisxM_7dpZAAAAAAAAAAB7UlLlPIGBIPSIMe4ySYmlO...'
    headers = {
        "Authorization": "Bearer " + dropbox_token,
    }
```

These headers need to be passed to each API request. If the header isn't included you'll get a 400 Internal Server error with simple text response in the body explaining the error. If the header is present but invalid you will get a 500 internal server error with no body, which is an interesting discrepancy.

The dropbox API is versioned so they can continue to add new features while maintaining backwards compatibility with older applications. For instance, all of endpoints belonging to the second version of the API start with **https://api.dropboxapi.com/2**. Dropbox also requires that all requests made to version 2 of the API be encrypted with HTTPS. If you try to query an endpoint with plain HTTP Dropbox returns a 400 Bad Request error.

## Searching for Files with the Dropbox API

To search for files in a Dropbox folder you can POST to the **/files/search} endpoint. Requests to this endpoint must have the **Content-Type** header set to **application/json**. The body of the request must be a JSON object with the at least two string properties **{query** and **{path**. The query can be any substring of files in the directory. The path is the full path the containing folder, with the important, and somewhat strange, caveat that the root of a user's Dropbox does not start with a slash.
Search results may not be returned in a single object. Multiple queries may be necessary to get all results. A successful response contains a JSON object with the following schema:


```
{
  "matches": [
    {
      "match_type": {
        ".tag": "filename"
      },
      "metadata": {
        ".tag": "file",
        "name": "Screen Shot 2016-09-02 at 15.39.52.png",
        "path_lower": "/screen shot 2016-09-02 at 15.39.52.png",
        "path_display": "/Screen Shot 2016-09-02 at 15.39.52.png",
        "id": "id:tet79JoQqjAAAAAAAAAAAw",
        "client_modified": "2016-11-15T22:24:34Z",
        "server_modified": "2016-11-15T22:24:34Z",
        "rev": "250c299e4",
        "size": 312295
      }
    },
  ],
  "more": false,
  "start": 1
}

```
The object has three keys, **matches}, **start}, and **more**. **more** is a boolean indicating whether there are more files which match the query. **{start** indicates the index where the next query should start. **matches** is a more complicated structure. It is a JSON array. Each member of the array is a JSON object with a **match\_type**, such as file name or directory name,  and a slew of metadata. The metadata includes useful information about the file.

Synthesizing this complicated specification and writing a response in code is relatively straightforward. We can create a **/search** which takes post requests with parameters named query and path. We can then pass these parameters on to the Dropbox API, and render the results. We need to remember to include the **Authorization** and **Content-Type** headers in our request.
### A Flask Search Endpoint
```python
@app.route('/search', methods=["POST"])
def search():
    url = "https://api.dropboxapi.com/2/files/search"
    headers = {
        "Authorization": "Bearer VisxM_7dpZAAAAAAAAAAB7UlLlPIGBIPSIMe4ySYmlOWJgj0CYG4PcwVWiaiTie1",
        "Content-Type": "application/json"
    }
    data = {
        "path": request.form.get('path'),
        "query": request.form.get('query'),
    }
    r = requests.post(url, headers=headers, data=json.dumps(data))
    j = r.json()
    return render_template('./results.html', matches=j['matches'], uploaded=False)
```

## Downloading Files with the Dropbox API
Downloading files with the Dropbox API requires an interface which isn't a pure JSON API. It would be wasteful to base64 encode a whole file so it could be a valid JSON string. Instead we will fetch it directly. Oddly enough, when we specify the path to download we won't send it as part of the request body, but instead we will include it as a special **Dropbox-API-Arg** header whose content is a simple JSON object with the following schema:
```
{ "path": "path name as string" 
```

We must once again remember to include our **Authorization** API key in the headers so our request succeeds. The response body is the file.

### Downloading a File from Dropbox
```python
def download_from_dropbox(path):
    global dropbox_token
    url = "https://content.dropboxapi.com/2/files/download"
    headers = {
        "Authorization": "Bearer {}".format(dropbox_token),
        "Dropbox-API-Arg": '{"path": "/' + path + '"}'
    }

    r = requests.post(url, headers=headers)
    return r.content
```

If the path being downloaded doesn't exist, the API returns a rather strange status code of 419, as opposed to the logical 404 Not Found,  which indicates a conflict. To compound the strangeness, the error contains a rather odd JSON body, as opposed to human readable plain text like other endpoints.

```
{
  "error_summary": "path/not_found/...",
  "error": {
    ".tag": "path",
    "path": {
      ".tag": "not_found"
	}
}
```

## Getting Started with the Imgur API
Like Dropbox, you need an account to access the Imgur API. You can have many applications associated with your account. When creating an application you need to choose the type, such as whether your application uses an OAuth callback URL. You also have to submit an application specific email and an application name. Once the application is registered you can get the authorization keys on the next page.

<img src="{filename}/images/imgurappcreationg.png" alt="Drawing" style="width: 80%;"/>


<img src="{filename}/images/imgurappkeys.png" alt="Drawing" style="width: 80%;"/>

Just like Dropbox, Imgur follows best practices and has a versioned API. They are currently on version 3, so all request start with **https://api.imgur.com/3/**

## Authenticating with the Imgur API
Like Dropbox, Imgur uses a OAuth for authentication. However, Imgur uses a two part key with a per-app secret, and a per-client secret. Imgur doesn't have the rather redundant App keys and App secrets which Dropbox uses. Like Dropbox, Imgur requires a specially formatted **Authorization** header with the client ID to accompany each request.

### Imgur API Authorization Keys
```python
imgur_key = 'e4d31dbb14e259fa15db0878bb1ae5def4075fb0';
imgur_client_id = '669c016e544468d';
imgur_headers = { 'Authorization': 'Client-ID ' + imgur_client_id, 
```


## Uploading a File with the Imgur API
Uploading a file to the Imgur API is straightfoward. You can upload an image to Imgur via a URL, as a multipart encoded form, or as base64 encoded data in the body of the request. 

The request requires your client ID to be set in the header and the application key to be a field in the body of the request. The body also requires a field called **image** which holds either the base64 encoded data or the image URL. There is an optional **type** field to specify which way you would like to upload the data. Invalid URLs return status code 400 Bad Request, while corrupt images return the rather obscure status 415 Unsupported Meda Type.

### Uploading a File to Imgur
```python
def upload_to_imgur(image):
    global imgur_key
    global imgur_client_id
    url = 'https://api.imgur.com/3/upload.json'
    base64img = base64.b64encode(image)
    imgur_headers = {
          'Authorization': 'Client-ID ' + imgur_client_id,
    }
    r = requests.post(url, headers=imgur_headers, data={'key': imgur_key, 'image':base64img})
    return r.json()['data']['id']
```

## Integrating the Two APIs
Using some of the methods we've seen so far it's incredibly easy to display a list of Dropbox image files to a user, and have them choose which image they would like to upload to Imgur. We can then download the image on the server, base64 encode it, and upload it to Imgur.

### Flask Endpoint Example
```python
@app.route('/imgur', methods=['POST'])
def imgur():
    filename = request.form.get('path')
    image = download_from_dropbox(filename)
    imgur_id = upload_to_imgur(image)
    url = 'https://imgur.com/{}'.format(imgur_id)
    return render_template('imgur.html', url=url, filename=filename)
```
A simple implementation to demonstrate the concept is around 75 lines of code, which speaks to the flexibility and power of high-level dynamic languages like Python and the simplicity of these APIs.

## Further Reading
More information about the APIs can be found on the [Dropbox][0] and [Imgur][1] developer websites. Dropbox even has an interactive API explorer which will generate **curl** commands with the right parameters and syntax for you.
[0]: https://www.dropbox.com/developers
[1]: https://api.imgur.com/endpoints


