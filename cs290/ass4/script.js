function initTable() {
  var body = document.body;
  var table = document.createElement('table');
  var headers = table.insertRow();


  for (var header = 0; header < Width; header++) {
    var td = headers.insertCell();
    td.appendChild(document.createTextNode('Header ' + (header + 1)));
    td.style.border = '1px solid black';
  }
  for (var row = 0; row < Height; row++) {
    var tr = table.insertRow();
    for (var col = 0; col < Width; col++) {
      var td = tr.insertCell();
      var name = pairToId(col, row);
      td.appendChild(document.createTextNode(name));
      td.id = name;
      td.style.border = '1px solid black';
    }
  }
  body.appendChild(table);
}

function initButtons() {
  var body = document.body;
  var div = document.createElement('div');
  var upButton = document.createElement('button');
  upButton.appendChild(document.createTextNode('Up'));
  upButton.onclick = goUp;
  div.appendChild(upButton);

  var downButton = document.createElement('button');
  downButton.appendChild(document.createTextNode('Down'));
  downButton.onclick = goDown;
  div.appendChild(downButton);

  var leftButton = document.createElement('button');
  leftButton.appendChild(document.createTextNode('Left'));
  leftButton.onclick = goLeft;
  div.appendChild(leftButton);


  var rightButton = document.createElement('button');
  rightButton.appendChild(document.createTextNode('Right'));
  rightButton.onclick = goRight;
  div.appendChild(rightButton);

  var markCellButton = document.createElement('button');
  markCellButton.appendChild(document.createTextNode('Mark Cell'));
  markCellButton.onclick = markCell;
  div.appendChild(markCellButton);

  body.appendChild(div);
}

function pairToId(x, y) {
  if (x < 0 || x > 3) {
    throw 'invalid x ' + x
  }
  if (y < 0 || y > 3) {
    throw 'invalid y ' + y
  }
  return (x + 1) + ', ' + (y + 1);
}

function embolden(x, y) {
  var element = document.getElementById(pairToId(x, y));
  element.style.border = '5px solid black';
}

function unbolden(x, y) {
  var element = document.getElementById(pairToId(x, y));
  element.style.border = '1px solid black';
}

function goRight() {
  if (X + 1 < Width) {
    unbolden(X, Y);
    X = X + 1;
    embolden(X, Y);
  }
}

function goLeft() {
  if (X - 1 >= 0) {
    unbolden(X, Y);
    X = X - 1;
    embolden(X, Y);
  }
}

function goUp() {
  if (Y - 1 >= 0) {
    unbolden(X, Y);
    Y = Y - 1;
    embolden(X, Y);
  }
}

function goDown() {
  if (Y + 1 < Height) {
    unbolden(X, Y);
    Y = Y + 1;
    embolden(X, Y);
  }
}

function markCell() {
  var cell = document.getElementById(pairToId(X, Y));
  cell.style.background = 'yellow';
}

var X = 0;
var Y = 0;
var Height = 4;
var Width = 4;

initTable();
initButtons();
embolden(X, Y);
