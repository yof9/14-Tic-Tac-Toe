/* 
events - a super-basic Javascript (publish subscribe) pattern
Events module by learncode.academy, edited
github: https://gist.github.com/learncodeacademy/777349747d8382bfb722
youtube: https://www.youtube.com/watch?v=nQRXi1SVOow&list=PLoYCgNOIyGABs-wDaaxChu82q_xQgUb4f&index=4
*/
const events = (function () {
    const events = {};

    function on(eventName, fn) {
      events[eventName] = events[eventName] || [];
      events[eventName].push(fn);
    };

    function off(eventName, fn) {
      if (events[eventName]) {
        for (let fun of events[eventName]) {
          if (fun === fn) {
            events[eventName].pop(fun);
            break;
          }
        };
      }
    };

    function emit(eventName, data) {
      if (events[eventName]) {
        events[eventName].forEach(function(fn) {
          fn(data);
        });
      }
    }
    
    return({on, off, emit})
})();
