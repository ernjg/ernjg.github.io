$(document).ready(function() {
    $('.card').on('click', function() {
        $('.overlay').removeClass('hidden');
        $('.popup').removeClass('hidden');
    });

    $('.close-btn').on('click', function() {
        $('.overlay').addClass('hidden');
        $('.popup').addClass('hidden');
    });
});
