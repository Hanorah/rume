$(window).load(function () {
	$('.loading').fadeOut('fast');
	$('.container').fadeIn('fast');
});

$('document').ready(function () {
	var vw;
	var STEP_DELAY = 1800;
	var balloonsFlying = false;

	function showNext(current, nextId) {
		$(current).fadeOut('slow').delay(STEP_DELAY).promise().done(function () {
			$(nextId).fadeIn('slow');
		});
	}

	function killBalloonLoops() {
		balloonsFlying = false;
		$('.balloons').stop(true, false);
	}

	function lineUpBalloons() {
		var w = $(window).width();
		var ids = ['#b11', '#b22', '#b33', '#b44', '#b55', '#b66', '#b77'];
		var gap = w < 480 ? Math.floor((w - 40) / 7) : w < 768 ? 70 : 100;
		var start = Math.max(8, (w - gap * 6) / 2 - 20);
		var topY = w < 480 ? 70 : 90;
		var scale = w < 480 ? 0.62 : w < 768 ? 0.8 : 1;

		$('.balloons').css({
			opacity: 0.95,
			transform: 'scale(' + scale + ')',
			transformOrigin: 'top center'
		});

		ids.forEach(function (id, i) {
			$(id).animate({ top: topY, left: start + i * gap }, 500);
		});
		$('.balloons h4').css({ display: 'block', opacity: 1 });
	}

	$(window).resize(function () {
		if ($('body').hasClass('letter-open')) return;
		if ($('#b11').length) lineUpBalloons();
	});

	$('#turn_on').click(function () {
		$('#bulb_yellow').addClass('bulb-glow-yellow');
		$('#bulb_red').addClass('bulb-glow-red');
		$('#bulb_blue').addClass('bulb-glow-blue');
		$('#bulb_green').addClass('bulb-glow-green');
		$('#bulb_pink').addClass('bulb-glow-pink');
		$('#bulb_orange').addClass('bulb-glow-orange');
		$('body').addClass('peach');
		showNext(this, '#play');
	});

	$('#play').click(function () {
		var audio = $('.song')[0];
		audio.play();
		$('#bulb_yellow').addClass('bulb-glow-yellow-after');
		$('#bulb_red').addClass('bulb-glow-red-after');
		$('#bulb_blue').addClass('bulb-glow-blue-after');
		$('#bulb_green').addClass('bulb-glow-green-after');
		$('#bulb_pink').addClass('bulb-glow-pink-after');
		$('#bulb_orange').addClass('bulb-glow-orange-after');
		$('body').addClass('peach-after');
		showNext(this, '#bannar_coming');
	});

	$('#bannar_coming').click(function () {
		$('.bannar').addClass('bannar-come');
		showNext(this, '#balloons_flying');
	});

	function loopBalloon(id) {
		if (!balloonsFlying) return;
		var randleft = Math.random() * ($(window).width() - 80);
		var randtop = 80 + Math.random() * ($(window).height() * 0.45);
		$(id).animate({ left: randleft, top: randtop }, 9000, function () {
			loopBalloon(id);
		});
	}

	$('#balloons_flying').click(function () {
		balloonsFlying = true;
		$('.balloon-border').animate({ top: -500 }, 8000);
		$('#b1,#b4,#b5,#b7').addClass('balloons-rotate-behaviour-one');
		$('#b2,#b3,#b6').addClass('balloons-rotate-behaviour-two');
		// Start balloons in view, not under the button
		$('.balloons').css({ opacity: 0.95, bottom: 'auto', top: '55%' });
		$('.balloons h4').css({ display: 'block', opacity: 1 });
		loopBalloon('#b1');
		loopBalloon('#b2');
		loopBalloon('#b3');
		loopBalloon('#b4');
		loopBalloon('#b5');
		loopBalloon('#b6');
		loopBalloon('#b7');
		showNext(this, '#cake_fadein');
	});

	$('#cake_fadein').click(function () {
		$('.cake').fadeIn('slow');
		// Scroll cake into comfortable view above the button
		$('html, body').animate({ scrollTop: $('.cake-cover').offset().top - 40 }, 600);
		showNext(this, '#light_candle');
	});

	$('#light_candle').click(function () {
		$('.fuego').fadeIn('slow');
		$(this).fadeOut('slow').promise().done(function () {
			$('#wish_message').fadeIn('slow');
		});
	});

	$('#wish_message').click(function () {
		killBalloonLoops();

		$('#b1').attr('id', 'b11');
		$('#b2').attr('id', 'b22');
		$('#b3').attr('id', 'b33');
		$('#b4').attr('id', 'b44');
		$('#b5').attr('id', 'b55');
		$('#b6').attr('id', 'b66');
		$('#b7').attr('id', 'b77');

		lineUpBalloons();
		showNext(this, '#story');
	});

	$('#story').click(function () {
		$(this).fadeOut('slow');

		// Stop & remove balloons completely before letter
		killBalloonLoops();
		$('.balloons').stop(true).fadeOut(400, function () {
			$(this).remove();
		});
		$('.balloon-border').hide();
		$('.control-bar').fadeOut(300);

		$('body').addClass('letter-open');
		$('#letterOverlay').addClass('is-open').attr('aria-hidden', 'false');
	});
});
