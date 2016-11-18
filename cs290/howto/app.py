import base64
import requests
import json
from flask import Flask, render_template, request
app = Flask(__name__)

dropbox_secret = '1cl1sajsenyfiz7';
dropbox_key = 'rn7wvvbi1tb5ap2';
dropbox_token = 'VisxM_7dpZAAAAAAAAAAB7UlLlPIGBIPSIMe4ySYmlOWJgj0CYG4PcwVWiaiTie1';

imgur_key = 'e4d31dbb14e259fa15db0878bb1ae5def4075fb0';
imgur_client_id = '669c016e544468d';



def download_from_dropbox(path):
    global dropbox_token
    url = "https://content.dropboxapi.com/2/files/download"
    headers = {
        "Authorization": "Bearer {}".format(dropbox_token),
        "Dropbox-API-Arg": '{"path": "/' + path + '"}'
    }

    r = requests.post(url, headers=headers)
    return r.content

def upload_to_imgur(image):
    global imgur_key
    global imgur_client_id

    url = 'https://api.imgur.com/3/upload.json'

    base64img = base64.b64encode(image)

    imgur_headers = {
          'Authorization': 'Client-ID ' + imgur_client_id,
    }

    r = requests.post(url, headers=imgur_headers, data={'key': imgur_key, 'image':base64img})

    print r.json()
    return r.json()['data']['id']


@app.route('/imgur', methods=['POST'])
def imgur():
    filename = request.form.get('path')
    image = download_from_dropbox(filename)
    imgur_id = upload_to_imgur(image)
    url = 'https://imgur.com/{}'.format(imgur_id)
    return render_template('imgur.html', url=url, filename=filename)


@app.route('/')
def root():
    url = "https://api.dropboxapi.com/2/files/search"

    headers = {
        "Authorization": "Bearer VisxM_7dpZAAAAAAAAAAB7UlLlPIGBIPSIMe4ySYmlOWJgj0CYG4PcwVWiaiTie1",
        "Content-Type": "application/json"
    }

    data = {
        "path": "",
        "query": ".png"
    }

    r = requests.post(url, headers=headers, data=json.dumps(data))
    #print 'https://imgur.com/' + json.loads(r.content)['data']['id']
    # import pdb;pdb.set_trace()
    j = r.json()
    return render_template('./index.html', matches=j['matches'], uploaded=False)

if __name__ == '__main__':
    app.run()
