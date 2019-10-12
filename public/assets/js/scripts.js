(function($) {
    "use strict";

    /* 
    ------------------------------------------------
    Sidebar open close animated humberger icon
    ------------------------------------------------*/

    $(".hamburger").on('click', function() {
        $(this).toggleClass("is-active");
    });


    /*  
    -------------------
    List item active
    -------------------*/
    $('.header li, .sidebar li').on('click', function() {
        $(".header li.active, .sidebar li.active").removeClass("active");
        $(this).addClass('active');
    });

    $(".header li").on("click", function(event) {
        event.stopPropagation();
    });

    $(document).on("click", function() {
        $(".header li").removeClass("active");

    });



    /*  
    -----------------
    Chat Sidebar
    ---------------------*/


    var open = false;

    var openSidebar = function() {
        $('.chat-sidebar').addClass('is-active');
        $('.chat-sidebar-icon').addClass('is-active');
        open = true;
    }
    var closeSidebar = function() {
        $('.chat-sidebar').removeClass('is-active');
        $('.chat-sidebar-icon').removeClass('is-active');
        open = false;
    }

    $('.chat-sidebar-icon').on('click', function(event) {
        event.stopPropagation();
        var toggle = open ? closeSidebar : openSidebar;
        toggle();
    });


    $(".tdl-content a").on("click", function() {
        var _li = $(this).parent().parent("li");
        _li.addClass("remove").stop().delay(100).slideUp("fast", function() {
            _li.remove();
        });
        return false;
    });

    // for dynamically created a tags
    $(".tdl-content").on('click', "a", function() {
        var _li = $(this).parent().parent("li");
        _li.addClass("remove").stop().delay(100).slideUp("fast", function() {
            _li.remove();
        });
        return false;
    });



    /*  Chat Sidebar User custom Search
    ---------------------------------------*/

    $('[data-search]').on('keyup', function() {
        var searchVal = $(this).val();
        var filterItems = $('[data-filter-item]');

        if (searchVal != '') {
            filterItems.addClass('hidden');
            $('[data-filter-item][data-filter-name*="' + searchVal.toLowerCase() + '"]').removeClass('hidden');
        } else {
            filterItems.removeClass('hidden');
        }
    });


    /*  Chackbox all
    ---------------------------------------*/

    $("#checkAll").change(function() {
        $("input:checkbox").prop('checked', $(this).prop("checked"));
    });


    /*  Vertical Carousel
    ---------------------------*/

    $('#verticalCarousel').carousel({
        interval: 2000
    })

    $(window).bind("resize", function() {
        if ($(this).width() < 680) {
            $('.logo').addClass('hidden')
            $('.sidebar').removeClass('sidebar-shrink')
            $('.sidebar').removeClass('sidebar-shrink, sidebar-gestures')
        }
    }).trigger('resize');

    /*   Current Energy Flot
    -----------------------------------------*/
    var energy_data = [],
        totalPoints = 300;

    function addData(_new_data) {
        // Do a random walk
        while (energy_data.length < totalPoints) {
            energy_data.push(0.0);
        }

        if (energy_data.length > 0){
            energy_data = energy_data.slice(1);
        }  
        energy_data.push(_new_data);
        // Zip the generated y values with the x values
        var res = [];
        for (var i = 0; i < energy_data.length; ++i) {
            res.push([i, energy_data[i]])
        }

        return res;
    }

    // Set up the control widget
    var plot = $.plot("#energy-load", [addData(0.0)], {
        series: {
            shadowSize: 0 // Drawing is faster without shadows
        },
        yaxis: {
            min: 0,
            max: 500.0
        },
        xaxis: {
            show: false
        },
        colors: ["#96c139"],
        lines: {
            fill: true, //Converts the line chart to area chart
            color: "#3c8dbc"
        },
        grid: {
            color: "transparent",
            hoverable: true,
            borderColor: "#f3f3f3",
            borderWidth: 1,
            tickColor: "#f3f3f3"
        },
        
        tooltip: true,
        tooltipOpts: {
            content: "%y Watt",
            defaultTheme: false
        }
    });

    function update(_data) {

        plot.setData([addData(_data)]);

        // Since the axes don't change, we don't need to call plot.setupGrid()
        plot.draw();
    }


    /* SocketIO 
    ----------------------------------------*/
    var OMACMode = {
		0: "Undefined",
		1: "Production",
		2: "Cloud",
		3: "Manual",
		16: "UserMode01",
		17: "UserMode02",
		18: "UserMode03",
		19: "UserMode04"		
	}
	
	var OMACState = {    
		0:"Undefined",
		1:"Clearing",
		2:"Stopped",
		3:"Starting",
		4:"Idle",
		5:"Suspended",
		6:"Execute",
		7:"Stopping",
		8:"Aborting",
		9:"Aborted",
		10:"Holding",
		11:"Held",
		12:"Unholding",
		13:"Suspending",
		14:"Unsuspending",
		15:"Resetting",
		16:"Completing",
		17:"Complete"
	}
    var socket = io('/');
    socket.on('connect', function(){});
    var executed_orders_count = 6584;
    socket.on('new_image_processed', function(data){
        executed_orders_count = executed_orders_count + 1;
        $('#executed_order_count').text(executed_orders_count);
        if(data.object && data.url){
            var _target = $("#" + data.object);
            if(_target){
                _target.attr('src',data.url);
            }        
        }
        
    });

    var energy_count = 12470.0;
    socket.on('AMQPMachineData', function(data) {
        var msg = JSON.parse(data);
		//console.log(data);
        // // Axis #
        var _cur_energy_value = msg.value.data["Portal_Wirkleistung_L1"] + msg.value.data["Portal_Wirkleistung_L2"] + msg.value.data["Portal_Wirkleistung_L3"];
        update(_cur_energy_value);
        energy_count = energy_count + (_cur_energy_value/10000.0);
        $('#energy_count').text(energy_count.toFixed(1));
        
		// updateNewValueInGraph(msg,"encoder_values_x");
		// updateNewValueInGraph(msg,"encoder_values_y");
		// updateNewValueInGraph(msg,"encoder_values_z");
		
		// updateNewValueInGraph(msg,"speed_x");
		// updateNewValueInGraph(msg,"speed_y");
		// updateNewValueInGraph(msg,"speed_z");
		
		// updateNewValueInGraph(msg,"acceleration_x");		
		// updateNewValueInGraph(msg,"acceleration_y");
		// updateNewValueInGraph(msg,"acceleration_z");
		
		// // OMAC
		$('#UnitModeCurrent_temp').text('' + OMACMode[msg.value.data['OmacUnitModeCurrent#']]);
		$('#StateCurrent_temp').text('' + OMACState[msg.value.data['OmacStateCurrent#']]);
    });

    // socket.on('order_list', function(_list) {  
    //     // // Destroy the old table
    //     // if(last_table)
    //     //     last_table.clear();

    //     // var _target = $('#order_list tbody');
    //     // _target.empty();        
    //     // _list.forEach(function(element) {
    //     //     _target.append(" \
    //     //     <tr> \
    //     //         <th>" + element._id + "</th> \
    //     //         <th>" + element.OrderOwner + "</th> \
    //     //         <th>" + element.gifts.length + "</th> \
    //     //         <th>" + element.lastStatusUpdate +"</th> \
    //     //         <th>" + element.currentOrderStatus.status+"</th> \
    //     //     </tr> \
    //     //     ");
    //     // });
        
        
    // });

    var last_table = $('#order_list').DataTable({
        lengthMenu: [[5, 10, 20, 50, -1], [5, 10, 20, 50, "All"]],
        ajax: {
            'url' : "http://cloud.faps.uni-erlangen.de:3000/orders",
            "dataSrc": ""
        },
        "pageLength": 5,
        columns: [
           {"data": "_id"},
           {"data": "OrderOwner"},
           {"data": "gifts.length"},
           {"data": "currentOrderStatus.updated"},
           {"data": "currentOrderStatus.status"}
        ]
    });
    setInterval( function () {
        last_table.ajax.reload( null, false ); // user paging is not reset on reload
    }, 10000 );

    var order_count = 9358;
    socket.on("new_order", function (_data) {
        order_count = order_count + 1;
        $('#order_count').text(order_count);
        $('#new_order_id').text(_data.order.order_id);
        $('#new_order_id_count').text(_data.order.list.length);
    });
    socket.on('disconnect', function(){});

    /*    Datatable
    ------------------------------------------------------*/
    

})(jQuery);