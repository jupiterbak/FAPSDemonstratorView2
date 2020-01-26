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
	};
	
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
	};
    var socket = io('/');
    socket.on('connect', function(){});
    var executed_orders_count = 6584;
    var order_progess = 40;
    socket.on('new_image_processed', function(data){
        executed_orders_count = executed_orders_count + 1;
        order_progess = order_progess + 10;  
        if(order_progess > 100){
            order_progess = 100;
        }      
        $('#executed_order_count').text(executed_orders_count);
        $('#order_progess').attr("aria-valuenow",order_progess).css('width', order_progess + "%");
        $('#order_progess').text(order_progess + "% progress");
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

    /*    Sand Key Diagram
    ------------------------------------------------------*/
    var last_sandkey_data = null;
    socket.on('GlobalData', function(data) {
        last_sandkey_data = data;
    });
    function loadSandKey() {  
        var robot_data =  last_sandkey_data? JSON.parse(last_sandkey_data.robot).value:{};
          
        var _Axis_X = Math.abs(robot_data.data? robot_data.data.Portal_Wirkleistung_L1/1000.0 : 5);
        var _Axis_Y = Math.abs(robot_data.data? robot_data.data.Portal_Wirkleistung_L2/1000.0 : 5);
        var _Axis_Z = Math.abs(robot_data.data? robot_data.data.Portal_Wirkleistung_L3/1000.0 : 5);
        var _Motor_Band_1 = Math.abs(last_sandkey_data?last_sandkey_data.conveyor.value.DB33.Motor_Band_1_Power : 0);
        var _Motor_Band_2 = Math.abs(last_sandkey_data?last_sandkey_data.conveyor.value.DB33.Motor_Band_2_Power : 0);
        var _Motor_Band_3 = Math.abs(last_sandkey_data?last_sandkey_data.conveyor.value.DB33.Motor_Band_3_Power : 0);
        var _Motor_Umsetzer_11 = Math.abs(last_sandkey_data?last_sandkey_data.conveyor.value.DB33.Motor_Umsetzer_11_Power : 0);
        var _Motor_Umsetzer_12 = Math.abs(last_sandkey_data?last_sandkey_data.conveyor.value.DB33.Motor_Umsetzer_12_Power : 0);
        var _Motor_Umsetzer_21 = Math.abs(last_sandkey_data?last_sandkey_data.conveyor.value.DB33.Motor_Umsetzer_21_Power : 0);
        var _Motor_Umsetzer_22 = Math.abs(last_sandkey_data?last_sandkey_data.conveyor.value.DB33.Motor_Umsetzer_22_Power : 0);
        var _Robot_Components = 0.005;
        var _Conveyor_Component = 0.005;        
        return {
                "nodes":[
                    {"name":"Grid","id":"Grid"},
                    {"name":"Conveyor","id":"Conveyor"},
                    {"name":"Robot","id":"Robot"},
                    {"name":"Axis_X", "id":"Axis_X"},
                    {"name":"Axis_Y", "id":"Axis_Y"},
                    {"name":"Axis_Z", "id":"Axis_Z"},
                    {"name":"Robot_Components", "id":"Robot_Components"},
                    {"name":"Band_1", "id":"Band_1"},
                    {"name":"Band_2", "id":"Band_2"},
                    {"name":"Band_3", "id":"Band_3"},
                    {"name":"Motor_Band_1", "id":"Motor_Band_1"},
                    {"name":"Motor_Band_2", "id":"Motor_Band_2"},
                    {"name":"Motor_Band_3", "id":"Motor_Band_3"},
                    {"name":"Motor_Umsetzer_11", "id":"Motor_Umsetzer_11"},
                    {"name":"Motor_Umsetzer_12", "id":"Motor_Umsetzer_12"},
                    {"name":"Motor_Umsetzer_21", "id":"Motor_Umsetzer_21"},
                    {"name":"Motor_Umsetzer_22", "id":"Motor_Umsetzer_22"},
                    {"name":"Conveyor_Component", "id":"Conveyor_Component"},
                ],
                "links":[
                    // Band_1
                    {"source":7,"target":10,"value":_Motor_Band_1},
                    {"source":7,"target":13,"value":_Motor_Umsetzer_11},
                    {"source":7,"target":14,"value":_Motor_Umsetzer_12},
                    // Band_2
                    {"source":8,"target":11,"value":_Motor_Band_2},
                    {"source":8,"target":15,"value":_Motor_Umsetzer_21},
                    {"source":8,"target":16,"value":_Motor_Umsetzer_22},
                    // Band_3
                    {"source":9,"target":12,"value":_Motor_Band_3},
                    
                    // Conveyor
                    {"source":1,"target":7,"value":_Motor_Band_1 + _Motor_Umsetzer_11 + _Motor_Umsetzer_12},
                    {"source":1,"target":8,"value":_Motor_Band_2 + _Motor_Umsetzer_21 + _Motor_Umsetzer_22},
                    {"source":1,"target":9,"value":_Motor_Band_3 },
                    {"source":1,"target":17,"value":_Conveyor_Component },

                    // Robot Components
                    {"source":2,"target":6,"value":_Robot_Components},
                    {"source":2,"target":3,"value":_Axis_X},
                    {"source":2,"target":4,"value":_Axis_Y},
                    {"source":2,"target":5,"value":_Axis_Z},

                    // Grid
                    {"source":0,"target":2,"value":_Robot_Components + _Axis_Z + _Axis_Y + _Axis_X},
                    {"source":0,"target":1,"value":_Motor_Band_1 + _Motor_Umsetzer_11 + _Motor_Umsetzer_12 + _Motor_Band_2 + _Motor_Umsetzer_21 + _Motor_Umsetzer_22 + _Motor_Band_3 + _Conveyor_Component},

                   ]
                }; 
             
      }
    // Generate SandKey Diagram
    let configSankey = {
        margin: { top: 0, left: 0, right: 0, bottom: 5 },
        nodes: {
            dynamicSizeFontNode: {
                enabled: true,
                minSize: 10,
                maxSize: 16
            },
            draggableX: false,
            draggableY: true,
            //colors: d3.scaleOrdinal(d3.schemeCategory10),
            //colors: d3.scaleOrdinal(['#41aaaa', '#49a5a5', '#519f9f', '#589a9a', '#609595', '#688f8f', '#708a8a', '#788585'])
            //colors: d3.scaleOrdinal(['#41aaaa', '#59b5b5','#71bfbf','#88caca','#a0d4d4','#b8dfdf','#d0eaea','#e7f4f4'])
            //colors: d3.scaleOrdinal(['#41aaaa', '#4176aa', '#4141aa', '#7641aa', '#aa41aa', '#aa4176'])
            //colors: d3.scaleOrdinal(['#15534C', '#206555', '#30785B', '#448B5F', '#5D9D61', '#79AF61', '#99C160', '#BCD160', '#E2E062'])
            colors: d3.scaleOrdinal(['#5d7723', '#96c139', '#f39c12' ])
        },
        links: {
            title: "Mytitle",
            formatValue: function(val) {
                return d3.format(",.2f")(val) + ' W';
            }
        },
        tooltip: {
            infoDiv: true,
            labelSource: 'Input:',
            labelTarget: 'Output:'
        }
    };

    let SandkeyObject = loadSandKey();
    let objSankey = sk.createSankey('#sandKey_graph', configSankey, SandkeyObject);
    let SandkeyInterval = setInterval(function() {
        SandkeyObject = loadSandKey();
        objSankey.updateData(SandkeyObject);
    }, 1000);



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
    var order_count = 9358;
    socket.on("new_order", function (_data) {
        order_count = order_count + 1;
        order_progess = 40;
        $('#order_progess').attr("aria-valuenow",order_progess).css('width', order_progess + "%");
        $('#order_progess').text(order_progess + "% progress");
        $('#order_count').text(order_count);
        $('#new_order_id').text(_data.order.order_id);
        $('#new_order_id_count').text(_data.order.list.length);
    });
    socket.on('disconnect', function(){});

    /*    Datatable
    ------------------------------------------------------*/
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

})(jQuery);