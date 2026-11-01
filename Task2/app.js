/* All page behaviour uses jQuery. Cases query the DOM, never the party array. */
(function ($) {
  'use strict';

  var party = $.extend(true, [], window.partySeed);
  var palette = ['#d4a17c', '#a87855', '#e9be9b', '#795744', '#c58b66'];
  var icons = {
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 19h2"/>',
    glasses:
      '<circle cx="6" cy="14" r="4"/><circle cx="18" cy="14" r="4"/><path d="M10 13h4M2 13l2-6M22 13l-2-6"/>',
    bag: '<path d="M4 8h16l-2 13H6L4 8Z"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
    cup: '<path d="M4 9h13v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9ZM17 10h2a3 3 0 0 1 0 6h-2M7 5V2M12 5V2"/>',
    crumbs:
      '<path d="m3 11 9-8 7 8H3Zm0 0v10h16V11M3 16h16"/><circle cx="22" cy="15" r=".7"/><circle cx="22" cy="20" r=".7"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons[name] + '</svg>';
  }
  function minutes(time) {
    var parts = time.split(':');
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  function avatar(guest) {
    var seed = 0;
    $.each(guest.id.split(''), function (_, ch) {
      seed += ch.charCodeAt(0);
    });
    var skin = palette[seed % palette.length];
    var hair = seed % 2 ? '#362d2b' : '#604731';
    // Original vector portraits, drawn locally; no avatar service is required.
    return (
      '<svg viewBox="0 0 80 80" aria-hidden="true"><path fill="var(--clothing)" d="M5 80q3-24 35-24t35 24Z"/>' +
      '<path fill="' +
      hair +
      '" d="M16 39Q10 8 40 7t24 35v19H16Z"/>' +
      '<path fill="' +
      skin +
      '" d="M33 48h14v16H33Z"/>' +
      '<ellipse fill="' +
      skin +
      '" cx="40" cy="34" rx="21" ry="25"/>' +
      '<path fill="' +
      hair +
      '" d="M18 31Q13 5 40 6t23 27L51 17q-8 14-33 14Z"/>' +
      '<circle fill="#302a29" cx="32" cy="35" r="1.8"/><circle fill="#302a29" cx="48" cy="35" r="1.8"/>' +
      '<path fill="none" stroke="#714b3e" stroke-width="2" stroke-linecap="round" d="M35 46q5 4 10 0"/>' +
      (seed % 3 === 0
        ? '<path fill="' + hair + '" d="M18 27q-9 6-5 33l10-4V27Z"/>'
        : '') +
      '</svg>'
    );
  }

  function makeGuest(guest, order, roomId) {
    if ($('#' + guest.id).length) return $('#' + guest.id);
    var $card = $('<button>', {
      type: 'button',
      id: guest.id,
      class: 'guest ' + guest.color + (guest.aitu ? ' aitu' : '')
    });
    $card.attr({
      'data-name': guest.name,
      'data-color': guest.color,
      'data-time': guest.time,
      'data-minutes': minutes(guest.time),
      'data-aitu': String(guest.aitu),
      'data-things': guest.things.join(' '),
      'data-order': order,
      'data-room': roomId,
      'aria-label':
        guest.name +
        ', ' +
        guest.time +
        ', ' +
        guest.color +
        ', ' +
        (guest.aitu ? 'AITU student' : 'not an AITU student') +
        ', ' +
        (guest.things.join(', ') || 'no things')
    });
    $card.data('guest', $.extend(true, {}, guest));
    var $photo = $('<span>', { class: 'avatar' }).html(avatar(guest));
    if (guest.aitu) $photo.append($('<span>', { class: 'aitu-badge', text: 'AITU' }));
    $card.append(
      $photo,
      $('<span>', { class: 'guest-name', text: guest.name }),
      $('<span>', { class: 'guest-time', text: guest.time })
    );
    var $things = $('<span>', { class: 'things' });
    $.each(guest.things, function (_, thing) {
      $card.addClass('has-' + thing);
      $things.append(
        $('<span>', { class: 'thing', title: thing, 'aria-label': thing }).html(
          icon(thing)
        )
      );
    });
    if (!guest.things.length)
      $things.append($('<span>', { class: 'no-things', text: 'No things' }));
    return $card.append($things);
  }

  function renderHouse() {
    $('#house').empty();
    $.each([2, 1], function (_, floor) {
      var $floor = $('<section>', { class: 'floor', 'data-floor': floor });
      $floor.append(
        $('<div>', {
          class: 'floor-label',
          text: floor === 2 ? '02 / UPSTAIRS' : '01 / DOWNSTAIRS'
        })
      );
      var $rooms = $('<div>', { class: 'rooms' });
      $.each(party, function (_, room) {
        if (room.floor !== floor) return;
        var $room = $('<section>', {
          id: room.id,
          class: 'room',
          'data-name': room.name,
          'data-floor': room.floor
        });
        var $header = $('<header>', { class: 'room-header' });
        $header.append(
          $('<h3>')
            .text(room.name)
            .append(
              $('<span>', { class: 'room-count', text: room.guests.length + ' guests' })
            )
        );
        if (window.PartyMotion) {
          $header.append(
            $('<button>', {
              type: 'button',
              class: 'sort-button',
              text: room.sorted ? 'Picture order' : 'Sort by time',
              'aria-pressed': String(!!room.sorted)
            })
          );
        } else
          $header.append($('<span>', { class: 'room-floor', text: 'FLOOR ' + floor }));
        var $guests = $('<div>', { class: 'guests' });
        $.each(room.guests, function (index, guest) {
          if (guest.order === undefined) guest.order = index;
          $guests.append(makeGuest(guest, guest.order, room.id));
        });
        $rooms.append($room.append($header, $guests));
      });
      $('#house').append($floor.append($rooms));
    });
  }

  // Each run function contains one outer jQuery chain. Inner filters also read DOM data.
  var cases = [
    {
      n: 1,
      short: 'Guests in the hall',
      title: 'Who is in the hall?',
      run: function () {
        return $('#hall .guest');
      }
    },
    {
      n: 2,
      short: 'Yellow or purple',
      title: 'Who wears yellow or purple?',
      run: function () {
        return $('.guest.yellow, .guest.purple');
      }
    },
    {
      n: 3,
      short: 'AITU upstairs',
      title: 'Which AITU students are upstairs?',
      run: function () {
        return $('.floor[data-floor="2"] .guest.aitu');
      }
    },
    {
      n: 4,
      short: 'Glasses or a bag',
      title: 'Who has glasses or a bag?',
      run: function () {
        return $('.guest.has-glasses, .guest.has-bag');
      }
    },
    {
      n: 5,
      short: 'Empty hands',
      title: 'Who came with nothing?',
      run: function () {
        return $('.guest[data-things=""]');
      }
    },
    {
      n: 6,
      short: 'Phone without a bag',
      title: 'Who has a phone but no bag?',
      run: function () {
        return $('.guest.has-phone:not(.has-bag)');
      }
    },
    {
      n: 7,
      short: '20:30 through 21:00',
      title: 'Who arrived from 20:30 to 21:00 inclusive?',
      run: function () {
        return $('.guest').filter(function () {
          return (
            +$(this).attr('data-minutes') >= 1230 && +$(this).attr('data-minutes') <= 1260
          );
        });
      }
    },
    {
      n: 8,
      short: 'Late nonstudents',
      title: 'Who arrived after 21:00 and is not an AITU student?',
      run: function () {
        return $('.guest:not(.aitu)').filter(function () {
          return +$(this).attr('data-minutes') > 1260;
        });
      }
    },
    {
      n: 9,
      short: 'Next to Askar',
      title: 'Who stands right next to Askar?',
      run: function () {
        return $('#askar').prev('.guest').add($('#askar').next('.guest'));
      }
    },
    {
      n: 10,
      short: 'Last in each room',
      title: 'Who stands last in each room?',
      run: function () {
        return $('.guests > .guest:last-child');
      }
    },
    {
      n: 11,
      short: 'Third in each room',
      title: 'Who stands third in each room?',
      run: function () {
        return $('.guests > .guest:nth-child(3)');
      }
    },
    {
      n: 12,
      short: 'After Timur',
      title: 'Who stands after Timur in his room?',
      run: function () {
        return $('#timur').nextAll('.guest');
      }
    },
    {
      n: 13,
      short: 'Before black clothing',
      title: 'Who stands right before someone in black?',
      run: function () {
        return $('.guest.black').prev('.guest');
      }
    },
    {
      n: 14,
      short: 'Find Aruzhan room',
      title: 'In which room is Aruzhan?',
      roomResult: true,
      run: function () {
        return $('#aruzhan').closest('.room');
      }
    },
    {
      n: 15,
      short: 'Rooms with fewer than 6',
      title: 'Which rooms have fewer than six guests?',
      roomResult: true,
      run: function () {
        return $('.room').filter(function () {
          return $(this).find('.guest').length < 6;
        });
      }
    },
    {
      n: 16,
      short: 'Cups without glasses',
      title: 'Which rooms have a cup but no glasses?',
      roomResult: true,
      run: function () {
        return $('.room:has(.has-cup):not(:has(.has-glasses))');
      }
    },
    {
      n: 17,
      short: 'Earliest arrivals',
      title: 'Who came first to each room?',
      run: function () {
        return $('.guest').filter(function () {
          var time = +$(this).attr('data-minutes');
          return !$(this)
            .siblings('.guest')
            .filter(function () {
              return +$(this).attr('data-minutes') < time;
            }).length;
        });
      }
    },
    {
      n: 18,
      short: 'Miras joins the party',
      title: 'Miras arrives between Askar and Inkar',
      action: 'join',
      run: function () {
        return makeGuest(
          {
            id: 'miras',
            name: 'Miras',
            color: 'blue',
            time: '21:20',
            aitu: true,
            things: ['phone']
          },
          5,
          'living-room'
        )
          .hide()
          .insertAfter($('#askar'))
          .fadeIn(350);
      }
    },
    {
      n: 19,
      short: 'Natasha says goodbye',
      title: 'Natasha leaves the party',
      action: 'leave',
      run: function () {
        return $('#natasha')
          .animate({ top: -10 }, 150)
          .animate({ top: 0 }, 170)
          .fadeOut(350, function () {
            $(this).remove();
            updateCounts();
          });
      }
    },
    {
      n: 20,
      short: 'Who took the cake?',
      title: 'Who took the cake?',
      run: function () {
        return $('.floor[data-floor="1"] .guest.has-crumbs:not(.has-cup)')
          .filter(function () {
            var t = +$(this).attr('data-minutes');
            return t > 1260 && t < 1290;
          })
          .filter(function () {
            return $(this).prev('.aitu').add($(this).next('.aitu')).length > 0;
          });
      }
    }
  ];

  function updateCounts() {
    $('.room').each(function () {
      $(this)
        .find('.room-count')
        .text($(this).find('.guest').length + ' guests');
    });
  }

  function jump($guests) {
    $guests
      .stop(true, true)
      .css('top', 0)
      .animate({ top: -10 }, 150)
      .animate({ top: 0 }, 170);
  }

  function clearResult() {
    $('.guest')
      .stop(true, true)
      .css({ top: 0, left: 0, opacity: 1 })
      .removeClass('is-match');
    $('.room').removeClass('is-room-match');
    $('.case-button').removeClass('active').attr('aria-pressed', 'false');
    $('#result-label').text('READY TO INVESTIGATE');
    $('#result-title').text('Follow the clues');
    $('#result-names').text('Choose a case to find guests or rooms.');
    $('#chain-code').text('Select a case to see its DOM query.');
  }

  function chooseCase(n) {
    if (window.PartyMotion) window.PartyMotion.settle();
    $('.guest').stop(true, true);
    renderHouse(); // Rebuild from current array before EVERY case, including 18 and 19.
    var item = cases[n - 1];
    var $found = item.run();
    var names = $found
      .map(function () {
        return $(this).attr('data-name');
      })
      .get();
    var $guests = item.roomResult ? $found.find('.guest') : $found;
    $('.case-button').removeClass('active').attr('aria-pressed', 'false');
    $('.case-button[data-case="' + n + '"]')
      .addClass('active')
      .attr('aria-pressed', 'true');
    $found.addClass(item.roomResult ? 'is-room-match' : 'is-match');
    if (item.roomResult) $guests.addClass('is-match');
    // Appearance/disappearance owns the fx queue in cases 18/19; jump only after it completes.
    if (item.action === 'join')
      $found.promise('fx').done(function () {
        jump($found);
        updateCounts();
      });
    else if (item.action !== 'leave') jump($guests);
    if (window.PartyMotion) window.PartyMotion.spotlight($guests, item.action);
    $('#result-label').text(
      'CASE ' +
        String(n).padStart(2, '0') +
        ' / ' +
        $found.length +
        ' ' +
        (item.roomResult ? 'ROOM' : 'GUEST') +
        ($found.length === 1 ? '' : 'S')
    );
    $('#result-title').text(item.title);
    $('#result-names').text(
      (names.join(', ') || 'No matches') +
        (n === 20
          ? ' - downstairs at 21:10, crumbs, no cup; next to Daniel and Natasha (AITU).'
          : n === 19
            ? ' - faded out and removed.'
            : '')
    );
    $('#chain-code').text(
      item.run
        .toString()
        .replace(/^function\s*\(\)\s*\{\s*return\s*/, '')
        .replace(/;?\s*\}$/, '')
        .replace(/;$/, '') + ';'
    );
    updateCounts();
  }

  function syncModel() {
    // Mutations are persisted only after a user move or sort. Cases remain DOM queries.
    $.each(party, function (_, room) {
      room.guests = $('#' + room.id + ' > .guests > .guest')
        .map(function () {
          var guest = $.extend(true, {}, $(this).data('guest'));
          guest.order = +$(this).attr('data-order');
          return guest;
        })
        .get();
    });
    updateCounts();
  }

  window.partyApp = {
    cases: cases,
    chooseCase: chooseCase,
    makeGuest: makeGuest,
    render: renderHouse,
    syncModel: syncModel,
    updateCounts: updateCounts,
    getParty: function () {
      return $.extend(true, [], party);
    },
    getRoom: function (id) {
      return $.grep(party, function (room) {
        return room.id === id;
      })[0];
    }
  };

  $(function () {
    $.each(cases, function (_, item) {
      $('#case-list').append(
        $('<button>', {
          type: 'button',
          class: 'case-button',
          'data-case': item.n,
          'aria-pressed': 'false'
        }).append(
          $('<span>', { class: 'number', text: String(item.n).padStart(2, '0') }),
          $('<span>', { text: item.short })
        )
      );
    });
    $('[data-icon]').each(function () {
      $(this).prepend(icon($(this).attr('data-icon')));
    });
    renderHouse();
    $('#case-list').on('click', '.case-button', function () {
      chooseCase(+$(this).attr('data-case'));
    });
    $('.chain-panel summary').on('click', function (event) {
      event.preventDefault();
      var $panel = $(this).parent();
      $panel.prop('open', !$panel.prop('open'));
    });
    $('#clear').on('click', function () {
      if (window.PartyMotion) window.PartyMotion.settle();
      clearResult();
    });
    $('#reset').on('click', function () {
      if (window.PartyMotion) window.PartyMotion.settle();
      $('.guest').stop(true, true);
      party = $.extend(true, [], window.partySeed);
      renderHouse();
      clearResult();
      $('.motion-status').text('Party restored to the picture order.');
    });
    if (window.PartyMotion) window.PartyMotion.init();
  });
})(jQuery);
