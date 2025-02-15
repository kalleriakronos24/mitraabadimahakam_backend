$(function(){
    console.log('script/opt-equipment');

    $('select').select2()

    $('body select.xselect2equipment').each(function(){
        var values = $(this).data('check')
        var elm = $(this)
        elm.children().remove()
        $.ajax({
            async: true,
            url: '/ajax/equipment?selected='+values,
            method: 'GET',
            success: function(result){
                if(result.length > 0){
                    setSelected(result, values)
                    elm.html(result.map( v => '<option value="'+v.id+'" '+v.selected+'>' +v.kode+ ' | '+v.unit_model+'</option>'))
                    initSelected(result, elm)
                    elm.trigger('change');
                }else{
                    elm.html('<option value="" selected>Blum ada data...</option>')
                }
            },
            error: function(err){
                console.log(err);
            },
            complete: function() {
                elm.attr('data-placeholder', 'Pilih PIT Area')
            }
        })
    })

    $('select[name="equipment_id"]').each(function(){
        var values = $(this).data('check') || $(this).val()
        var elm = $(this)
        elm.children().remove()
        $.ajax({
            async: true,
            url: '/ajax/equipment?selected='+values,
            method: 'GET',
            success: function(result){
                if(result.length > 0){
                    setSelected(result, values)
                    elm.html(result.map( v => '<option value="'+v.id+'" '+v.selected+'>' +v.kode+ ' | '+v.unit_model+'</option>'))
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