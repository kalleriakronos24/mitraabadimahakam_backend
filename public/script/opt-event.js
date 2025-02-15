$(function(){
    console.log('script/opt-equipment');

    $('select').select2()

    $('body select.xselect2event').each(function(){
        var values = $(this).data('check')
        var elm = $(this)
        elm.children().remove()
        $.ajax({
            async: true,
            url: '/ajax/event?selected='+values,
            method: 'GET',
            success: function(result){
                if(result.length > 0){
                    setSelected(result, values)
                    elm.html(result.map( v => '<option value="'+v.id+'" '+v.selected+'>'+v.engine+' | '+v.narasi+'</option>'))
                    initSelected(result, elm)
                    elm.trigger('change');
                }else{
                    elm.html('<option value="" selected>Blum ada data...</option>')
                }
            },
            error: function(err){
                console.log(err);
            }
        })
    })

    $('body select.xselect2pit').each(function(){
        var values = $(this).data('check') || $(this).val()
        var elm = $(this)
        elm.children().remove()
        $.ajax({
            async: true,
            url: '/ajax/pit?selected='+values,
            method: 'GET',
            success: function(result){
                console.log('result pit >> ', result)
                if(result.length > 0){
                    setSelected(result, values)
                    elm.html(result.map( nod => '<option value="'+nod.id+'" '+nod.selected+'>'+nod.name+'</option>'))
                    initSelected(result, elm)
                    elm.trigger('change');
                }else{
                    elm.html('<option value="" selected>Blum ada data...</option>')
                }
            },
            error: function(err){
                console.log(err);
            }
        })
    })

    $('body select.xselect2shift').each(function(){
        var values = $(this).data('check') || $(this).val()
        var elm = $(this)
        elm.children().remove()
        $.ajax({
            async: true,
            url: '/ajax/shift?selected='+values,
            method: 'GET',
            success: function(result){
                console.log('result shift >> ', result);
                if(result.length > 0){
                    setSelected(result, values)
                    elm.html(result.map( nod => '<option value="'+nod.id+'" '+nod.selected+'>'+nod.name+'</option>'))
                    initSelected(result, elm)
                    elm.trigger('change');
                }else{
                    elm.html('<option value="" selected>Blum ada data...</option>')
                }
            },
            error: function(err){
                console.log(err);
            }
        })
    })

    function setSelected(list, value){
        let data = list.map(elm => elm.id === value ? {...elm, selected: 'selected'} : {...elm, selected: ''})
        return data
    }
    
    function initSelected(data, elm){
        var lenSelected = data.filter( a => a.selected === 'selected')
        if(!lenSelected.length > 0){
            elm.prepend('<option value="" selected>Pilih</option>')
        }
    }
})