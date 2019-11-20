$(document).ready(function () {
    console.log("document is ready");
    $('[data-toggle="offcanvas"], #navToggle').on('click', function () {
        $('.offcanvas-collapse').toggleClass('open')
    })
});
window.onload = function () {
    console.log("window is loaded");
};

function page01() {
    $("#page02").hide();
    $("#page01").show();
}

function page02() {
    $("#page01").hide();
    $("#page02").show();
}