$(function(){
    initDeafult()

    $('body').on('click', 'button#bt-back', function(){
        initDeafult()
    })

    $('body').on('click', 'button#create-form', function(){
        initCreate()
    })

    $('body').on('click', 'button#bt-cancel-update', function(e){
        e.preventDefault()
        initDeafult()
    })

    $('body').on('keyup', 'input#inpKeywordEvent', function(e){
        var value = $(this).val()
        if(e.keyCode === 13){
            ajaxSearch(value)
        }
    })

    $('body').on('click', 'button#bt-search-keyword', function(){
        var value = $('input#inpKeywordEvent').val()
        ajaxSearch(value)
    })

    $('body').on('click', 'button.bt-edit-data', function(e){
        var id = $(this).data('id')
        $.ajax({
            async: true,
            url: '/master/event/'+id+'/show',
            method: 'GET',
            success: function(result){
                initShow()
                $('div#form-show').html(result)
            },
            error: function(err){
                console.log(err);
            }
        })
    })

    $('body').on('submit', 'form#fm-event', function(e){
        e.preventDefault()
        var data = new FormData(this)
        $.ajax({
            async: true,
            url: '/master/event',
            method: 'POST',
            data: data,
            dataType: 'json',
            processData: false,
            mimeType: "multipart/form-data",
            contentType: false,
            success: function(result){
                console.log(result)
                const { message } = result
                if(result.success){
                    swal("Okey,,,!", message, "success")
                    initDeafult()
                }else{
                    swal("Opps,,,!", message, "warning")
                }
            },
            error: function(err){
                console.log(err)
                const { message } = err.responseJSON
                swal("Opps,,,!", message, "warning")
            }
        })
    })

    $('body').on('submit', 'form#fm-event-upd', function(e){
        e.preventDefault()
        var id = $(this).data('id')
        var data = new FormData(this)
        $.ajax({
            async: true,
            url: '/master/event/'+id+'/update',
            method: 'POST',
            data: data,
            dataType: 'json',
            processData: false,
            mimeType: "multipart/form-data",
            contentType: false,
            success: function(result){
                console.log(result)
                const { message } = result
                if(result.success){
                    swal("Okey,,,!", message, "success")
                    initDeafult()
                }else{
                    swal("Opps,,,!", message, "warning")
                }
            },
            error: function(err){
                console.log(err)
                const { message } = err.responseJSON
                swal("Opps,,,!", message, "warning")
            }
        })
    })

    $('body').on('click', 'button#bt-delete-data', function(e){
        e.preventDefault()
        var id = $(this).data('id')
        $.ajax({
            async: true,
            headers: {'x-csrf-token': $('[name=_csrf]').val()},
            url: '/master/event/'+id+'/delete',
            method: 'POST',
            dataType: 'json',
            processData: false,
            mimeType: "multipart/form-data",
            contentType: false,
            success: function(result){
                console.log(result)
                const { message } = result
                if(result.success){
                    swal("Okey,,,!", message, "success")
                    initDeafult()
                }else{
                    swal("Opps,,,!", message, "warning")
                }
            },
            error: function(err){
                console.log(err)
                const { message } = err.responseJSON
                swal("Opps,,,!", message, "warning")
            }
        })
    })

    $('body').on('click', 'a.btn-pagging', function(e){
        e.preventDefault()
        var page = $(this).data('page')
        var keyword = $('input#inpKeywordEvent').val()
        var url = window.location.pathname+'/list?page='+page+'&keyword='+keyword
        $.ajax({
            async: true,
            url: url,
            method: 'GET',
            success: function(result){
                $('div#list-content').children().remove()
                $('div#list-content').html(result).show()
            },
            error: function(err){
                console.log(err);
            }
        })
    })

    function initDeafult(){
        $('div.content-module').css('display', 'none')
        $.ajax({
            async: true,
            url: '/master/event/list?keyword=',
            method: 'GET',
            success: function(result){
                $('content-module').css('display', 'none')
                $('div#list-content').children().remove()
                $('div#list-content').html(result).show()
            },
            error: function(err){
                console.log(err);
            }
        })
    }

    function initCreate(){
        $('div.content-module').css('display', 'none')
        $.ajax({
            async: true,
            url: '/master/event/create',
            method: 'GET',
            success: function(result){
                $('div#form-create').children().remove()
                $('div#form-create').html(result).show()
            },
            error: function(err){
                console.log(err);
            }
        })
    }

    function initShow(){
        $('div.content-module').css('display', 'none')
        $('div#form-show').show()
    }

    function ajaxSearch(value){
        var url = window.location.pathname+'/list?keyword='+value
        $.ajax({
            async: true,
            url: url,
            method: 'GET',
            success: function(result){
                $('div#list-content').children().remove()
                $('div#list-content').html(result).show()
            },
            error: function(err){
                console.log(err);
            }
        })
    }
})