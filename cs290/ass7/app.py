import json
import sqlite3
from flask import Flask, render_template, request, g, jsonify

app = Flask(__name__)

DATABASE = './ass7.sqlite'

def make_dicts(cursor, row):
    return dict((cursor.description[idx][0], value)
                for idx, value in enumerate(row))


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = make_dicts
    return db

def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            c = f.read()
            db.cursor().executescript(c)
            db.commit()

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    get_db().commit()
    return (rv[0] if rv else None) if one else rv

@app.route('/delete', methods=['POST'])
def delete_exercise():
    data = request.json.get('date_submitted', -1)
    if isinstance(data, int) and data > 0:
        query_db('DELETE FROM exercises WHERE date_submitted = ?;',
                args=(data,))
        return jsonify({'date_submitted': data})
    else:
        resp = jsonify({
            'error': 'Invalid date_submitted',
            'date_submitted': data
        })
        resp.status_code = 400
        return resp

def validate_request(req):
    if 'date_submitted' not in req:
        return {'error': 'date_submitted is a required field'}, 400
    elif not isinstance(req.get('reps', 0), int):
        return {'error': 'reps must be an integer', 'reps': req.get('reps')}, 400
    elif not isinstance(req.get('weight', 0), int):
        return {'error': 'weight must be an integer', 'weight': req.get('weight')}, 400
    elif not isinstance(req.get('name', ''), (str, unicode)):
        return {'error': 'name must be a string'}, 400
    elif not isinstance(req.get('lbs', True), bool):
        return {'error': 'lbs must be a boolean'}, 400
    elif not isinstance(req.get('date_submitted', 0), int):
        return {'error': 'date_submitted must be a unix epochinteger'}, 400
    else:
        return None, 200

@app.route('/create', methods=['POST'])
def create_exercise():
    error, status = validate_request(request.json)
    if status != 200:
        resp = jsonify(error)
        resp.status_code = status
        return resp

    args = (request.json.get('name', ''),
            request.json.get('reps', 0),
            request.json.get('weight', 0),
            request.json.get('lbs', True),
            request.json.get('date_submitted'))
    try:
        query_db('INSERT INTO exercises VALUES ((?), (?), (?), (?), (?))',
                args=args)
    except sqlite3.IntegrityError:
        resp = jsonify({'error': 'duplicate date submitted',
            'date_submitted': request.json.get('date_submitted')})
        resp.status_code = 400
        return resp
    return jsonify({'date_submitted': request.json.get('date_submitted')})

@app.route('/update', methods=['POST'])
def update_exercise():
    error, status = validate_request(request.json)
    if status != 200:
        resp = jsonify(error)
        resp.status_code = status
        return resp

    args = (request.json.get('name', ''),
            request.json.get('reps', 0),
            request.json.get('weight', 0),
            request.json.get('lbs', True),
            request.json.get('date_submitted'))
    query_db('UPDATE exercises SET name=?, reps=?, weight=?, lbs=? ' +
             'WHERE date_submitted=(?);', args=args)
    return jsonify({'date_submitted': request.json.get('date_submitted')})


@app.route('/edit', methods=['POST'])
def edit_exercise():

    ds = request.form.get('date_submitted', None)
    try:
        ds = int(ds)
    except:
        return render_template('oops.html', ds=ds)
    ds = int(ds)
    exercise = query_db('select * from exercises where date_submitted=(?)', args=[ds], one=True);
    if exercise:
        return render_template('edit.html', exercise=exercise)
    else:
        return render_template('oops.html', ds=ds)

@app.route('/')
def show_exercises():
    exercises = query_db('select * from exercises')
    return render_template('view.html', exercises=exercises)


if __name__ == '__main__':
    app.run()
