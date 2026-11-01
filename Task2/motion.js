/* Task 2 extends the unchanged Task 1 implementation. jQuery owns every effect. */
(function ($) {
  'use strict';
  var $detail = null;
  var $shade = null;
  var detailGuestId = null;
  var requestId = 0;
  var completeMove = null;
  var lastGuest = null;

  function photoBox(id) {
    var $photo = $('#' + id + ' .avatar');
    if (!$photo.length)
      return {
        left: $(window).width() / 2,
        top: $(window).height() / 2,
        width: 48,
        height: 48
      };
    var p = $photo.offset();
    return {
      left: p.left - $(window).scrollLeft(),
      top: p.top - $(window).scrollTop(),
      width: $photo.outerWidth(),
      height: $photo.outerHeight()
    };
  }

  function removeDetail() {
    if ($detail) $detail.stop(true, false).remove();
    if ($shade) $shade.stop(true, false).remove();
    $detail = null;
    $shade = null;
    detailGuestId = null;
  }

  function closeDetail(callback, restoreFocus) {
    if (!$detail) {
      if (callback) callback();
      return;
    }
    var $closing = $detail;
    var box = photoBox(detailGuestId);
    if ($shade) $shade.stop(true, false).fadeOut(220);
    $closing
      .stop(true, false)
      .animate(
        {
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
          opacity: 0
        },
        220,
        function () {
          removeDetail();
          if (restoreFocus && lastGuest && $('#' + lastGuest).length)
            $('#' + lastGuest).trigger('focus');
          if (callback) callback();
        }
      );
  }

  function showDetail(id) {
    var $guest = $('#' + id);
    if (!$guest.length) return;
    detailGuestId = id;
    lastGuest = id;
    var guest = $guest.data('guest');
    var roomId = $guest.closest('.room').attr('id');
    var $body = $('<div>', { class: 'detail-content' });
    $body.append(
      $('<button>', {
        type: 'button',
        class: 'detail-close',
        text: '\u00d7',
        'aria-label': 'Close guest card'
      }),
      $('<span>', { class: 'detail-kicker', text: 'GUEST PROFILE' }),
      $('<h2>', { id: 'profile-title', text: guest.name }),
      $('<p>', { text: 'Came at ' + guest.time }),
      $('<p>', { text: guest.aitu ? 'AITU student' : 'Not an AITU student' }),
      $('<p>', { text: 'Wears ' + guest.color }),
      $('<p>', {
        text:
          'Currently in the ' + $guest.closest('.room').attr('data-name').toLowerCase()
      }),
      $('<p>', {
        text: guest.things.length
          ? 'Has ' +
            guest.things
              .map(function (thing) {
                return thing === 'crumbs'
                  ? 'cake crumbs'
                  : thing === 'glasses'
                    ? 'glasses'
                    : 'a ' + thing;
              })
              .join(', ')
              .replace(/, ([^,]*)$/, ' and $1')
          : 'Has nothing with them'
      }),
      $('<p>', { class: 'move-title', text: 'MOVE TO ANOTHER ROOM' })
    );
    var $buttons = $('<div>', { class: 'move-buttons' });
    $('.room')
      .not('#' + roomId)
      .each(function () {
        $buttons.append(
          $('<button>', {
            type: 'button',
            'data-target-room': this.id,
            text: 'Move to the ' + $(this).attr('data-name').toLowerCase()
          })
        );
      });
    $body.append($buttons);
    $shade = $('<div>', { class: 'detail-shade' }).hide().appendTo('body').fadeIn(180);
    var box = photoBox(id);
    var width = Math.min(338, $(window).width() - 30);
    $detail = $('<section>', {
      class: 'detail-card',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'profile-title'
    })
      .append($body)
      .appendTo('body');
    $body.css('width', width - ($(window).width() <= 650 ? 36 : 46));
    var height = $detail.outerHeight();
    var top = Math.max(15, ($(window).height() - height) / 2);
    $detail
      .css({
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        opacity: 0
      })
      .animate(
        {
          left: ($(window).width() - width) / 2,
          top: top,
          width: width,
          height: height,
          opacity: 1
        },
        280,
        function () {
          $(this).find('.detail-close').trigger('focus');
        }
      );
  }

  function openDetail(id) {
    var token = ++requestId;
    if (completeMove) completeMove();
    closeDetail(function () {
      if (token === requestId) showDetail(id);
    });
  }

  function positions($cards) {
    var map = {};
    $cards.each(function () {
      map[this.id] = $(this).offset();
    });
    return map;
  }

  function slideToLayout($cards, before, duration) {
    $cards.each(function () {
      var $card = $(this);
      var old = before[this.id];
      if (!old) return;
      $card.stop(true, false).css({ left: 0, top: 0 });
      var target = $card.offset();
      $card
        .css({ left: old.left - target.left, top: old.top - target.top })
        .animate({ left: 0, top: 0 }, duration);
    });
  }

  function sortRoom(id) {
    if (completeMove) completeMove();
    ++requestId;
    removeDetail();
    var $room = $('#' + id);
    var $cards = $room.find('.guest');
    // Read the CURRENT visual positions before stopping an unfinished sort.
    var before = positions($cards);
    $cards.stop(true, false).css({ left: 0, top: 0 });
    var room = window.partyApp.getRoom(id);
    room.sorted = !room.sorted;
    $cards
      .sort(function (a, b) {
        if (room.sorted)
          return (
            +$(a).attr('data-minutes') - +$(b).attr('data-minutes') ||
            +$(a).attr('data-order') - +$(b).attr('data-order')
          );
        return +$(a).attr('data-order') - +$(b).attr('data-order');
      })
      .appendTo($room.find('.guests'));
    slideToLayout($cards, before, 420);
    $room
      .find('.sort-button')
      .text(room.sorted ? 'Picture order' : 'Sort by time')
      .attr('aria-pressed', String(room.sorted));
    window.partyApp.syncModel();
    $('.motion-status').text(
      room.name +
        ': ' +
        (room.sorted ? 'sorted by arrival time.' : 'picture order restored.')
    );
  }

  function startMove(id, targetId) {
    if (completeMove) completeMove();
    var $guest = $('#' + id);
    var $target = $('#' + targetId + ' > .guests');
    if (
      !$guest.length ||
      !$target.length ||
      $guest.closest('.room').attr('id') === targetId
    )
      return;
    $('.guest').stop(true, true).css({ left: 0, top: 0 });
    var $sourceRoom = $guest.closest('.room');
    var sourceId = $sourceRoom.attr('id');
    var name = $guest.attr('data-name');
    var before = positions($('.guest').not($guest));
    var origin = $guest.offset();
    var width = $guest.outerWidth(),
      height = $guest.outerHeight();
    var $flying = $guest
      .clone(false)
      .removeAttr('id')
      .removeClass('is-match')
      .addClass('flight')
      .attr('aria-hidden', 'true')
      .prop('disabled', true)
      .css({
        left: origin.left,
        top: origin.top,
        width: width,
        height: height,
        opacity: 1
      })
      .appendTo('body');
    $guest.detach();
    var $slot = $('<div>', { class: 'move-slot', 'aria-hidden': 'true' })
      .css({ width: 0, height: 0 })
      .appendTo($target);
    var destination = $slot.offset();
    var columns = $target.css('grid-template-columns').split(' ').length;
    var gap = parseFloat($target.css('column-gap')) || 0;
    var targetWidth =
      $target.find('.guest').first().outerWidth() ||
      ($target.innerWidth() - gap * (columns - 1)) / columns;
    var $otherCards = $('.guest').not('.flight');
    slideToLayout($otherCards, before, 500); // Neighbours slide into the old gap.
    $slot.animate({ width: targetWidth, height: height }, 500); // A place grows in the new room.
    var finished = false;
    completeMove = function () {
      if (finished) return;
      finished = true;
      completeMove = null;
      $flying.stop(true, false).remove();
      $slot.stop(true, false);
      var order = -1;
      $target.find('.guest').each(function () {
        order = Math.max(order, +$(this).attr('data-order'));
      });
      $guest
        .attr({ 'data-order': order + 1, 'data-room': targetId })
        .css({ left: 0, top: 0, opacity: 1 });
      $slot.replaceWith($guest);
      $.each([sourceId, targetId], function (_, roomId) {
        window.partyApp.getRoom(roomId).sorted = false;
        $('#' + roomId + ' .sort-button')
          .text('Sort by time')
          .attr('aria-pressed', 'false');
      });
      window.partyApp.syncModel();
      $('.motion-status').text(
        name +
          ' moved to the ' +
          $('#' + targetId)
            .attr('data-name')
            .toLowerCase() +
          '. The party array is updated.'
      );
    };
    $flying.animate(
      { left: destination.left, top: destination.top, width: targetWidth },
      650,
      function () {
        if (completeMove) completeMove();
      }
    );
  }

  function settle() {
    ++requestId;
    removeDetail();
    if (completeMove) completeMove();
    $('.guest, .move-slot').stop(true, true).css({ left: 0, top: 0 });
    $('.flight, .move-slot').remove();
  }

  function spotlight($found, action) {
    $('.guest').not($found).stop(true, true).fadeTo(300, 0.2);
    if (!action) $found.css('opacity', 1);
  }

  function init() {
    $('body').addClass('motion');
    $('.chain-panel').before(
      $('<p>', {
        class: 'motion-status',
        'aria-live': 'polite',
        text: 'Click a guest to open their profile, or sort a room by arrival time.'
      })
    );
    $('#house').on('click', '.guest', function () {
      openDetail(this.id);
    });
    $('#house').on('click', '.sort-button', function () {
      sortRoom($(this).closest('.room').attr('id'));
    });
    $(document).on('click', '.detail-shade, .detail-close', function () {
      ++requestId;
      closeDetail(null, true);
    });
    $(document).on('click', '.move-buttons button', function () {
      var id = detailGuestId;
      var targetId = $(this).attr('data-target-room');
      var token = ++requestId;
      closeDetail(function () {
        if (token === requestId) startMove(id, targetId);
      });
    });
    $(document).on('keydown', function (event) {
      if (event.key === 'Escape') {
        ++requestId;
        closeDetail(null, true);
      }
      if (event.key === 'Tab' && $detail) {
        var $buttons = $detail.find('button');
        var first = $buttons[0],
          last = $buttons[$buttons.length - 1];
        if (event.shiftKey && event.target === first) {
          event.preventDefault();
          $(last).trigger('focus');
        } else if (!event.shiftKey && event.target === last) {
          event.preventDefault();
          $(first).trigger('focus');
        }
      }
    });
    $(window).on('resize', settle);
  }

  window.PartyMotion = { init: init, settle: settle, spotlight: spotlight };
})(jQuery);
