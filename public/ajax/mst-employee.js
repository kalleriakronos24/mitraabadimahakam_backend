'use strict'
$(function(){
    // swal("Here's a message!")

    $('.dropify').dropify();

    initDeafult()

    $('body').on('click', '#create-form', function(){
        initCreate()
    })
    $('body').on('click', 'button#bt-back', function(){
        initDeafult()
    })

    $('body').on('change', 'select[name="sts_employee"]', function(e){
        if($(this).val() === 'pkwt'){
            $('div#isKontrak').show()
            $('input[name="awal_kontrak"]').prop('required', true)
            $('input[name="akhir_kontrak"]').prop('required', true)
        }else{
            $('div#isKontrak').hide()
            $('input[name="awal_kontrak"]').prop('required', false)
            $('input[name="akhir_kontrak"]').prop('required', false)
            $('input[name="awal_kontrak"]').val('')
            $('input[name="akhir_kontrak"]').val('')
        }
    })

    function initDeafult(){
        $('div.content-module').each(function(){ $(this).hide() })
        $.get('/master/employee/list?keyword=', function(data){
            $('div#list-content').children().remove()
            $('div#list-content').html(data)
        })
        $('div#list-content').show()
    }
    function initCreate(){
        $('div.content-module').each(function(){ $(this).hide() })
        $('div#form-create').show()
    }

    function initShow(){
        $('div.content-module').each(function(){ $(this).hide() })
        $('div#form-show').show()
    }

    $('button.bt-show-form').on('click', function(e){
        e.preventDefault()
        var id = $(this).data('id')
        $.get('/setting/sys-options/'+id+'/show', function(data){
            $("div#form-show").html(data)
            initShow()
        })
    })

    $('body').on('click', 'button.bt-cancel', function(e){
        e.preventDefault()
        initDeafult()
    })

    $('#bt-save-employee').on('click', function(e){
        e.preventDefault()
        const names = []
        const values = []
        $('.field-add').each(function(){
            names.push($(this).attr("name"))
            values.push($(this).val())
        })
        $.ajax({
            headers: {'x-csrf-token': $('[name=_csrf]').val()},
            method: 'POST',
            url: "/master/employee",
            data: _.object(names, values),
            dataType: 'json',
            success: function(res){
                console.log(res)
                if(res.success){
                    swal("Okey!", res.message, "success")
                    window.location.reload()
                }else{
                    swal("Oops", "Insert data failed", "error")
                }
            },
            error: function(err){
                console.log(err.responseJSON)
                swal("Oops", err.responseJSON.message, "error")
            }
        })
    })

    $('body').on('click', 'a.btn-pagging', function(e){
        e.preventDefault()
        var page = $(this).data('page')
        var keyword = $('#inpKeyword').val()
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
    
})