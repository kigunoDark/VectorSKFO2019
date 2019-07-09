$(function () {
    var socket = io();  
        $('.adminInt').submit(function(e){
    var reqTeamMateId=  $('#reqTeamMateId').val();
    var reqTeamId =  $('#reqTeamId').val();
    var reqTeamMateEmail = $('#reqTeamMateEmail').val();

     var newRequest = {
       reqTeamMateId: reqTeamMateId,
       reqTeamId: reqTeamId,
       reqTeamMateEmail: reqTeamMateEmail
     };
    socket.emit('addRequest', newRequest);
    $('#reqTeamMateId').val('');
    $('#reqTeamId').val('');
    $('#reqTeamMateEmail').var('');
    $('.requesty').click(function(e)
    {
      location.reload();
    });
    e.preventDefault(); 
  return false;
});
socket.on('addRequest', function(ms){
    //  $('.fa-envelope ').append(ms);
    //  $('.fa-envelope').addClass('acceptedMs'); 
    location.reload(); 
    
});
});