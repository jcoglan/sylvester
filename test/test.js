var resultList, nTests = 0, nFailures = 0;

var assert = function(testName, condition, message) {
  nTests++;
  var display, klass;
  if (condition) {
    klass = 'success';
    display = 'Passed';
  } else {
    nFailures++;
    klass = 'failure';
    display = (message ? '\n\n' + message : 'Failure').replace(/\n/g, '<br />');
  }
  var item = document.createElement('li');
  resultList.appendChild(item);
  item.className = klass;
  item.innerHTML = testName + ': ' + display;
};

var benchmark = function(fn, n) {
  n = n || 100; k = n;
  var A = new Date().getTime();
  do { fn() } while (--n);
  var B = new Date().getTime();
  alert('Completed ' + k + ' executions in ' + ((B-A)/1000) + ' seconds');
};

var title = function(str) {
  var item = document.createElement('li');
  resultList.appendChild(item);
  item.innerHTML = str;
};
