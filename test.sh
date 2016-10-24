set -e
URL=numinous-nimbus.herokuapp.com
heroku run node fill.js
curl -H "Content-Type: application/json" -X POST -d '{"screencast":{"subject":"tools"}}' $URL/ubuntu/g++ | grep '{"error":"No correct fields were sent"}'
curl -s -H "Content-Type: application/json" -X GET $URL/ubuntu/gcc | grep '"website":"gnu.org"'
curl -s -H "Content-Type: application/json" -X GET $URL/ubuntu/gcc | grep '"install_command":""'
curl -s -H "Content-Type: application/json" -X GET $URL/ubuntu/gcc | grep '"last_updated":0'
curl -s -H "Content-Type: application/json" -X GET $URL/ubuntu/gcc | grep '"caveats":\[.*\]'
curl -s -H "Content-Type: application/json" -X DELETE $URL/ubuntu/gcc | grep ok
curl -s -H "Content-Type: application/json" -X GET $URL/ubuntu/gcc | grep 'not found'
curl -s -H "Content-Type: application/json" -X POST -d '{"last_updated":0}' $URL/ubuntu/gcc
curl -s -H "Content-Type: application/json" -X GET $URL/ubuntu/gcc | grep '{"last_updated":0}'
curl -s -H "Content-Type: application/json" -X PUT -d '{"website":"example.com","last_updated":1}' $URL/ubuntu/gcc | grep 'ok'
curl -s -H "Content-Type: application/json" -X GET  $URL/ubuntu/gcc | grep '"last_updated":1'
curl -s -H "Content-Type: application/json" -X GET  $URL/ubuntu/gcc | grep '"website":"example.com"'
