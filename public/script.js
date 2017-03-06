$(document).ready(function() {
  Function.prototype.papp = function () {
    var slice = Array.prototype.slice;
    var fn = this;
    var args = slice.call(arguments);
    return function () {
      return fn.apply(this, args.concat(slice.call(arguments)));
    };
  };
  var url = "http://localhost:50047";
  var bookForm = $('#bookForm');
  var resultContainer = $('#result');
  var detailContainer = $('#detail');
  var showDetail = $('#show-detail');
  var inputs = ['title', 'genre', 'description', 'author', 'publisher', 'pages', 'image_url', 'buy_url', 'book_id', 'genre_id'];
  var mappedInputs = inputs.map(function(index, i) {
      var res = {};
      res[index] = bookForm.find('.'+index);
      return res;
  });

  showDetail.on('click', function() {
    detailContainer.slideToggle()
  })

  var Input = collect(mappedInputs);

  for (var key in Input) {
     if (Input.hasOwnProperty(key)) {
        Input[key].val(localStorage.getItem(Input[key].attr('class')) ? localStorage.getItem(Input[key].attr('class')) : null);
     }
  }

  ajaxHandler({ type: "GET", required_both: true });

  // handle radio change
  $('input[type=radio][name=action]').change(function() {
    switch (this.value) {
      case "list": {
        for (var key in Input) {
          if (Input.hasOwnProperty(key)) {
            Input[key].parent().parent().fadeOut();
          }
        }
        break;
      }
      case "search": {
        for (var key in Input) {
          if (Input.hasOwnProperty(key)) {
            Input[key].parent().parent().fadeOut();
          }
        }
        Input["book_id"].parent().parent().fadeIn();
        break;
      }
      case "create": {
        for (var key in Input) {
          if (Input.hasOwnProperty(key)) {
            Input[key].parent().parent().fadeIn();
          }
        }
        Input["book_id"].parent().parent().fadeOut();
        Input["genre_id"].parent().parent().fadeOut();
        break;
      }
      case "update": {
        for (var key in Input) {
          if (Input.hasOwnProperty(key)) {
            Input[key].parent().parent().fadeIn();
          }
        }
        break;
      }
      case "delete": {
        for (var key in Input) {
          if (Input.hasOwnProperty(key)) {
            Input[key].parent().parent().fadeOut();
          }
        }
        Input["book_id"].parent().parent().fadeIn();
        Input["genre_id"].parent().parent().fadeIn();
        break;
      }
    }
  });

  // handle form
  bookForm.on('submit', function(e) {
    e.preventDefault();
    for (var key in Input) {
       if (Input.hasOwnProperty(key)) {
          localStorage.setItem(Input[key].attr('class'), Input[key].val());
       }
    }

    // serialize value into array
    var arr = $(this).serializeArray();

    // serializeArray to multiple objects
    var mapToObj = arr.map(function(index, i) {
      var res = {};
      if (index.name === "pages") res[index.name] = parseInt(index.value);
      res[index.name] = index.value;
      return res;
    });
    var result = collect(mapToObj);

    // AJAX handler
    switch(result.action) {
      case "list": {
        ajaxHandler({ type: "GET", required_both: true });
        break;
      }
      case "search": {
        ajaxHandler({
          type: "GET",
          book_id: Input.book_id.val()
        });
        break;
      }
      case "create": {
        ajaxHandler({ type: "POST", data: result, required_both: true });
        break;
      }
      case "update": {
        ajaxHandler({
          type: "PUT",
          data: result,
          genre_id: Input.genre_id.val() ? Input.genre_id.val() : null,
          book_id: Input.book_id.val() ? Input.book_id.val() : null
        });
        break;
      }
      case "delete": {
        ajaxHandler({
          type: "DELETE",
          data: result,
          genre_id: Input.genre_id.val() ? Input.genre_id.val() : null,
          book_id: Input.book_id.val() ? Input.book_id.val() : null
        });
        break;
      }
    }
  });


  function ajaxHandler(ajax) {
    resultContainer.slideUp(10);

    var AJAX = clean(ajax);
    var glob;
    var genres = AJAX.genre_id ? url+"/api/genres/"+AJAX.genre_id : url+"/api/genres";
    var books = AJAX.book_id ? url+"/api/books/"+AJAX.book_id : url+"/api/books";

    // conditional running ajax
    if (!AJAX.required_both) {
      if (!AJAX.book_id) {
        $.when(genreAjax()).then(glob);
      } else if (!AJAX.genre_id) {
        $.when(bookAjax()).then(glob)
      } else {
        $.when(
          genreAjax(),
          bookAjax()
        ).then(glob);
      }
    } else {
      $.when(
        genreAjax(),
        bookAjax()
      ).then(glob);
    }

    function genreAjax() {
      $.ajax({
        type: AJAX.type,
        url: genres,
        data: JSON.stringify(AJAX.data),
        success: function(genre) {
          if (!AJAX.required_both) {
            if (!AJAX.book_id) {
              glob = success(genre)
            } else {
              glob = success.papp(genre);
            }
          } else {
            glob = success.papp(genre)
          }
        },
        error: function(err) {
          console.log(err);
        },
        async: true,
        contentType: 'application/json'
      });
    }

    function bookAjax() {
      $.ajax({
        type: AJAX.type,
        url: books,
        data: JSON.stringify(AJAX.data),
        success: function(book) {
          if (!AJAX.required_both) {
            if (!AJAX.genre_id) {
              glob = success(book)
            } else {
              glob(book)
            }
          } else {
            glob(book)
          }
        },
        error: function(err) {
          console.log(err);
        },
        async: true,
        contentType: 'application/json'
      });
    }

    function success(data1, data2) {

      var res;
      if (!AJAX.required_both) {
        if (!AJAX.genre_id || !AJAX.book_id) {
          res = JSON.stringify(data1, null, 2)
        } else {
          res = [
            "GENRE:\n"+JSON.stringify(data1, null, 2),
            "BOOKS:\n"+JSON.stringify(data2, null, 2)
          ].join('\n\n\n');
        }
      } else {
        res = [
          "GENRE:\n"+JSON.stringify(data1, null, 2),
          "BOOKS:\n"+JSON.stringify(data2, null, 2)
        ].join('\n\n\n');
      }
      detailContainer.html(syntaxHighlight(res));

      var genreTemplate = function(data) {
        return '<h2>'+data.name+'</h2>'+
        '<p> Published <small>'+data.create_date+'</small></p>';
      }
      var bookTemplate = function(data) {
        return '<h2>'+data.title+'</h2>'+
        '<h4> By '+data.author+'</h4>'+
        '<p> Published by '+data.publisher+' <small>'+data.create_date+'</small></p>'+
        '<p>'+data.description+'</p>'+
        '<small><i>Genre '+data.genre+'</i></small><br/>'+
        '<small><i>Grab on <a href="#">'+data.buy_url+'</a></i></small><br/>'+
        '<small><i>Media <a href="#">'+data.image_url+'</a></i></small>';
      }
      if (!AJAX.required_both) {
        switch (AJAX.type) {
          case "DELETE": {
            if (!AJAX.genre_id) resultContainer.html('success delete BOOK id ' + AJAX.book_id )
            if (!AJAX.book_id) resultContainer.html('success delete GENRE id ' + AJAX.genre_id )
            if (AJAX.book_id && AJAX.genre_id) resultContainer.html('success delete GENRE id ' + AJAX.genre_id + ' & BOOK id ' + AJAX.book_id)
            break;
          }
          default: {
            if (!AJAX.genre_id) {
              resultContainer.html(bookTemplate(data1));
            } else if (!AJAX.book_id) {
              resultContainer.html(genreTemplate(data1));
            } else {
              resultContainer.html('<h1>Genre</h1>'+ genreTemplate(data1) +'<h1>Book</h1>'+ bookTemplate(data2))
            }
            break;
          }
        }
      } else {
        switch (AJAX.type) {
          case "POST": {
            resultContainer.html('<h1>Genre</h1>'+ genreTemplate(data1) +'<h1>Book</h1>'+ bookTemplate(data2))
            break;
          }
          default: {
            var res1 = data1.map(function(index, i) {
              return genreTemplate(index)
            });
            var res2 = data2.map(function(index, i) {
              return bookTemplate(index)
            })
            resultContainer.html('<h1>Genre</h1>'+ res1.join('') +'<hr/><h1>Book</h1>'+ res2.join(''))
            break;
          }
        }
      }
      resultContainer.slideDown(500);
    }
  }

  // function concat properties
  function collect(arr) {
    var ret = {};
    var len = arr.length;
    for (var i=0; i<len; i++) {
      for (p in arr[i]) {
        if (arr[i].hasOwnProperty(p)) {
          ret[p] = arr[i][p];
        }
      }
    }
    return ret;
  }

  // remove unused properties in obj
  function clean(obj) {
    for (var propName in obj) {
      if (obj[propName] === null || obj[propName] === undefined) {
        delete obj[propName];
      }
    }
    return obj
  }

  // highlight syntax
  function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      var cls = 'number';
      if (/^"/.test(match)) {
          if (/:$/.test(match)) {
              cls = 'key';
          } else {
              cls = 'string';
          }
      } else if (/true|false/.test(match)) {
          cls = 'boolean';
      } else if (/null/.test(match)) {
          cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }
});
