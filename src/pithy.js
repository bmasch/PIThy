L.Control.Legend = L.Control.extend({
	options: {
        position: 'topleft',
        collapsed: false,
		id: "legend_id",
		width: '200px',
		type: "line"
    },
    onAdd: function(map) {
        var div = L.DomUtil.create('div');
		div.id = this.options.id
        div.style.width = this.options.width
		div.style.border = '2px; solid; rgba(0,0,0,0.2)';
        return div;
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.legend = function(opts) {
    return new L.Control.Legend(opts);
}

class CompPanel{
	constructor(options){
		if (!options.target) {
			console.log(options)
			return null;
		}
		this.target = options.target;
		this.panels = []
		this.index = 0;
	}
}



class FishTracks{
	constructor(options){
		this.basins_sites = options.basins_sites;
		this.sites_basins = {};//look up table for basin id (integer) using site code
		this.basins_index = {};//look up table for basin id (integer) using basin name
		this.sites_index = {};//integer representing order within basin
		this._basins = {};
		this.basins = [];
		this.adultladders = ["BO1","BO2","BO3","BO4","TD1","TD2","JO1","JO2","MC1","MC2","ICH","LMA","GOA","GRA","PRA","RIA","RRF","WEA"]
		
		this.reset_basins();
		d3.selection.prototype.moveToFront = function() { 
			return this.each(function() { 
			  this.parentNode.appendChild(this); 
			}); 
		  };
	}

	reset_basins(){
		var _this = this;
		var _basin = 0;
		this.basins_sites.forEach(function (d) {
			var name = d.name;
			d.open=false;
			d.active=false;
			d.active_sites = [];//keeps track of whether site has any detections
			for(var i=0;i<d.sites.length;i++){
				_this.sites_basins[d.sites[i]]=_basin;
				_this.sites_index[d.sites[i]]=i;
				d.active_sites.push(false);
			}
			_this.basins_index[name]=_basin;
			_basin++;
		});	
	}

	getBasinSite(site){
	//if basin branch is open, return site
			var basin = this.basins_sites[this.sites_basins[site]];
			if(basin.open)return site;
			else return basin.name;	
	}


	getDomain(){
		//get array of basins + sites for the open one
		var _this = this;
		var names = [];
		this.basins_sites.forEach(function (d) {
			if(d.active){
				if(d.open){
					names.push(d.name)
					for(var i=0;i<d.sites.length;i++){
						if(d.active_sites[i])names.push(d.sites[i]);//only add if there are detections
					}
				}
				else names.push(d.name);
			}
		});
		return names;
	}
	
	doTracks(opts){

		//internal functions********************************

		var flowInRange = function(d) { 
			if(!currentRange || d.date1 < currentRange[0] || d.date2 > currentRange[1] ) {
				//console.log("hidden");
				return "hidden";
			} else {
				//console.log("visible");
				return "visible";
			}
		}

		var damFlowInRange = function(d) { 
			if(!currentRange || d.date < currentRange[0] || d.date > currentRange[1] ) {
				//console.log("hidden");
				return "hidden";
			} else {
				//console.log("visible");
				return "visible";
			}
		}

		function checkInRange(d){return d.date >= currentRange[0] && d.date <= currentRange[1]
		}

		function bar_width(){
			return(x(tdate2)-x(tdate1))
		}	
			
		function addClass(d){
			var tag_code = d.getFish().tag_code;
			var c1 = "TAG" + tag_code.split(".")[1];
			var c2;
			if(_this.getBasinSite(d.site)==d.site)c2 = "SITE" + d.site;
			else c2 = "SITE" + _this.getBasinSite(d.site).replace(/ /g,"-");
			return c1 + " " + c2;
		}

		function trimDetections(detections){
			var trimmed = [];
			for(var i=0;i<detections.length;i++){
				if(!currentRange)trimmed.push({x:x(detections[i].date), y: y(_this.getBasinSite(detections[i].site))});
				else if (checkInRange(detections[i]))trimmed.push({x:x(detections[i].date), y: y(_this.getBasinSite(detections[i].site))});
				else if(detections[i+1] && checkInRange(detections[i+1])){
					var range0 = x(currentRange[0]);
					var range1 = x(currentRange[1]);
					var x0 = x(detections[i].date);
					var x1 = x(detections[i+1].date);
					var y0 = y(_this.getBasinSite(detections[i].site))
					var y1 = y(_this.getBasinSite(detections[i+1].site))
					var xmult = (range0-x0)/(x1-x0)
					var y2 = y0 + xmult*(y1-y0)
					trimmed.push({x: range0, y: y2});
				}
				else if(detections[i-1] && checkInRange(detections[i-1])){
					var range0 = x(currentRange[0]);
					var range1 = x(currentRange[1]);
					var x0 = x(detections[i-1].date);
					var x1 = x(detections[i].date);
					var y0 = y(_this.getBasinSite(detections[i-1].site))
					var y1 = y(_this.getBasinSite(detections[i].site))
					var xmult = (range1-x0)/(x1-x0)
					var y2 = y0 + xmult*(y1-y0)
					trimmed.push({x: range1, y: y2});		
				} 
			}
			return trimmed;
		}	

		//bar height and width for flows
		function bar_height(){
			return (y(this.getDomain()[1])-y(this.getDomain()[0]))*.9*options.flowscale;
		}

		function brushed() {
		  currentRange = (brush.empty()? undefined : brush.extent());
		  x.domain(brush.empty() ? x2.domain() : brush.extent());
		  focus.selectAll(".fish").select(".line").attr("d", function (d) {return line3(trimDetections(d.events));})
		//		.style("visibility", function (d) {return inRange(d.detections[0]);});
		  focus.selectAll("circle")
				.attr("cx", function (d) { return x(d.date); })
				.attr("cy", function (d) { return y(_this.getBasinSite(d.site)); })
				.style("visibility", inRange);
		  focus.select(".x.axis").call(xAxis);
		  
		  focus.selectAll(".flowline")
			.attr("x1", function(d){return x(d.date1)})
			.attr("y1", function(d){return y(_this.getBasinSite(d.site1)); })
			.attr("x2", function(d){return x(d.date2)})
			.attr("y2", function(d){return y(_this.getBasinSite(d.site2)); }) 
			.style("visibility", flowInRange);
			
			focus.selectAll(".flowbar")
			.attr("x",function(d){return x(d.date);})
			.attr("y",function(d){return y(_this.getBasinSite(d.site));})
			.attr("height",function(d){return d.outflow/damflowmax*bar_height();})
			.attr("width",bar_width())
			.style("visibility", damFlowInRange);
			
			focus.selectAll(".spillbar")
			.attr("x",function(d){return x(d.date);})
			.attr("y",function(d){return y(this.getBasinSite(d.site));})
			.attr("height",function(d){return d.spill>0 ? d.spill/damflowmax*bar_height(): 0;})
			.attr("width",bar_width())
			.style("visibility", damFlowInRange);

			trimMonths();
		}

		function trimMonths(){
			var months = {"January": "Jan","February": "Feb","March": "Mar","April":"Apr","June": "Jun","July":"Jul","August":"Aug", "September":"Sep","October": "Oct","November":"Nov", "December":"Dec"}
			focus.select(".x.axis").selectAll(".tick").select("text").each(function(){
				var text = d3.select(this).text();
				if(months[text])d3.select(this).text(months[text])
			})
		}
			
		function make_y_axis() {    // function for the y grid lines
		  return d3.svg.axis().scale(y).orient("left").ticks(5)
		}

		function setFlowLines(){
			flows
			.selectAll(".flowline")
			.data(flowdata)
			.enter()
			.append("line")
			.attr("class","flowline")
			.attr("x1", function(d){return x(d.date1)})
			.attr("y1", function(d){return y(this.getBasinSite(d.site1)); })
			.attr("x2", function(d){return x(this.d.date2)})
			.attr("y2", function(d){return y(this.getBasinSite(d.site2)); })
			.attr("stroke-width", 1)
			//.attr("stroke", "blue")
			.style("stroke-dasharray", ("8, 10"))
			.style('stroke', function(d) { 
					if(options.flowtemp)return getTempColor(d);
					else return "blue";
			})
			.style("visibility", flowInRange)
			.on("mouseover", function(d) {
					var site = {date: dateFormat1(d.date1),temp: d.temperature,flow: d.flow, spill: d.spill};
					tipdiv.transition()        
						.duration(20)      
						.style("opacity", 1);      
					tipdiv.html('<b>' + site.date + ' | Temp(C): ' + site.temp + '<br><b>Flow: ' + d.flow + '<br><b>Spill:</b> ' + d.spill)  
						.style("left", (d3.event.pageX + 20) + "px")     
						.style("top", (d3.event.pageY - 14) + "px");    
					})                  
				.on("mouseout", function(d) {       
					tipdiv.transition()        
						.duration(20)      
						.style("opacity", 0);   
				});
		}

		function sizeFish(detections){
			var fishsize = [];
			detections.forEach(function(d){
				var fsize = {};
				if(d.length)fsize.length=d.length;
				if(d.weight)fsize.weight=d.weight;
				if(fsize.length | fsize.weight)fishsize.push(fsize);
			});
		}

		function countFish(){
			var temp = focus.selectAll("circle").filter(function(d){ return d3.select(this).style('opacity') != 0 });
			var sitecount = {}
			temp[0].forEach(function (d) {
				var att = d.getAttribute("class");
				var i1 = att.indexOf("TAG");
				var i2 = att.indexOf("SITE");
				var site = att.substring(i2);
				site = site.substring(4);
				if(!sitecount[site])sitecount[site] = {};
				sitecount[site][att] = true;
			});
			var fishcount = [];

			Object.keys(sitecount).forEach(function(d){
				fishcount.push({site: d.replace(/-/g," "), count: Object.keys(sitecount[d]).length});
			});
			svg.append("g")
				.attr("id", "fishcounts")
				.attr("transform", "translate(" + (margin.left+width) + "," + margin.top + ")")
				.selectAll("g")
				.data(fishcount)
				.enter()
				.append("g")
				.attr("transform", function(d){
					return "translate(" + 5 + "," + (y(d.site)+5) + ")"
				})
				.append("text").text(function(d){
					//console.log(d.site + "," + d.count)
					return d.count;
				})
				;
		}

		function countBox(nfish,ndetect){
			var offset=0;
			if(nfish>0)offset = Math.log(nfish)*5 + 30;
			var _x = Math.max(countbox[0][0],countbox[1][0]) + 5;
			if(_x > width-75)_x= Math.min(countbox[0][0],countbox[1][0]) - offset;
			var _y = Math.min(countbox[0][1],countbox[1][1]);

			focus.append('rect')
					.attr('x', Math.min(countbox[0][0],countbox[1][0]))
					.attr('y', _y)
					.attr('width', Math.abs(countbox[1][0]-countbox[0][0]))
					.attr('height', Math.abs(countbox[1][1]-countbox[0][1]))
					.attr('id', 'countbox')
					.style('fill', "none")
					.style("stroke", "black");
			focus.append('text')
				.attr('x', _x)
				.attr('y', _y)
				.attr('id', 'counttext2')
				.attr("class", "shadow")
				.text(nfish + " fish");
			focus.append('text')
				.attr('x', _x)
				.attr('y', _y)
				.attr('id', 'counttext')
				.text(nfish + " fish");
		}

		function updateFishColor(opts){
			if(opts){
			Object.keys(opts).forEach(function(d){
				options[d] = opts[d];
			})
			}
			focus.selectAll(".fish").selectAll("circle").style('fill', options.fishcolor);
			focus.selectAll(".fish").selectAll(".line").style("stroke", options.trackcolor);
		}

		function updateFishOpacity(opts){
			if(opts){
			Object.keys(opts).forEach(function(d){
				options[d] = opts[d];
			})
			}
			focus.selectAll(".fish").selectAll("circle").style('opacity', options.fish_opacity);
		}

		function updateTrackOpacity(opts){
			if(opts){
			Object.keys(opts).forEach(function(d){
				options[d] = opts[d];
			})
			}
			focus.selectAll(".fish").selectAll(".line").style("opacity", options.track_opacity);
		}

		function updateFlowScale(opts){
			if(opts){
			Object.keys(opts).forEach(function(d){
				options[d] = opts[d];
			})
			}
			focus.selectAll(".flowbar").attr("height",function(d){return d.outflow/damflowmax*bar_height();})	
			focus.selectAll(".spillbar").attr("height",function(d){return d.spill>0 ? d.spill/damflowmax*bar_height(): 0;})
		}
		
		function getFlowLineData(){
			flowdata = []
			options.flowlines.forEach(function(d){
				d.data.forEach(function(dd){
					if(dd.date1>min_date & dd.date2<max_date)flowdata.push(dd)
				})
			})
		}

		function getDamFlowData(){
			damflowdata = [];
			damflowmax = 0;
			if(options.damflows.length>0){
				var date = new Date(min_date.getFullYear()+"/"+min_date.getMonth()+"/"+min_date.getDate());
				while(date<max_date){
					options.damflows.forEach(function(d){
					var value = params.damdata[d.dam][date]
						if(value && value.Outflow>0){
							damflowdata.push({
								dam: d.dam,
								site: d.site,
								date: new Date(date),
								outflow: value.Outflow,
								spill: value.Spill,
								dgas: value.Degas,
								temperature: value.Temp,
								Temp: value.Temp,
								TempTW: value.TempTW,
								dgasTW: value.dgasTW
							})
							if(value.Outflow>damflowmax)damflowmax = value.Outflow
						}	
					})
					date.setDate(date.getDate()+1)
				}
			}
		}	

		function setDamFlow(){
				var _this = this;
				damflow
				.selectAll(".flowbar")
				.data(damflowdata)
				.enter()
				.append("rect")
				.attr("class","flowbar")
				.attr("x",function(d){return x(d.date);})
				.attr("y",function(d){return y(this.getBasinSite(d.site));})
				.attr("height",function(d){return d.outflow/damflowmax*bar_height();})
				.attr("width",bar_width())
				.style("fill",function(d){
					return d[options.tempvariable]>0 ? options.tempscale(d[options.tempvariable]): "gray"
				})
				.style("fill-opacity",.6)
				.style("opacity",.7)
				.style("visibility", damFlowInRange);
				
				
				spillflow
				.selectAll(".spillbar")
				.data(damflowdata)
				.enter()
				.append("rect")
				.attr("class","spillbar")
				.attr("x",function(d){return x(d.date);})
				.attr("y",function(d){return y(_this.getBasinSite(d.site));})
				.attr("height",function(d){return d.spill>0 ? d.spill/damflowmax*bar_height(): 0;})
				.attr("width",bar_width())
				.style("fill",function(d){
					return d[options.tempvariable]>0 ? options.tempscale(d[options.tempvariable]): "gray"
				})
				.style("stroke",function(d){
					return d[options.tempvariable]>0 ? options.tempscale(d[options.tempvariable]): "gray"
				})
				.style("fill-opacity",.6)
				.style("opacity",.8)
				.style("visibility", damFlowInRange);
		}

		function updateDamFlow(opts){
			if(opts){
			Object.keys(opts).forEach(function(d){
				options[d] = opts[d];
			})
			}
			d3.selectAll(".flowbar").remove();
			d3.selectAll(".spillbar").remove();
			getDamFlowData();
			setDamFlow();
		}

		function updateFlowLines(opts){
			if(opts){
			Object.keys(opts).forEach(function(d){
				options[d] = opts[d];
			})
			}
			d3.selectAll(".flowline").remove();
			getFlowLineData();
			setFlowLines();	
		}
	//set color scheme TBD
		var getColor = function(d){
			var color = d3.scale.category10();
			if(params.edata.data){
				//var date = 
			}
			/*		
			if(params.color_coding == "rel_site")_colorcoding=relsites;
			else _colorcoding=["W","H","U"];
			color.domain(_colorcoding);
			//if(color_coding == "rel_site")return color(d.rel_site);
			if(params.color_coding == "none")return "#888888";
			else return color(d[color_coding]);
			*/
			return "#888888"
		}

		var getTempColor = function(d){
			var thermal = ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac","#053061"];
			if(d.temperature == 99)d.temperature = "NA";
			if(d.temperature == "NA")return "#cccccc";
			else if(d.temperature < 10)return thermal[10];
			else if(d.temperature < 15)return thermal[9];
			else if(d.temperature < 18)return thermal[8];
			else if(d.temperature < 20)return thermal[7];
			else if(d.temperature < 21)return thermal[6];
			//else if(d.temperature < 20)return thermal[5];
			//else if(d.temperature < 21)return thermal[4];
			else if(d.temperature < 22)return thermal[3];
			else if(d.temperature < 22.5)return thermal[2];
			else if(d.temperature < 23)return thermal[1];
			else return thermal[0];
		}
		
		function filterEvents(events){
			return events.filter(function(event){return event.type != "Mark"})
		}

		function getEdata(d){
			let dateFormat = d3.time.format("%Y-%m-%d");
			if(params.edata.data){
				
			}
		}
		
		function countPostReleaseEvents(fish){
			return Object.keys(fish.sites).sum(d => {return fish.sites[d].length})
		}
		
	//end internal functions****************************
		var _this = this;
		let dateFormat1 = d3.time.format("%m/%d/%Y");
		var options = {
			fishcolor: function(d){return "#888888"},
			fish_opacity: 1,
			trackcolor: function(d){return "#888888"},
			track_opacity: 1,
			sites: [],
			flowlines: [],
			flowtemp: false,
			damflows: [],
			flowscale: 1,
			tempscale: d3.scale.threshold().domain([8,10,12,14,16,18,20]).range(["#0040ff","#0080ff","#00ffff","#40ff00","#ffff00","#ffbf00","#ff8000","#ff0000"]),
			tempvariable: "TempTW",
			gasvariable: "DgasTW"

		}
		if(opts){
			Object.keys(opts).forEach(function(d){
				options[d] = opts[d];
			})
		}
		var fish, xAxis,yAxis, currentRange, initRange;

		var margin = {top: 10, right: 36, bottom: 100, left: 160},
			margin2 = {top: 730, right: 36, bottom: 30, left: 160},
			width = 950 - margin.left - margin.right,
			height = 800 - margin.top - margin.bottom,
			height2 = 800 - margin2.top - margin2.bottom;	

		d3.select("#chosen").remove();
		d3.select("#tipdiv").style("opacity", 0);
			
		var svg = d3.select('#fishplot').append("svg")
			.attr("id","chosen")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom);
			
		svg.append("text")
			.attr("class", "loading")
			.text("Working ...")
			.attr("x", function () { return width/2; })
			.attr("y", function () { return height/2-5; });
			
		var inRange = function(d) { 
			if(!currentRange || d.obs_date < currentRange[0] || d.obs_date > currentRange[1] ) {
				//console.log("hidden");
				return "hidden";
			} else {
				//console.log("visible");
				return "visible";
			}
		}

		var data;
		
		

		if(options.sites.length>0){
			data = [];
			params.fishfilter.detectionsDim.top(Infinity).forEach(function(d){
				var fish = {}
				Object.keys(d).forEach(function(dd){
					fish[dd] = d[dd]
				})
				fish.events = [];
				d.events.forEach(function(dets){
					if(options.sites.includes(dets.site))fish.detections.push(dets);
				});
				if(fish.events.length>0)data.push(fish)
			})
			_this.data = data
		}
		//include only fish with detections
		else{
			data = params.fishfilter.detectionsDim.top(Infinity).filter(function(d){return d3.sum(Object.keys(d.sites),dd => {return d.sites[dd].length}) > 0});
			this.data = data
		}	

		var obs_sites=[],_obs_sites={};
		var rel_sites=[],_rel_sites={};
		var date_limits = params.fishfilter.dateLimits()
		var min_date = date_limits.min_date;
		var max_date = date_limits.max_date;
		initRange = [min_date,max_date];

		this.reset_basins()

		data.forEach(function (d) {
			if (!_rel_sites[d.rel_site]) 
				{
					_rel_sites[d.rel_site] = true; 
					rel_sites.push(d.rel_site); 
				}
			filterEvents(d.events).forEach(function (dd) {
				if(!_this.sites_basins[dd.site])console.log(dd)
				_this.basins_sites[_this.sites_basins[dd.site]].active=true;
				_this.basins_sites[_this.sites_basins[dd.site]].active_sites[_this.sites_index[dd.site]]=true;
			});
		});


		currentRange = [min_date,max_date];
		var damflowdata, damflowmax, flowdata;


		var x = d3.time.scale().range([0, width]),
			x2 = d3.time.scale().range([0, width]),
			y = d3.scale.ordinal().rangeBands([0, height], 1),
			y2 = d3.scale.ordinal().rangeBands([0, height2], 1)

		var xAxis = d3.svg.axis().scale(x).orient("bottom")//.tickFormat(d3.time.format("%b %Y"));
		var xAxis2 = d3.svg.axis().scale(x).orient("bottom");
		var yAxis = d3.svg.axis().scale(y).orient("left");	

		//x.domain(d3.extent(data.map(function(d) { return d.obs_date; })));
		x.domain([min_date, max_date]);
		y.domain(this.getDomain());
		x2.domain(x.domain());
		y2.domain(y.domain());
		
		params.x = x
				

			
		var div = d3.select('#fishplot').append("div") // declare the properties for the div used for the tooltips
		  .attr("class", "tooltip")       // apply the 'tooltip' class
		  .style("opacity", 0);	

		svg.append("defs").append("clipPath")
			.attr("id", "clip")
		  .append("rect")
			.attr("width", width)
			.attr("height", height);

		var focus = svg.append("g")
			.attr("class", "focus")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var context = svg.append("g")
			.attr("class", "context")
			.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
			
		var line = d3.svg.line()
			.x(function (d) { 
				//if(d.obs_date < currentRange[0])return currentRange[0];
				return x(d.date);})
			.y(function (d) {return y(_this.getBasinSite(d.site));})
			.interpolate("linear");
			
			
		var line2 = d3.svg.line()
			
			.x(function (d) {
			return x2(d.date);})
			.y(function (d) {
			return y2(_this.getBasinSite(d.site));})
			.interpolate("linear");

		var line3 = d3.svg.line()
			.x(function (d) { 
				return d.x;})
			.y(function (d) {return d.y;})
			.interpolate("linear");
			


		var tdate1 = new Date();
		var tdate2 = new Date();
		tdate2.setDate(tdate2.getDate()+1)


		var tipdiv = d3.select("body").append("div")   
			.attr("class", "tooltip")               
			.style("opacity", 0);
			
		var brush = d3.svg.brush()
			.x(x2)
			.on("brush", brushed);

		var context = svg.append("g")
			.attr("class", "context")
			.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
			
		context.append("g")
			  .attr("class", "x axis")
			  .attr("transform", "translate(0," + height2 + ")")
			  .call(xAxis2);
			   

		context.append("g")
			  .attr("class", "x brush")
			  .call(brush)
			  .selectAll("rect")
			  .attr("y", -6)
			  .attr("height", height2 + 7);	


		focus.append("rect")  // Grid lines Background
					.attr("x", 0)
					.attr("y", 0)
					.attr("height", height)
					.attr("width", width)
					.attr("fill", "#E6E6E6")
					.style("opacity", "0.3");

							
		//plot flow bars
		
		//new brush*******************
/*		
		const brush2 = d3.brush().extent([[0, 0], [width, height]])
		   .on("start", () => { brush_startEvent(); })
		   .on("brush", () => { brush_brushEvent(); })
		   .on("end", () => { brush_endEvent(); })
		   .on("start.nokey", function() {
			   d3.select(window).on("keydown.brush keyup.brush", null);
		});

		const brushSvg = focus
		   .append("g")
		   .attr("class", "brush")
		   .call(brush);
		
*/		

		var damflow = focus.append("g")
				.attr("class","damflow")
				
		var spillflow = focus.append("g")
				.attr("class","spillflow")		


		getDamFlowData();
		setDamFlow();	
					
		//plot flow lines

		var flows = focus.append("g")
			.attr("class","flows")


		getFlowLineData();
		setFlowLines();	
					
		var padding = width/(_this.basins.length + 1)/2;

		var fish  = focus.selectAll(".fish")
			.data(data)
			.enter().append("g")
			.attr("class",function(d){
				return "fish " + "TAG" + d.tag_code.split(".")[1];
			});
			
		var fish2  = context.selectAll(".fish")
			.data(data)
			.enter().append("g")
			.attr("class", "fish");		

		fish.append("path")
			.attr("class", function (d) {
			return "line " + "TAG"+ d.tag_code.split(".")[1];
			})
			.attr("d", function (d) {
			return line3(trimDetections(filterEvents(d.events)));
			})
			.style("stroke", options.trackcolor)
			.style("fill", "none")
			.style("stroke-width", 1);	

		fish2.append("path")
			.attr("class", "line")
			.attr("d", function (d) {
			//console.log(d);
			return line2(filterEvents(d.events));
			})
			.style("stroke", function (d) {
			return getColor(d);
			})
			.style("fill", "none")
			.style("stroke-width", 1);	

		fish.append("g")
				.attr("class", "dot")
				.selectAll("circle")
				.data(function(d) { return filterEvents(d.events); })
				.enter().append("circle")
				.attr("r", 3)
				.attr("class", function (d) {
					return addClass(d);
				})
				.attr("cx", function(d,i) {  return x(d.date); })
				.attr("cy", function(d,i) { return y(_this.getBasinSite(d.site)); })
				.style('fill', options.fishcolor);

				

		focus.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

		focus.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end");

		var addtip = focus
			.select(".y.axis")
			.selectAll(".tick")
			//console.log(addtip);
			.on("mouseover", function(d) {
				var text="";
				var basin = _this.basins_sites[_this.basins_index[d]];
				if(basin){
					if(!basin.open)text="click to expand";
					else text="click to collapse";
				}
				else{
					var site = sites[d];
					text = site.name + ' | rkm:' + site.rkm;
				}
				tipdiv.transition()        
					.duration(20)      
					.style("opacity", 1);      
				tipdiv.html(text)  
					.style("left", (d3.event.pageX + 20) + "px")     
					.style("top", (d3.event.pageY - 14) + "px"); 	
			})                  
			.on("mouseout", function(d) {       
					tipdiv.transition()        
						.duration(20)      
						.style("opacity", 0);   
			})
			.on("click", function(d){
				var basin = _this.basins_sites[_this.basins_index[d]];
				if(basin){
					if(!basin.open)basin.open=true;
					else basin.open=false;
					y.domain(_this.getDomain());
					addGrid(focus);
					focus.selectAll(".fish").select(".line").attr("d", function (dd) {return line3(trimDetections(filterEvents(dd.events)));})
					focus.selectAll("circle")
						.attr("cx", function (dd) { return x(dd.date); })
						.attr("cy", function (dd) { return y(_this.getBasinSite(dd.site)); })
						.style("visibility", inRange)
						.attr("class",addClass)
						
					focus.select(".y.axis").call(yAxis);				
				}
			});	

		var addGrid = function(obj){	
			obj.selectAll(".grid").remove();
			obj.append("g")     // Draw the y Grid lines
			.attr("class", "grid")
			.call(make_y_axis()
			  .tickSize(-width, 0, 0)
			  .tickFormat("")
			);	
		}

		addGrid(focus);

		var countbox = [];
		var fishbuffer;
		focus.on("click", function(){
			if(d3.mouse(this)[0]<0){
				return;
			}
			if(countbox.length==0){
				let start_coords = d3.mouse(this);
				countbox.push(start_coords);
				focus.on("mousemove",function(){
					var current_coords = d3.mouse(this);
					//console.log(current_coords[0] + "," + current_coords[1]);
					var _x = Math.min(start_coords[0],current_coords[0]);
					var _y = Math.min(start_coords[1],current_coords[1]);
					focus.select("#testbox").remove()
					focus.append('rect')
							.attr('x', _x)
							.attr('y', _y)
							.attr('width', Math.abs(start_coords[0]-current_coords[0]))
							.attr('height', Math.abs(start_coords[1]-current_coords[1]))
							.attr('id', 'testbox')
							.style('fill', "none")
							.style("stroke", "black");					
				})
			}
			else if (countbox.length==2){
				countbox = [];
				focus.on("mousemove",null)
				svg.selectAll("#fishcounts").remove();
				focus.selectAll("#countbox").remove();
				focus.selectAll("#counttext").remove();
				focus.selectAll("#counttext2").remove();
				focus.selectAll("circle").style("opacity", options.fish_opacity);
				focus.selectAll("path").style("opacity", options.track_opacity);
				d3.select("#fishoptions").style("visibility","hidden");
				_this.caughtfish = [];
				params.fishfilter.clearSelectedData();
			}
			else{
			countbox.push(d3.mouse(this))
			focus.on("mousemove",null)
			focus.select("#testbox").remove()
			var _temp = focus.selectAll("circle").filter(function(d){ return d3.select(this).style('opacity') != 0 });
			var temp = _temp.filter(function(d,i){
				var da = d3.select(this);
				var _x = da.attr("cx");
				var _y = da.attr("cy");
				if(_x >= Math.min(countbox[0][0],countbox[1][0]) & _y >= Math.min(countbox[0][1],countbox[1][1]) & _x <= Math.max(countbox[0][0],countbox[1][0]) & _y <= Math.max(countbox[0][1],countbox[1][1]))return true;
		//		if(x(d.date1) >= Math.min(countbox[0][0],countbox[1][0]) & y(d.site2) >= Math.min(countbox[0][1],countbox[1][1]) & x(d.date1) <= Math.max(countbox[0][0],countbox[1][0]) & y(d.site2) <= Math.max(countbox[0][1],countbox[1][1]))return true;
				return false;
			});
			//console.log(temp[0].length + " fish");
			//console.log(temp[0][0]);
			focus.selectAll("circle").style("opacity", 0);
			focus.selectAll(".line").style("opacity", 0);
			var fishes = {};
			var events = [];
			_this.caughtfish = [];	
			temp[0].forEach(function (d) {
				var att = d.getAttribute("class");
				var i1 = att.indexOf("TAG");
				var i2 = att.indexOf("SITE");
				var site = att.substring(i2+4).replace(/-/g," ");
				
				att = att.substring(i1,i2); 
				fishes[att]=1;
				att = ".fish." + att;
				var selected = focus.selectAll(att)
					.style("opacity", 1)
					.call(function(d){
						this.selectAll("path").style("opacity",options.track_opacity);
						var circles = this.select("g")
						.selectAll("circle")
						.style("opacity",options.fish_opacity)	
					});
				var sd = selected.datum();
				//console.log(sd)
				_this.caughtfish.push(sd);
				filterEvents(sd.events).forEach(function(d){if(_this.getBasinSite(d.site)==site)events.push(d)});
			});
			var nfish = Object.keys(fishes).length;
			var ndetect = temp[0].length;
			countBox(nfish,ndetect);
			countFish();
			//sizeFish(detections);	
			}
			params.fishfilter.setSelectedData(_this.caughtfish)
		});




		focus
			.selectAll(".fish")
			.select(".line")
			.on("mouseover", function(d) {
				d3.select(this).moveToFront().style("stroke-width", "3px")
				})                  
			.on("mouseout", function(d) {       
				d3.select(this).style("stroke-width", "1px")   
			});

		focus
			.selectAll(".fish")
			.select(".dot")
			.selectAll("circle")
			.on("mouseover", function(d) {
					var site = {date: dateFormat1(d.date),temp: d.temperature};
					tipdiv.transition()        
						.duration(20)      
						.style("opacity", 1);      
					tipdiv.html('<b>' + d.type + ' at: ' + d.site + " on: " + site.date + '<br><b>Released: ' + d.getFish().rel_site + '</b> on ' + dateFormat1(d.getFish().rel_date) + '<br><b>Tag:</b> ' + d.getFish().tag_code)  
						.style("left", (d3.event.pageX + 20) + "px")     
						.style("top", (d3.event.pageY - 14) + "px");    
					})                  
				.on("mouseout", function(d) {       
					tipdiv.transition()        
						.duration(20)      
						.style("opacity", 0);   
				});	
			
			svg.selectAll(".loading").remove();
			
		return({
			updateFishColor: updateFishColor, 
			updateFlowScale: updateFlowScale, 
			updateDamFlow: updateDamFlow, 
			updateFlowLines: updateFlowLines,
			updateFishOpacity: updateFishOpacity,
			updateTrackOpacity: updateTrackOpacity
			})

	}
	
	checkSites(writeSites){
		var _this = this
		var allsites = []
		Object.keys(params.sitemap).forEach(function(d){
			try{
				var basin = _this.getBasinSite(d);
				params.sitemap[d].valid = true;
				params.sitemap[d].basin = basin;
			}
			catch(err){
			console.log(d)
				params.sitemap[d].valid=false
				params.sitemap[d].basin = "Unknown";
			}
			allsites.push(params.sitemap[d])
		})
		if(writeSites){
		
		//using R to view
		//read.csv("checksites.csv") %>% arrange(desc(rkm)) %>% View()
		
			var headers = Object.keys(allsites[0])
			headers.splice(6,1)//remove locations
			//downloadCSV(allsites,headers,"Site_export.csv")
			new CSV({headers: headers, data: allsites, filename: "checksites"})
				.encodeCSV().exportCSV()
		}
	}
}

class EventFilter{
	constructor(options){
		let _this = this;
		this.sitemap = options.sitemap ? options.sitemap : params.sitemap;
		this.onChangeFxns = []//functions to call when input data changes
		this.event_options_class = options.event_options_class ? options.event_options_class : "event_filter_option";
		
		this.event_type = {
			Observation: true,
			Mark: false,
			Release: true,
			Recapture: true,
			Recovery: true,
			"Passive Recovery": true
		}

		d3.selectAll(".pie_mode")
			.on("change",function(){
				let mode = this.value		
				_this.setMeasureMode(mode)
				_this.updateCharts()
			})
		$( "#pie_event_variable")
			.on("change",function(){
				params.pielayer.categoryField = document.getElementById("pie_event_variable").options[document.getElementById("pie_event_variable").selectedIndex].value;
				params.pielayer.update()
			});	
		$( "#pie_enviro_variable").attr("disabled", true)
			.on("change",function(){
				params.pielayer.categoryField = document.getElementById("pie_enviro_variable").options[document.getElementById("pie_enviro_variable").selectedIndex].value;
				params.enviroevent.variable = params.pielayer.categoryField
				params.pielayer.colormaps[params.pielayer.categoryField] = params.enviroevent.getColorMap(params.pielayer.categoryField)
				params.eventfilter.updateCharts()
			});			
	}
	
	
	dateLimits(){
		var min_date = d3.min(this.events,d => {return d.date});
		var max_date = d3.max(this.events,d => {return d.date});
		return [min_date, max_date];
	}
	
	updateCharts(){
		console.log("updating charts: " + this.filteredData().length + " data rows")
		this.onChangeFxns.forEach(fxn => {fxn()})
	}
	
	setMeasureMode(mode){
		let _this = this;
		if(mode == "measure"){
			this.filters.event_type.filterAll()
			this.filters.event_type.filter("Measure")
			
			$( "input.event_filter_option").attr("disabled", true);
			$( "#pie_event_variable").attr("disabled", true);
			$( "#pie_enviro_variable").attr("disabled", false);
			params.pielayer.categoryField = document.getElementById("pie_enviro_variable").options[document.getElementById("pie_enviro_variable").selectedIndex].value;
			params.enviroevent.variable = params.pielayer.categoryField
			params.pielayer.colormaps[params.pielayer.categoryField] = params.enviroevent.getColorMap(params.pielayer.categoryField)			
		}
		else{
			this.filters.event_type.filterAll()
			Object.keys(this.event_type).forEach(d => {
				if(_this.event_type[d])_this.filters.event_type.filter(d)
			})
			$( "input.event_filter_option").attr("disabled", false);
			$( "#pie_event_variable").attr("disabled", false);
			$( "#pie_enviro_variable").attr("disabled", true);
			params.pielayer.categoryField = document.getElementById("pie_event_variable").options[document.getElementById("pie_event_variable").selectedIndex].value;				
		}
	}
	
	filter(data){
		let _this = this;
		if(data){
			return data.filter(d => {return d.date >= _this.min_date & d.date <= _this.max_date})
		}
		else return null
	}
	
	setData(data){
		let _this = this;
		this.fish = data;
		this.events = [];
		this.fish.forEach(function(fish){
			var first = false;
			fish.events.forEach(function(event,i){
				let evnt = {
				}
				Object.keys(fish).forEach(function(d){
					if(!Array.isArray(fish[d]))evnt[d] = fish[d]
				})
				Object.keys(event).forEach(function(d){
					if(!Array.isArray(event[d]) | d == "edata")evnt[d] = event[d]
				})				
				evnt.latitude = _this.sitemap[event.site].latitude;
				evnt.longitude = _this.sitemap[event.site].longitude;
				evnt.site_basin = params.hucnames[params.sitemap[evnt.site].basin_code] ?  params.hucnames[params.sitemap[evnt.site].basin_code].name : "Unknown";
				evnt.release_basin = params.hucnames[params.sitemap[evnt.rel_site].basin_code] ?  params.hucnames[params.sitemap[evnt.rel_site].basin_code].name : "Unknown";
				evnt.basin_status = evnt.site_basin == evnt.release_basin ? true : false;
				evnt.basin_status = evnt.site_basin == "Unknown" ? false : evnt.basin_status;
				if(!first & evnt.type == "Observation")first = true;
				else first = false;
				evnt.event_order = first ? "first" : i==fish.events.length-1 ? "last" : "inner";
				_this.events.push(evnt);
				if(event.edata){
					let eevents = params.enviroevent.getEvents(event)
					eevents.forEach(ee => {_this.events.push(ee)})
				}
			})
		})	
		let datelimits = this.dateLimits()
		this.min_date = datelimits[0]
		this.max_date = datelimits[1]
		$("#event_date_slider").slider({
			range: true,
			min: new Date(datelimits[0]).getTime() / 1000,
			max: new Date(datelimits[1]).getTime() / 1000,
			step: 86400,
			values: [datelimits[0].getTime() / 1000, datelimits[1].getTime() / 1000],
			slide: function (event, ui) {
				d3.select("#event_dates").html((new Date(ui.values[0] * 1000).toDateString()) + " - " + (new Date(ui.values[1] * 1000)).toDateString())
			},
			stop: function (event, ui) {
				_this.min_date = new Date(ui.values[0] * 1000);
				_this.max_date = new Date(ui.values[1] * 1000);
				console.log((new Date(ui.values[0] * 1000).toDateString()) + " - " + (new Date(ui.values[1] * 1000)).toDateString());
				_this.filters.event_date.filter(null)
				_this.filters.event_date.filter(dc.filters.RangedFilter(_this.min_date,_this.max_date))
				_this.updateCharts()
			}
		});
		d3.select("#event_dates").html(datelimits[0].toDateString() + " - " + datelimits[1].toDateString())
		
		this.ndx = crossfilter(this.events);
		this.all = this.ndx.groupAll();
		dc.dataCount("#dc-event-count")
			.dimension(this.ndx)
			.group(this.all)

		var filters = {
			event_type: dc.rowChart("#chart-event_type","eventfilter"),
			site_type: dc.rowChart("#chart-site_type","eventfilter"),
			event_date: dc.barChart("#chart-event_date","eventfilter"),
			event_order: dc.rowChart("#chart-event_order","eventfilter"),
			basin_status: dc.rowChart("#chart-basin_status","eventfilter")
		};

		
		this.filters = filters;
		
		this.siteDim = this.ndx.dimension(function(d) {return d.site;})	
		
		filters.event_date
			.width(300)
			.height(100)
			.transitionDuration(200)
			.brushOn(true)
			.dimension(this.ndx.dimension(function(d) {return _this.floorDate(d.date);}))
			.group(filters.event_date.dimension().group()) 
			.elasticY(true)
			.renderHorizontalGridLines(false)
			.renderVerticalGridLines(false)
			.x(d3.time.scale().domain(this.dateLimits()))
			.yAxis().tickFormat(d3.format("s"));

		filters.event_type
			.width(200)
			.height(100)
			.margins({top: 0, left: 5, right: 0, bottom: 20})
			.dimension(this.ndx.dimension(function(d) {return d.type}))
			.group(filters.event_type.dimension().group())
			.elasticX(true)
			.transitionDuration(100)

		filters.site_type
			.width(200)
			.height(100)
			.margins({top: 0, left: 5, right: 0, bottom: 20})
			.dimension(this.ndx.dimension(function(d) {
					if(d.type == "Measure")return "Measurement";
					else return _this.sitemap[d.site].type
				}))
			.group(filters.site_type.dimension().group())
			.elasticX(true)
			.transitionDuration(100)			

		filters.event_order
			.width(200)
			.height(100)
			.margins({top: 0, left: 5, right: 0, bottom: 20})
			.dimension(this.ndx.dimension(function(d) {return d.event_order}))
			.group(filters.event_order.dimension().group())
			.elasticX(true)
			.transitionDuration(100)

		filters.basin_status
			.width(200)
			.height(100)
			.margins({top: 0, left: 5, right: 0, bottom: 20})
			.dimension(this.ndx.dimension(function(d) {return d.basin_status}))
			.group(filters.basin_status.dimension().group())
			.elasticX(true)
			.transitionDuration(100)

		Object.keys(this.event_type).forEach(d => {
		if(_this.event_type[d])_this.filters.event_type.filter(d)})			
			
		this.updateCharts()	
		return this;
	}
	
	init(){
		console.log("init called")
		let _this = this
		//dc.renderAll("eventfilter")
		//d3.selectAll(".dc-chart g.row text").style("fill","black");
		d3.selectAll("." + this.event_options_class)
			.on("click",function(){
				console.log(this.name + " " + this.value + " " + this.checked)
				_this[this.name][this.value] = this.checked
				_this.filters[this.name].filterAll();
				Object.keys(_this[this.name]).forEach(d => {
				if(_this[this.name][d])_this.filters[this.name].filter(d)})	
				_this.updateCharts()
			})
		return this;
	}
	
	filtersApplied(){
		let filterarray = [];
		let filters = this.filters
		let multiple = {
			dsites: true,
			dbasin: true,
			dsubbasin: true
		};
		Object.keys(filters).forEach(function(d){
			if(filters[d].filters().length > 0)filterarray.push({name: d, filters: filters[d].filters(), multiple_allowed: multiple[d] ? true : false})
		})
		return filterarray
	}
	
	filteredData(){
		return this.siteDim.top(Infinity)
	}
	
	reset(filtername){
		this.filters[filtername].filterAll();
		dc.redrawAll("eventfilter");
		return this;
	}	
	
	floorDate(_date){
		var date = new Date(_date);
		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);
		date.setMilliseconds(0);
		return date;	
	}
}

class FishFilter{
	constructor(options){
		if (!options.fishfarm) {
			console.log(options)
			return null;
		}
		let _this = this;
		this.onChangeFxns = []//functions to call when filters change
		this.fishfarm = options.fishfarm
		
		
		let ndx = crossfilter(this.fishfarm.fisharray);
			
		this.ndx = ndx;	
		
		let all = this.ndx.groupAll();
		this.all = all;

		dc.dataCount("#dc-data-count")
			.dimension(this.ndx)
			.group(this.all)
			
		var minlength = d3.min(_this.fishfarm.fisharray,function(d){if(!d.length)return 1000;else return d.length});
		var maxlength = d3.max(_this.fishfarm.fisharray,function(d){if(!d.length)return 0;else return d.length})
		maxlength = maxlength > 200 ? 200 : maxlength;			
			
		let filters = {
			species: dc.pieChart("#pie-species"),
			run: dc.pieChart("#pie-run"),
			rtype: dc.pieChart("#pie-rtype"),
			basin: dc.pieChart("#chart-basin"),
			subbasin: dc.pieChart("#pie-subbasin"),
			relsite: dc.pieChart("#pie-rel_site"),
			year: dc.pieChart("#pie-year"),
			dbasin: dc.pieChart("#pie-dbasin"),
			dsubbasin: dc.pieChart("#pie-dsubbasin"),
			dsites: dc.pieChart("#pie-dsites"),
			//lastsite: dc.pieChart("#pie-lastsite"),
			transport: dc.pieChart("#pie-transport"),
			
		};
		
		if(maxlength>0)filters.flength = dc.barChart("#chart-flength")
		
		this.filters = filters;
		
		this.detectionsDim = ndx.dimension(function(d) {return d.events;})
		this.mindateDim = ndx.dimension(function(d) {return d.events[0].date;})
		this.maxdateDim = ndx.dimension(function(d) {return d.events[d.events.length-1].date;})	

		filters.species
			.width(350)
			.height(150)
			.radius(70)
			.cx(70)
			.cy(80)	
			.dimension(ndx.dimension(function(d) {return d.species;}))
			.group(filters.species.dimension().group())
			.legend(dc.legend().x(150).y(10).itemHeight(13).gap(5));
		console.log("species")
		
		filters.basin
			.width(350)
			.height(200)
			.radius(70)
			.cx(70)
			.cy(80)
			.dimension(ndx.dimension(function(d) {
				if(!params.sitemap[d.rel_site])console.log(d)
				if(params.hucnames[params.sitemap[d.rel_site].basin_code])return params.hucnames[params.sitemap[d.rel_site].basin_code].name;
				else return "Unknown";
			}))
			.group(filters.basin.dimension().group())
			.legend(dc.legend().x(150).y(10).itemHeight(13).gap(5));
		console.log("basin")
	
		filters.subbasin
			.data(function(group){
				return group.all().filter(function(kv) {
					return kv.value>0; 
				})
			})
			.width(350)
			.height(200)
			.radius(70)
			.cx(70)
			.cy(80)
			.dimension(ndx.dimension(function(d) {
					if(params.hucnames[params.sitemap[d.rel_site].subbasin_code])return params.hucnames[params.sitemap[d.rel_site].subbasin_code].name;
					else return "Unknown"
				}))
			.group(filters.subbasin.dimension().group())
			.renderLabel(false)
			.legend(dc.legend().x(160).y(10).itemHeight(13).gap(5));
		console.log("subbasin")
								
		filters.relsite
			.data(function(group){
				return group.all().filter(function(kv) {
					return kv.value>0; 
				})
			})
			.width(350)
			.height(200)
			.radius(70)
			.cx(70)
			.cy(80)
			.dimension(ndx.dimension(function(d) {return d.rel_site;}))
			.group(filters.relsite.dimension().group())
			.renderLabel(false)
			.legend(dc.legend().x(160).y(10).itemHeight(13).gap(5));
		console.log("relsite")
		
		filters.year
			.width(350)
			.height(150)
			.radius(70)
			.cx(70)
			.cy(80)	
			.dimension(ndx.dimension(function(d) {return d.rel_date.getFullYear();}))
			.group(filters.year.dimension().group())
			.legend(dc.legend().x(150).y(10).itemHeight(13).gap(5))
			.on("postRedraw",function(d){
				_this.onChangeFxns.forEach(function(dd){
					dd();
				})
				//params.fishtracks.doTracks()
			})
		console.log("year")
	
		filters.rtype
			.width(350)
			.height(150)
			.radius(70)
			.cx(70)
			.cy(80)	
			.dimension(ndx.dimension(function(d) {return d.rtype;}))
			.group(filters.rtype.dimension().group())
			.legend(dc.legend().x(150).y(10).itemHeight(13).gap(5));
		console.log("rtype")
		
		filters.run
			.width(350)
			.height(150)
			.radius(70)
			.cx(70)
			.cy(80)	
			.dimension(ndx.dimension(function(d) {return d.run_name;}))
			.group(filters.run.dimension().group())
			.legend(dc.legend().x(150).y(10).itemHeight(13).gap(5));
		console.log("run")
		
		if(maxlength>0){
			filters.flength
				.width(350)
				.height(150)
				.margins({top: 10, right: 40, bottom: 30, left: 20})
				.y(d3.scale.linear())
				.elasticY(true)
				.x(d3.scale.linear().domain([minlength,maxlength]))
				.dimension(ndx.dimension(function(d) {
					if(!d.length)return 0;
					else return d.length;}))
				.group(filters.flength.dimension().group())
			console.log("length")
		}
		
		filters.transport
			.width(350)
			.height(150)
			.radius(70)
			.cx(70)
			.cy(80)	
			.dimension(ndx.dimension(function(d) {
				if(d.transported)return d.transported;
				else return false;}))
			.group(filters.transport.dimension().group())
			.legend(dc.legend().x(150).y(10).itemHeight(13).gap(5));
		console.log("transport")
		
		filters.dbasin
			.data(function(group){
				return group.all().filter(function(kv) {
					return kv.value>0; 
				})
			})
			.width(350)
			.height(150)
			.radius(70)
			.cx(70)
			.cy(80)
			.dimension(ndx.dimension(function(d) {
				let basins = []
				d.sites.Observation.forEach(function(dd){
					if(!params.sitemap[dd])console.log(dd)
					basins.push(params.hucnames[params.sitemap[dd].basin_code].name)
				})
				return uniq(basins);
			},true))
			.group(filters.dbasin.dimension().group())
			.legend(dc.legend().x(160).y(10).itemHeight(13).gap(5));
		console.log("dbasin")

		filters.dsubbasin
			.data(function(group){
				return group.all().filter(function(kv) {
					return kv.value>0; 
				})
			})
			.width(350)
			.height(150)
			.radius(70)
			.cx(70)
			.cy(80)
			.dimension(ndx.dimension(function(d) {
				let subbasins = []
				d.sites.Observation.forEach(function(dd){
					subbasins.push(params.hucnames[params.sitemap[dd].subbasin_code].name)
				})
				return uniq(subbasins);
			},true))
			.group(filters.dsubbasin.dimension().group())
			.legend(dc.legend().x(160).y(10).itemHeight(13).gap(5));
		console.log("dsubbasin")		

		filters.dsites
			.data(function(group){
				return group.all().filter(function(kv) {
					return kv.value>0; 
				})
			})
			.width(350)
			.height(150)
			.radius(70)
			.cx(70)
			.cy(80)
			.dimension(ndx.dimension(function(d) {
				let sites = []
				d.sites.Observation.forEach(function(dd){
					sites.push(dd)
				})
				return uniq(sites);
			},true))
			.group(filters.dsites.dimension().group())
			.legend(dc.legend().x(160).y(10).itemHeight(13).gap(5));
		console.log("dsites")
		
		//for data selected by e.g. fishtracks or data table
		this.selected = []
		this.addedfilters = []
		d3.select("#newfilterbutton")
			.on("click", this.addFilter.bind(this))
	}
	
	setSelectedData(data){
		this.selected = data
	}
	
	clearSelectedData(){
		this.selected = []
	}
	
	updateCharts(){
		this.onChangeFxns.forEach(d => {d()})
	}
	
	filtersApplied(){
		let filterarray = [];
		let filters = this.filters
		let multiple = {
			dsites: true,
			dbasin: true,
			dsubbasin: true
		};
		Object.keys(filters).forEach(function(d){
			if(filters[d].filters().length > 0)filterarray.push({name: d, filters: filters[d].filters(), multiple_allowed: multiple[d] ? true : false})
		})
		return filterarray
	}
	
	filteredData(){
		return this.detectionsDim.top(Infinity)
	}
	
	dateLimits(){
		var min_date = this.mindateDim.bottom(1)[0].events[0].date;
		var max_date = this.maxdateDim.top(1)[0].events[this.maxdateDim.top(1)[0].events.length-1].date;
		//min_date = dateFormat1.parse(dateFormat1(min_date));
		//max_date = dateFormat1.parse(dateFormat1(max_date));

		min_date.setTime( min_date.getTime() - 5 * 86400000 );
		max_date.setTime( max_date.getTime() + 5 * 86400000 );
		return {min_date: min_date, max_date: max_date}
	}
	
	init(){
		dc.renderAll()
		d3.selectAll(".dc-chart g.row text").style("fill","black");
	}
	
	reset(filtername){
		this.filters[filtername].filterAll();
		dc.redrawAll();
	}
	
	getObservationSites(){
		let sites = []
		params.fishfilter.filters.dsites.group().all().forEach(function(d){
			sites.push(d.key);
		})
		return sites;
	}
	
	saveCSV(){
		var rows = []
		var headers = []
		//loop through fish and detections
	
	}
	
	addFilter(){
		let _this = this
		if(this.selected.length>0){
			var filtername = "var" + this.addedfilters.length;
			var filterlabel = document.getElementById("filterlabel").value;
			var newdiv = d3.select("#filter4").append("div").attr("id","pie-" + filtername)
			newdiv.append("div").append("strong").html(filterlabel)
			var reset = newdiv.append("a")
				.attr("class","reset")
				.style("display","none")
			var newfilter = dc.pieChart("#pie-" + filtername)
			this.filters[filterlabel] = newfilter
			this.addedfilters.push({label: filterlabel, filter: newfilter});
			this.ndx.all().forEach(function(d){d[filtername]=false})
			this.selected.forEach(function(d){d[filtername]=true})
			var dim = this.ndx.dimension(function(d) {return d[filtername];});
			newfilter
				.width(350)
				.height(175)
				.radius(70)
				.cx(70)
				.cy(80)	
				.dimension(dim)
				.group(dim.group())
				.label(function (d) {
					if (newfilter.hasFilter() && !newfilter.hasFilter(d.key)) {
						return d.key + '(0%)';
					}
					var label = d.key;
					if (_this.all.value()) {
						label += ' (' + Math.floor(d.value / _this.all.value() * 100) + '%)';
					}
					return label;
				})			
				.legend(dc.legend().x(150).y(10).itemHeight(13).gap(5))			
				
			reset.on("click",function(){
				newfilter.filterAll();
				dc.redrawAll();
			})
			newfilter.render();
			document.getElementById("filterlabel").value = ""
		}
	} 	

}

class EnviroData{
	constructor(options){
		this.data = {daily: {}, hourly: {}}
		this.sitemap = options.sitemap;
	}
	
	setFishArray(fisharray){
		this.fisharray = fisharray;
	}
	
	fetchData(timespan){
		params.promises = [];
		params.progressbar.init()
		let _this = this;
		let siteyears = {}
		function setSiteYears(){
			_this.fisharray.forEach(function(d){
				d.events.filter(function(e){return e.type == "Observation"})
					.forEach(function(dd){
						if(_this.sitemap[dd.site].envirosites.length > 0){
							var year = dd.date.getFullYear()
							_this.sitemap[dd.site].envirosites.forEach(function(ddd){
								//if(!siteyears[ddd])siteyears[ddd] = []
								//if(!siteyears[ddd][year])siteyears[ddd][year] = [];
								var esite = JSON.parse(JSON.stringify(ddd))
								esite.year = year;
								siteyears[JSON.stringify(esite)] = esite
							})
						}
					})
			})
		}
		
		function getDailyData(project,location,source,year,resolve){
			var url = "https://www.cbr.washington.edu/dart/cs/php/rpt/river_daily.php?sc=1&outputFormat=csv&year=" + year + "&proj=" + project + "&span=no&startdate=1%2F1&enddate=12%2F31"; 
			params.check[url] = false
			d3.xhr(url).get(function (err, response) {
				var dirtyCSV = response.responseText;
				var firstEOL = dirtyCSV.indexOf('\n');
				var parsedCSV = d3.csv.parse(dirtyCSV);
				parsedCSV.forEach(function(d){
					//if(!_this.data.daily[d.Date])_this.data.daily[d.Date] = {}
					//_this.data.daily[d.Date][d.Project] = d
					_this.data.daily[d.Project + ":" + d.Date] = d
					d.Location = location
					d.Source = source;
					d.Freq = "daily";
				});
				//console.log(url)
				params.check[url] = true
				params.progressbar.updateProgress(completedcalls++,ncalls,"fetching attributes")
				resolve(true)
			});
		};

		function getHourlyData(project,location,source,year,resolve){
			var url = "https://www.cbr.washington.edu/dart/cs/php/rpt/wqm_hourly.php?sc=1&outputFormat=csv&year=" + year + "&proj=" + project + "&startdate=01%2F01&days=365"; 
			params.check[url] = false
			d3.xhr(url).get(function (err, response) {
				var dirtyCSV = response.responseText;
				var firstEOL = dirtyCSV.indexOf('\n');
				var parsedCSV = d3.csv.parse(dirtyCSV);
				//console.log(parsedCSV.length + " count from " + url)
				//console.log(parsedCSV)
				parsedCSV.forEach(function(d){
					//if(!_this.data.daily[d.Date])_this.data.daily[d.Date] = {}
					//_this.data.daily[d.Date][d.Project] = d
					_this.data.hourly[d.Project + ":" + d.Date + ":" + d.Hour] = d
					d.Location = location
					d.Source = source;
					d.Freq = "hourly";
				});
				params.check[url] = true
				params.progressbar.updateProgress(completedcalls++,ncalls,"fetching attributes")
				resolve(true)
			});
		};		
		
		setSiteYears();
		console.log(siteyears)
		var ncalls = Object.keys(siteyears).length*2;
		var completedcalls = 0
		params.check = {}
		
		d3.select("#spinner").style('visibility','visible');
		params.promises = []
		Object.keys(siteyears).forEach(function(d){
			let siteyear = siteyears[d]
			params.promises.push(new Promise(function(resolve, reject) {
				getDailyData(siteyear.sitecode,siteyear.location,siteyear.datasource,siteyear.year,resolve)
			}))
			params.promises.push(new Promise(function(resolve, reject) {
				getHourlyData(siteyear.sitecode,siteyear.location,siteyear.datasource,siteyear.year,resolve)
			}))				
		})
		
		params.handlers.process_attrs()
		
		d3.select("#spinner").style('visibility','hidden');		
	}
	

	
	assignEnviroData(){
		let _this = this;
		function getEnviroData(event){
			var sitedate;
			let site = event.site;
			let date = d3.time.format("%Y-%m-%d")(event.date)
			var edata = []
			let smap = _this.sitemap[site];
			smap.envirosites.forEach(function(d){
				let hour = 100*(event.date.getHours()+1)
				sitedate = d.sitecode + ":" + date + ":" + hour;
				if(_this.data.hourly[sitedate])edata.push(_this.data.hourly[sitedate])
				sitedate = d.sitecode + ":" + date;
				if(_this.data.daily[sitedate])edata.push(_this.data.daily[sitedate])
			})
			return edata;
		}

		//set enviro data for all events
		let acount = 0, ecount = 0
		this.fisharray.forEach(function(fish){
			fish.events.forEach(function(event){
				event.edata = getEnviroData(event)
				if(event.edata.length > 0)acount++
				ecount++
			})
		})
		console.log("Added attributes for " + acount + " of " + ecount +  " events")
	}
	
}

class FishFarm{
	constructor(){
		this.purge_level = "site";
		this.remove_zeroevents = true;
		this.purge_time = 120//max time in minutes
		this.fishes = {}
		this.datasets = []
		this.fisharray = []
		this.rear_types = {
			"Hatchery Reared": "H","Unknown": "U","Wild Fish or Natural Production": "W"
		}
		
		this.runs = ["N/A","Spring","Summer","Fall","Unknown"]
		
		this.species = {
			"": "Unknown","0": "Unknown","1": "Chinook","2": "Coho","3": "Steelhead","4": "Sockeye","5": "Chum","6": "Pink","7": "Bull Trout","8": "Cutthroat Trout","9": "Other","A": "Pacific Lamprey","B": "White Sturgeon","C": "Green Sturgeon","D": "Northern Pikeminnow","E": "Brook Trout","F": "American Shad","G": "Mountain Whitefish","H": "Walleye","I": "Channel Catfish","J": "Smallmouth Bass","K": "Western Brook Lamprey","L": "Lamprey (species unknown","U": ""
		}
	}

	fileCountText(){
		let count = this.datasets.length;
		return count==1 ? "1 PTAGIS file" : count + " PTAGIS files";
	}

	
	addData(ptagis){
		this.datasets.push(ptagis)
	}
	
	getMetadata(){
		let metadata = {
			purge_level: this.purge_level,
			max_time_minutes: this.purge_time,
			datasets: [],
			created: new Date()
		}
		this.datasets.forEach(function(d){
			metadata.datasets.push({
				saved_filename: d.file.name,
				lastModifiedDate: d.file.lastModifiedDate,
				file_size_bytes: d.file.size,
				file_type: d.file.type,
				PTAGIS_filter: d.filter,
				PTAGIS_report_type: d.report_type,
				title: d.title
			})
		})
		return metadata;
	}
	
	addFish(pdata){
		console.log(pdata)
		var _this = this;
		var fishes = this.fishes
		var fisharray = [];
		var PTAGIS_vars = pdata.PTAGIS_vars
		console.log(this)
		this.datasets.push(pdata)
		
		function processReleaseDate(fish,d){
			//release date
			if(d.release_date_mmddyyyy)fish.rel_date = d.release_date_mmddyyyy;
			else if(d.event_type_name == "Mark"){
				if(d.event_release_date_time_value)fish.rel_date = d.event_release_date_time_value;
				else if(d.event_release_date_mmddyyyy)fish.rel_date = d.event_release_date_mmddyyyy
			}
		}
		
		function processReleaseSite(fish,d){			
			//release site
			if(d.release_site_code_value)fish.rel_site = d.release_site_code_value;
			else if(d.release_site_name)fish.rel_site = d.release_site_name.split(" - ")[0]
			else if (d.event_type_name == "Mark"){
				if(d.event_release_site_code)fish.rel_site = d.event_release_site_code;
				else if(d.event_release_site_name)fish.rel_site = d.event_release_site_name.split(" - ")[0];
			}
		}		
		
		function hatchFish(d){
			var fish = {tag_code: d.tag_code, events: []}
			_this.fisharray.push(fish);
			switch (pdata.report_type) {
			  case 'Interrogation Detail':
				break;				  
			  case 'Interrogation Summary':
				break;
			  case 'Tagging Detail':

				break;
			  case 'Recapture Detail':

				break;
			  case 'Mortality Detail':
	
				break;				
			  default://Complete Tag History
				//species
				if(d.mark_species_name)fish.species = d.mark_species_name;
				else if(d.event_species_name)fish.species = d.event_species_name;
				else if(d.event_species_code)fish.species = _this.species[d.event_species_code];
				else fish.species = "Unknown"
				//run
				if(d.mark_run_name)fish.run_name = d.mark_run_name;
				else if(d.event_run_name)fish.run =  d.event_run_name;
				else if(d.event_run_code)fish.run =  _this.runs[+d.event_run_code]
				else fish.run = "Unknown";
				//rear type
				if(d.mark_rear_type_name)fish.rtype = _this.rear_types[d.mark_rear_type_name];
				else if (d.event_rear_type_code)fish.rtype = d.event_rear_type_code;
				else if(d.event_rear_type_name)fish.rtype = _this.rear_types[d.event_rear_type_name];
				else fish.rtype = "U";
				
				processReleaseDate(fish,d)
				processReleaseSite(fish,d)
			}
	
			//loop through variables, adding those at fish level
			/*
			Object.keys(PTAGIS_vars).forEach(function(pvar){
				if(PTAGIS_vars[pvar].Level == "fish")fish[pvar] = d[pvar]
			})
			*/
			fish.data = function(){return pdata.data.filter(function(dd){return dd.tag_code == d.tag_code})};
			return fish;			
		
		}
		pdata.data.forEach(function(d){
			if(!fishes[d.tag_code])fishes[d.tag_code] = hatchFish(d)
			var fish = fishes[d.tag_code]
			
			switch (pdata.report_type) {
			  case 'Interrogation Detail':
				break;				  
			  case 'Interrogation Summary':
				break;
			  case 'Tagging Detail':

				break;
			  case 'Recapture Detail':

				break;
			  case 'Mortality Detail':
	
				break;				
			  default://Complete Tag History
				if(!fish.release_date & d.event_type_name == "Mark")processReleaseDate(fish,d)
				if(!fish.release_site & d.event_type_name == "Mark")processReleaseSite(fish,d)
				
				//console.log("Processing|" + d.event_type_name + "|" + d.tag_code)
			  
			    var event = {}
				event.type = d.event_type_name ? d.event_type_name : "NA";
				//event.date = d.event_date_time_value ? function(){return d.event_date_time_value} : function(){return d.event_date_mmddyyyy};
				event.date = d.event_date_time_value ? d.event_date_time_value : d.event_date_mmddyyyy;
				//site
				
				if(d.event_site_code_value)event.site = d.event_site_code_value
				else if(d.event_site_info_code)event.site = d.event_site_info_code
				else if(d.event_site_name)event.site = d.event_site_name.split(" - ")[0];
				else event.site = "Unknown"
				//antenna
				if(d.antenna_id)event.antenna_id= d.antenna_id;
				if(d.antenna_group_name){
					event.antenna_group_name = d.antenna_group_name;
					if(d.antenna_group_configuration_value)event.antenna_config = d.antenna_group_configuration_value;
					if(d.antenna_group_sort_value)event.antenna_group_sort = d.antenna_group_sort_value;
				}

				//check for release length and width
				if(d.event_length_mm>0){
					if(d.event_type_name == "Mark")fish.length = d.event_length_mm;
				}
				if(d.event_weight_g>0){
					if(d.event_type_name == "Mark")fish.weight = d.event_weight_g;	
				}
				
			}
			//add Release Event
			if (d.event_type_name == "Mark"){
				//console.log("Adding|Release|" + d.tag_code + "|" + fish.rel_date)
				var release_date = fish.rel_date;
				if(fish.rel_date <= event.date){
					release_date = new Date(event.date.getTime() + 1000)//add 1 second
				}
				_this.pushEvent(fish,{type: 'Release', date: release_date, site: fish.rel_site, antenna_id: 'NA', antenna_group_name: 'NA',edata: []},null)
			}
			event.edata = []
			_this.pushEvent(fish,event,d)
		})
		/*

*/			
		
	}
	
	pushEvent(fish,event,data){
		//don't add these events
		if(event.type != "Mark Duplicate"){
			//add function to retrieve data
			event.data = function(){return data};
			
			//add functions to retrieve previous and next
			
			event.next = function(){
				let index = fish.events.indexOf(event);
				if(index < fish.events.length -1)return fish.events[index+1]
				else return null
			}
			
			event.previous = function(){
				let index = fish.events.indexOf(event);
				if(index > 0)return fish.events[index-1]
				else return null
			}

			event.getFish = function(){return fish};
			
			//check transport
			this.checkTransport(fish,event);
			fish.events.push(event)
			//console.log("Pushing|" + event.type + "|" + fish.tag_code + "|" + event.date)
		}	
	}
	
	checkTransport(fish,event){
		const tsites = ["GRJ","GOJ","LMJ","MCJ"];
		let good_ants = ["A-RACEWAY","A-RACEWAY / RIVER EXIT","A-SUBSAMPLE","B-RACEWAY","B-RACEWAY / RIVER EXIT","B-SUBSAMPLE","EAST RACEWAY 10","RACEWAY EAST","RACEWAY WEST / RIVER EXIT","SAMPLE TANK","SBYC A-RACEWAY RIVER GATE","SBYC B-RACEWAY RIVER GATE"]
		const bad_ants = ["FULL FLOW BYPASS","ADULT FISH RETURN","DIVERSION RIVER EXIT","SBYC RIVER EXIT","RIVER-1 EXIT","RIVER-2EXIT","BYPASS RIVER EXIT","DIVERSION GATE","SBYC GATE"]
		
		if(event.type == "Observation" && tsites.includes(event.site) && 'antenna_group_name' in event){
			let year = event.date.getFullYear()
			//console.log(event.antenna_group_name.includes("RACEWAY") | event.antenna_group_name.includes("SAMPLE"))
			if((event.antenna_group_name.includes("RACEWAY") | event.antenna_group_name.includes("SAMPLE")) && Transport.tdates[event.site][year]){
				//let year = event.date.getFullYear()
				if(event.date >= Transport.tdates[event.site][year].mindate && event.date <= Transport.tdates[event.site][year].maxdate)event.transported = true;
			}
			/*
			else if(!bad_ants.includes(event.antenna_group_name){
				
			}
			*/
		}
		if(event.transported)fish.transported = true;
	}

	sortEvents(){
		console.log("Sorting events for " + this.fisharray.length + " fish");
		this.fisharray.forEach(function(fish){
			fish.events.sort(function(a,b){
				return a.date-b.date;
			})
		})
	}

	pruneEvents(){
		console.log("Pruning events")
		let started = new Date()
		let _this = this;
		params.progressbar.init()
		params.progressbar.updateProgress(75,100,"pruning events")
		var nfish = this.fisharray.length
		this.fisharray.forEach(function(fish,ii){
			//params.progress = ii
			fish.sites = {Observation: {}, Recapture: {}, "Passive Recapture": {}, Recovery: {}, NA: {}}
			fish.events.forEach(function(event,i){
				if(event.type in fish.sites)fish.sites[event.type][event.site] = true
				if(i != 0 && i < fish.events.length-1){
					if(_this.purge_level == "none"){}
					else if(event[_this.purge_level] == event.previous()[_this.purge_level] && event[_this.purge_level] == event.next()[_this.purge_level] && event.type == "Observation"){
						if(event.date-event.previous().date < _this.purge_time*60000)event.remove = true
					}
				}
			})
			Object.keys(fish.sites).forEach(function(sitetype){
				fish.sites[sitetype] = Object.keys(fish.sites[sitetype])
			})
			fish.events = fish.events.filter(function(d){return !d.remove})
			//params.progressbar.updateProgress(ii,nfish,"pruning events")
		})
		let time = (new Date() - started)/1000
		console.log("Pruning completed in " + time + " seconds")
		params.progressbar.clear()
	}

	tossFish(){
		let _this = this;
		let remove = {}
		this.badfish = this.fisharray.filter(function(d){
			if(!d.rel_site || !d.rel_date){
				return true;
			}
			else if(_this.remove_zeroevents & d.events.filter(function(dd){return dd.type != "Mark" & dd.type != "Release"}).length == 0){
				return true;
			}
			else return false; 
		})
		
		if(this.badfish.length > 0)
		this.badfish.forEach(function(d){remove[d.tag_code] = true;})
		
		this.fisharray = this.fisharray.filter(function(d){
			if(remove[d.tag_code])return false;
			else return true; 
		})
		
		console.log(Object.keys(remove).length + " removed")
		console.log(this.fisharray.length + " fish retained")
		
		return this;
	}	
	
	saveToJSON(){
	
		function saveAs(blob, filename) {
		  if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
			return navigator.msSaveOrOpenBlob(blob, fileName);
		  } else if (typeof navigator.msSaveBlob !== 'undefined') {
			return navigator.msSaveBlob(blob, fileName);
		  } else {
			var elem = window.document.createElement('a');
			elem.href = window.URL.createObjectURL(blob);
			elem.download = filename;
			elem.style = 'display:none;opacity:0;color:transparent;';
			(document.body || document.documentElement).appendChild(elem);
			if (typeof elem.click === 'function') {
			  elem.click();
			} else {
			  elem.target = '_blank';
			  elem.dispatchEvent(new MouseEvent('click', {
				view: window,
				bubbles: true,
				cancelable: true
			  }));
			}
			URL.revokeObjectURL(elem.href);
		  }
		}	
	
		var zip = new JSZip();
		// Add an top-level, arbitrary text file with contents
		zip.file("archive.json", JSON.stringify({fishes: this.fishes, datasets: this.datasets}, null, 2));

	/*
		// Generate a directory within the Zip file structure
		var img = zip.folder("images");
		
		// Add a file to the directory, in this case an image with data URI as contents
		img.file("smile.gif", imgData, {base64: true});
		*/
		// Generate the zip file asynchronously
		zip.generateAsync({type:"blob",compression: "DEFLATE"})
		.then(function(content) {
			// Force down of the Zip file
			saveAs(content, "PITfish.zip");
		});	
	}


}




class PTAGIS{
	constructor(options){
		if (!options.file | !options.processor | !options.result) {
			console.log(options)
			return null;
		}
		var _this = this;
		var res;
		this.file = options.file
		var processor = options.processor
		var pos = options.result.indexOf('"')
		var prehead = options.result.slice(0,pos)
		this.title = _this.file.name;
		_this.filter = "NA"
		if(prehead != ""){
			const splitLines = str => str.split(/\r?\n/)
			prehead = splitLines(prehead)
			if(prehead[0] == "Report Filter:"){
				_this.filter = prehead[1]
			}
			else if(prehead.length>2){
				_this.title = prehead[0];
				_this.filter = prehead[3];
			}
		}
		var csv = options.result.slice(pos)
		var csvheader = csv.slice(0,csv.indexOf('\n')).replace("\r","")
		csvheader = _this.changeAttributeNames(csvheader,PTAGIS_names)
			
		var newcsv = csvheader + '\n' + csv.slice(csv.indexOf('\n')+1)
		//console.log(newcsv)
		res = d3.csv.parse(newcsv)
		console.log(res.length + " detections read")
		_this.data = res;
		_this.setReportType()
		//console.log(_this)
		_this.initAttributes()
		_this.process(processor)
	}
	
	process(processor){
		processor.addFish(this)
	}
	
	changeAttributeNames(header,ptagis){
		var newheader = []
		var PTAGIS_vars = {}
		var splitheader = header.replaceAll('"','').split(",")
		//console.log(splitheader)
		splitheader.forEach(function(d){
			var namemap = ptagis[d];
			if(!namemap)console.log(header)
			newheader.push(namemap.Clean)
			PTAGIS_vars[namemap.Clean] = {PTAGIS: d, Format: namemap.Format, Level: namemap.Level}
		})
		this.PTAGIS_vars = PTAGIS_vars;
		return newheader;
	}
	
	changeAttributeNames2(header){
		//var names = header.replace('"','').split(",")
		header = header.replaceAll("-","_")
		return header.toLowerCase().replaceAll(" ","_")
	}	
	
	initAttributes(){
		let dateFormat1 = d3.time.format("%m/%d/%Y");
		let dateFormat2 = d3.time.format("%m/%d/%Y %H:%M:%S %p");
		const attrset = this.PTAGIS_vars
		const attrlist = Object.keys(this.data[0])
		//console.log(attrset)
		this.data.forEach(function(d){
			//console.log(d)
			attrlist.forEach(function(dd){
				switch (attrset[dd].Format) {
				  case 'number':
					d[dd] = +d[dd]
					break;
				  case 'int':
					d[dd] = +d[dd]
					break;				  
				  case 'date':
					d[dd] = dateFormat1.parse(d[dd])
					break;
				  case 'datetime':
					d[dd] = dateFormat2.parse(d[dd])
					break;					
				  default:
					
				}
			})
		})
	}
	
	setReportType(){
		var _this = this;
		var repmap = {
			"count": "Interrogation Summary",
			"cth_count": "Complete Tag History",
			"obs_count": "Interrogation Detail",
			"mark_count": "Tagging Detail",
			"mort_count": "Mortality Detail",
			"recap_count": "Recapture Detail"
		}
		params.data = this.data
		this.report_type = "NA"
		Object.keys(repmap).forEach(function(type){
			if(Object.keys(_this.data[0]).includes(type))_this.report_type = repmap[type]
		})
	}
	
	
}

class Exporter {
	constructor(args){
		var _this = this;
		this.target = args.target ? args.target : ".export-options";
		this.data = args.data
		this.export_options = args.export_options
		this.dateFormat1 = d3.time.format("%m/%d/%Y");
		this.dateFormat2 = d3.time.format("%m/%d/%Y %H:%M:%S %p");
	}
	
	doExport(){
		function validType(value){
			if(Array.isArray(value))return false;
			else if(value instanceof Function)return false;
			else if(typeof value != "object")return true;
			else if(Object.prototype.toString.call(value) === '[object Date]')return true;
			else return false;
		}
		var json, csv, blob;
		let filters = params.fishfilter.filtersApplied()
		let metadata = params.fishdata.getMetadata();
		let _this = this;
		switch (this.export_options.filetype) {
			case 'json':
			  json = {
				data: this.data,
				filters: filters,
				metadata: metadata
			  }
			  blob = new Blob([JSON.stringify(json, null, 2)], { type: 'text/csv;charset=utf-8;' });
			  this.saveAs(blob,"export.json")
			  break;
			case 'json-zip':
			  this.zipSave([
				{filename: "fish.json", content: JSON.stringify(this.data, null, 2)},
				{filename: "filters.json", content: JSON.stringify(filters, null, 2)},
				{filename: "metadata.json", content: JSON.stringify(metadata, null, 2)}
			  ],"export.json.zip")
			  break;
			case 'csv-zip':
			  let arr = [], edata = []
			  this.data.forEach(function(fish){
				fish.events.forEach(function(event){
					let newevent = {}
					Object.keys(fish).forEach(function(d){
						if(validType(fish[d]))newevent[d] = fish[d];
					})
					Object.keys(event).forEach(function(dd){
						if(validType(event[dd]))newevent[dd] = event[dd];
					})
					if(!event.edata)console.log(event.getFish())
					event.edata.forEach(function(ed){
						if(ed.Freq == "hourly"){
							let env = {tag_code: fish.tag_code, event_site: event.site, event_date: event.date}
						
							Object.keys(ed).forEach(function(ddd){
								env[ddd] = ed[ddd]
							})
							edata.push(env)
						}
					})
					arr.push(newevent)
				})
			  })
			  let headers = Object.keys(arr[0])
			  let csv = new CSV({headers: headers, data: arr, filename: "fishevents"})
			  csv.encodeCSV()
			  let zipfiles = []
			  zipfiles.push({filename: "fishevents.csv", content: csv.csv})
			  /*
			  if(Object.keys(params.edata.data.daily).length>0){
				let daily = []
				Object.keys(params.edata.data.daily).forEach(function(d){daily.push(params.edata.data.daily[d])})
				let daily_headers = Object.keys(daily)
				console.log(daily)
				let daily_csv = new CSV({headers: daily_headers, data: daily, filename: "DART_Daily"})
				daily_csv.encodeCSV()
				zipfiles.push({filename: "DART_Daily.csv", content: daily_csv.csv})
			  }
			  */
			  if(edata.length>0){
				console.log(edata)
				let edata_csv = new CSV({headers: Object.keys(edata[0]), data: edata, filename: "DART_edata"})
				edata_csv.encodeCSV()
				zipfiles.push({filename: "environmental_attributes.csv", content: edata_csv.csv})
			  }			  
			  zipfiles.push({filename: "filters.txt", content: JSON.stringify(filters, null, 2)})
		      zipfiles.push({filename: "metadata.txt", content: JSON.stringify(metadata, null, 2)})			
			  this.zipSave(zipfiles,"export.csv.zip")
	
			  break;
			case 'csv-raw':
			  let arr1 = []

			  this.data.forEach(function(fish){
			    //loop over events and then get add row with raw data
			    fish.events.forEach(function(event){
  			    var fishdata = event.data()
  			    let newrow = {};
  			    if(fishdata){
    					Object.keys(fishdata).forEach(function(dd){
    					  var PTAGIS_name = _this.export_options.name_lookup[dd]
    					  if(!PTAGIS_name)PTAGIS_name = dd;
    						newrow[PTAGIS_name] = fishdata[dd];
    					}) 
    				if(newrow["Event Date Time Value"])newrow["Event Date Time Value"] = _this.dateFormat2(newrow["Event Date Time Value"]);
    				else newrow["Event Date Time Value"] = "";
    				if(newrow["Event Release Date Time Value"])newrow["Event Release Date Time Value"] = _this.dateFormat2(newrow["Event Release Date Time Value"]);
    				else newrow["Event Release Date Time Value"] = "";
    				if(newrow["Release Date MMDDYYYY"])newrow["Release Date MMDDYYYY"] = _this.dateFormat1(newrow["Release Date MMDDYYYY"]);
    				else newrow["Release Date MMDDYYYY"] = "";
  					arr1.push(newrow)
  			    }
			    })
			    

			  })			  
			  let headers1 = Object.keys(arr1[0])
			  let csv1 = new CSV({headers: headers1, data: arr1, filename: "RawPTAGIS"})
			  csv1.encodeCSV()
			  csv1.exportCSV()
			  break;  
			default:
		}
	}
	
	zipSave (files,filename){
		let _this = this;
		var zip = new JSZip();
		// Add an top-level, arbitrary text file with contents
		
		files.forEach(function(file){
			zip.file(file.filename,file.content)
		})
	/*
		// Generate a directory within the Zip file structure
		var img = zip.folder("images");
		
		// Add a file to the directory, in this case an image with data URI as contents
		img.file("smile.gif", imgData, {base64: true});
		*/
		// Generate the zip file asynchronously
		zip.generateAsync({type:"blob",compression: "DEFLATE"})
		.then(function(content) {
			// Force down of the Zip file
			_this.saveAs(content, filename);
		});	
		
	}
	
	saveAs(blob, filename) {
		  if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
			return navigator.msSaveOrOpenBlob(blob, fileName);
		  } else if (typeof navigator.msSaveBlob !== 'undefined') {
			return navigator.msSaveBlob(blob, fileName);
		  } else {
			var elem = window.document.createElement('a');
			elem.href = window.URL.createObjectURL(blob);
			elem.download = filename;
			elem.style = 'display:none;opacity:0;color:transparent;';
			(document.body || document.documentElement).appendChild(elem);
			if (typeof elem.click === 'function') {
			  elem.click();
			} else {
			  elem.target = '_blank';
			  elem.dispatchEvent(new MouseEvent('click', {
				view: window,
				bubbles: true,
				cancelable: true
			  }));
			}
			URL.revokeObjectURL(elem.href);
		  }
		}

}


class CSV{
	constructor(args){
	  console.log("CSV generated")
		var _this = this;
		var data = args.data || null;
		this.items = [];
		this.types = [];
		if (data == null || !data.length) {
			console.log("Fail")
			return null;
		}
		this.stringDelimiter = args.stringDelimiter || '"';
		this.columnDelimiter = args.columnDelimiter || ',';
		this.lineDelimiter = args.lineDelimiter || '\n';
		this.dateFormat1 = d3.time.format("%m/%d/%Y");
		this.dateFormat2 = d3.time.format("%m/%d/%Y %H:%M:%S %p");
		this.fileTitle = args.filename || 'export';
		this.keys = args.headers;
		
		function getMsSinceMidnight(d) {
		  var e = new Date(d);
		  return d - e.setHours(0,0,0,0);
		}
		
		this.keys.forEach(function(d){
			var type = _this.datatype(data[0][d])
			if(type == "date"){
				if(getMsSinceMidnight(data[0][d]) == 0)type = "date";
				else type = "datetime"
			}
			_this.types.push(type);
		})
		
		data.forEach(function(d){
			var item = {}
				_this.keys.forEach(function(dd,i){
					item[dd] = _this.encodeItem(d[dd],i)
				})
			_this.items.push(item)
		})
		
	}
	
	encodeItem(item,index){
		switch(this.types[index]) {
		  case "string":
			item = item.replace(/"/g, '""')//escape double quote
			return this.stringDelimiter + item + this.stringDelimiter;
			break;
		  case "date":
			return this.stringDelimiter + this.dateFormat1(item) + this.stringDelimiter;
			break;
		  case "datetime":
			return this.stringDelimiter + this.dateFormat2(item) + this.stringDelimiter;
			break;			
		  default:
			return item
		}
	}
	
	encodeCSV() {
		var array = this.items;
		var headers = this.keys;
		var str = '';
		headers.forEach(function(d,i){
			str += '"' + d + '"';
			if(i < headers.length-1)str += ','
		})
		str += '\r\n'
		
		for (var i = 0; i < array.length; i++) {
			var line = '';
			for (var index in array[i]) {
				if (line != '') line += ','
				line += (array[i][index]);
			}
			str += line + '\r\n';
		}
		this.csv =  str;
		return this;
	}
	
	exportCSV(){
		    var exportedFilename = this.fileTitle + '.csv' || 'export.csv';
			var blob = new Blob([this.csv], { type: 'text/csv;charset=utf-8;' });
			if (navigator.msSaveBlob) { // IE 10+
				navigator.msSaveBlob(blob, exportedFilename);
			} else {
				var link = document.createElement("a");
				if (link.download !== undefined) { // feature detection
					// Browsers that support HTML5 download attribute
					var url = URL.createObjectURL(blob);
					link.setAttribute("href", url);
					link.setAttribute("download", exportedFilename);
					link.style.visibility = 'hidden';
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
				}
			}
	}
	
	datatype(obj, showFullClass) {
		// get toPrototypeString() of obj (handles all types)
		if (showFullClass && typeof obj === "object") {
			return Object.prototype.toString.call(obj);
		}
		if (obj == null) { return (obj + '').toLowerCase(); } // implicit toString() conversion

		var deepType = Object.prototype.toString.call(obj).slice(8,-1).toLowerCase();
		if (deepType === 'generatorfunction') { return 'function' }

		// Prevent overspecificity (for example, [object HTMLDivElement], etc).
		// Account for functionish Regexp (Android <=2.3), functionish <object> element (Chrome <=57, Firefox <=52), etc.
		// String.prototype.match is universally supported.

		return deepType.match(/^(array|bigint|date|error|function|generator|regexp|symbol)$/) ? deepType :
		   (typeof obj === 'object' || typeof obj === 'function') ? 'object' : typeof obj;
    }
}

class ProgressBar{
//https://programmer.group/monitor-the-reading-progress-and-display-the-progress-bar-when-uploading-files.html
	constructor(){
		this.fullwidth = 500;
		this.progress = document.querySelector('.percent');
		this.progress_bar = document.getElementById('progress_bar')
	}
  // Update progress bar
  updateProgress(current,target,label) {
      var percentLoaded = Math.round((current / target) * 100);
      // Update progress bar length
      if (percentLoaded < 100) {
        this.progress.style.width = percentLoaded + '%';
        if(percentLoaded>20)this.progress.textContent = label + " " + percentLoaded + '%';
		else this.progress.textContent = percentLoaded + '%';
      }
  }
  
  init(){
	this.progress_bar.className = 'loading';
    this.progress.style.width = 0 + '%';
    this.progress.textContent = 0 + '%';	
  }
  
  clear(){
	this.progress_bar.className = 'loaded';
  }
}

function convertArrayOfObjectsToCSV(args) {
console.log(args)
var result, ctr, keys, columnDelimiter, lineDelimiter, data;

data = args.data || null;
if (data == null || !data.length) {
console.log("Fail")
return null;
}

columnDelimiter = args.columnDelimiter || ',';
lineDelimiter = args.lineDelimiter || '\n';

keys = args.header;

result = '';
result += keys.join(columnDelimiter);
result += lineDelimiter;

data.forEach(function(item) {
ctr = 0;
keys.forEach(function(key) {
if (ctr > 0) result += columnDelimiter;

result += item[key];
ctr++;
});
result += lineDelimiter;
});
console.log(result)
return result;
}

function downloadCSV(data, header, filename) {
console.log("downloadCSV called")
var link;
var csv = convertArrayOfObjectsToCSV({
data: data,
header: header
});
if (csv == null) return;

filename || 'export.csv';

if (!csv.match(/^data:text\/csv/i)) {
csv = 'data:text/csv;charset=utf-8,' + csv;
}
data = encodeURI(csv);

link = document.createElement('a');
link.setAttribute('href', data);
link.setAttribute('download', filename);
link.click();
console.log("downloadCSV finished")
}	

function processRow(row) {
	var finalVal = '';
	for (var j = 0; j < row.length; j++) {
		var innerValue = row[j] === null ? '' : row[j].toString();
		if (row[j] instanceof Date) {
			innerValue = row[j].toLocaleString();
		};
		var result = innerValue.replace(/"/g, '""');
		if (result.search(/("|,|\n)/g) >= 0)
			result = '"' + result + '"';
		if (j > 0)
			finalVal += ',';
		finalVal += result;
	}
	return finalVal + '\n';
};



function convertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ','

            line += (array[i][index]);
        }

        str += line + '\r\n';
    }

    return str;
}

function sanitizeString (desc) {
    var itemDesc;
    if (desc) {
        itemDesc = desc.replace(/(\r\n|\n|\r|\s+|\t|&nbsp;)/gm,' ');
        itemDesc = itemDesc.replace(/"/g, '""');
        itemDesc = itemDesc.replace(/ +(?= )/g,'');
    } else {
        itemDesc = '';
    }
    return itemDesc;
}

function exportCSVFile(headers, _items, fileTitle) {

	var items = []
	
	_items.forEach(function(d){
		item = {}
		headers.forEach(function(dd){
			item[dd] = d[dd]
		})
		items.push(item)
	})
	
	items.unshift(headers);

    // Convert Object to JSON
    var jsonObject = JSON.stringify(items);

    var csv = convertToCSV(jsonObject);

    var exportedFilename = fileTitle + '.csv' || 'export.csv';

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, exportedFilename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", exportedFilename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

class FishSummary{
	constructor(opts){
		let _this = this;
		this.fish = params.fishfilter.detectionsDim.top(Infinity);
		this.events = [];
		this.fish.forEach(function(fish){
			fish.events.forEach(function(event){
				_this.events.push({
					tag_code: fish.tag_code,
					rel_site: fish.rel_site,
					run: fish.run_name,
					rtype: fish.rtype,
					type: event.type,
					site: event.site,
					date: event.date,
					latitude: params.sitemap[event.site].latitude,
					longitude: params.sitemap[event.site].longitude,
					location: d3.format(".1f")(params.sitemap[event.site].latitude) + ":" + d3.format(".1f")(params.sitemap[event.site].longitude)
				});
			})
		})
	}
	
	filterByDate(daterange){
		return this;
	}
	
	groupBySite(type,sitevar,fishvar){
		let nest = d3.nest()
			.key(function(d){return params.sitemap[d.site][sitevar]})
			.key(function(d){return d.getFish()[fishvar]})
			.key(function(d){return d.getFish().tag_code})
			.entries(this.events.filter(function(d){return d.type==type}))	
			params.test = nest
	}

	groupByLocation(type,fishvar){
		let nest = d3.nest()
			.key(function(d){return params.sitemap[d.site].latitude + ":" + params.sitemap[d.site].longitude })
			.key(function(d){return d.getFish()[fishvar]})
			.key(function(d){return d.getFish().tag_code})
			.entries(this.events.filter(function(d){return d.type==type}))	
			params.test = nest
	}	
	
}	

class PointsGeoJSON{
	constructor(){
		this.geojson = 
		{
			type: "FeatureCollection",
			features: []
		}
	}
	
	addPoint(latitude,longitude,datum){
		let point = 
		{
			geometry: {"type": "Point", "coordinates": [longitude,latitude]},
			type: "Feature",
			properties: {}
		}

		Object.keys(datum).forEach(function(d){
			point.properties[d] = datum[d]
		})

		this.geojson.features.push(point)
	}
}

class ClusterPieLayer{
	constructor(options){
		let _this = this;
		this.map = options.map;
		this.data = options.data;
		this.palette = options.palette ? options.palette : "YlOrBr";
		this.rscale = options.rscale ? options.rscale : d3.scale.threshold().domain([10,100,1000]).range([12,8,4,0])
		this.strokeWidth = options.strokeWidth ? options.strokeWidth : 1;
		this.categoryField = options.categoryField ? options.categoryField : "type";
		this.rmax = this.rmax ? this.rmax : 40;
		this.labels = []
		this.label_params = {
			LabelLayer: null,
			labelwidth: 200,
			labelsize: 24,
			labelcolor: "#000000",
		}		
				
		this.colormaps=
			{
				rtype: {W: 3, H: 2, U: 1},
				run_name: {"Fall": 1,"Spring": 2,"Summer": 3,"Unknown": 4},
				species: {"Bull Trout": 1,"Chinook": 2, "Coho": 3, "Cutthroat Trout": 4, "Sockeye": 5, "Steelhead": 6},
				type: {Mark: 7,Release: 6, Observation: 5, Recapture: 4, "Passive Recapture": 3, Recovery: 2, Measure: 1}, 
				event_order: {first: 1,inner: 2, last: 3},
				release_basin: {
					"Lower Columbia": 1,
					"Deschutes": 2,
					"John Day": 3,					
					"Middle Columbia": 4,
					"Lower Snake": 5,
					"Clearwater": 6,
					"Salmon": 7,
					"Yakima": 8,
					"Upper Columbia": 9	
				},
				basin_status: {false: 1, true: 2}
			}
			
		d3.select("#pie_palette_options")
			.on("change",function(){
				_this.palette = this.options[this.selectedIndex].value
				_this.update()
			})
			
		this.legend_lookup = {}
		
		d3.select("#pie_event_variable").selectAll("option").each(function(){
			let key = this.value; 
			let value = d3.select(this).html();
			_this.legend_lookup[key] = value})
			
		d3.select("#pie_enviro_variable").selectAll("option").each(function(){
			let key = this.value; 
			let value = d3.select(this).html();
			_this.legend_lookup[key] = value})			
		
		this.init();	
	}
	
	update(){
		console.log("updating pies")
		this.map.removeLayer(this.eventLayer)
		this.init()
	}
	
	init(){
		var progress = document.getElementById('map_progress');
		var progressBar = document.getElementById('map_progress-bar');	
		function updateProgressBar(processed, total, elapsed, layersArray) {
			console.log("called")
			if (elapsed > 1000) {
				// if it takes more than a second to load, display the progress bar:
				progress.style.display = 'block';
				progressBar.style.width = Math.round(processed/total*100) + '%';
			}

			if (processed === total) {
				// all markers processed - hide the progress bar:
				progress.style.display = 'none';
			}
		}	
		let starttime = new Date()
		let runtime = 0
		let _this = this;
		this.eventLayer = L.markerClusterGroup({
		  maxClusterRadius: 2*this.rmax,
		  zoomToBoundsOnClick: false,
		  spiderfyOnMaxZoom: false,
		  //from https://github.com/Leaflet/Leaflet.markercluster/blob/master/example/marker-clustering-realworld.50000.html
		  chunkedLoading: true,
		  chunkProgress: updateProgressBar, 
		  iconCreateFunction: this.defineClusterIcon.bind(this) //this is where the magic happens
		})
		
		function getFish(children){
			let fish = {}, fisharray = []
			children.forEach(function(d){
				fish[d.feature.properties.tag_code] = d.feature.properties.getFish()
			})
			Object.keys(fish).forEach(function(d){
				fisharray.push(fish[d])
			})
			return fisharray
		}
		
		this.eventLayer
			.on('clusterclick', function (a) {
					// a.layer is actually a cluster
				var children = a.layer.getAllChildMarkers(),
				data = d3.nest() //Build a dataset for the pie chart
				  .key(function(d) { return d.feature.properties.site; })
				  .entries(children)
				console.log(data)
				_this.addLabel(a,data)
				params.fishfilter.setSelectedData(getFish(children))
			})
			.on('click',function (a){
				console.log(a)
				_this.addLabel(a,[{key: a.layer.feature.properties.site, values: [a.layer]}])
				params.fishfilter.setSelectedData(getFish([a.layer]))
			});
		
		runtime = new Date() - starttime - runtime;
		console.log("created eventLayer in " + (runtime/1000) + " seconds")
		let eventsGeoJSON = new PointsGeoJSON();
		this.data().forEach(function(d){
			eventsGeoJSON.addPoint(d.latitude,d.longitude,d)
		})
		runtime = new Date() - starttime - runtime;
		console.log("created geoJSON in " + (runtime/1000) + " seconds")
		this.geoJSONLayer = L.geoJson(eventsGeoJSON.geojson,{
			pointToLayer: this.defineEventFeature.bind(this)			
          });
		runtime = new Date() - starttime - runtime;
		console.log("created geoJSON Layer in " + (runtime/1000) + " seconds")
		Object.keys(this.geoJSONLayer._layers).forEach(function(d){
			_this.eventLayer.addLayer(_this.geoJSONLayer._layers[d])
		})
		//this.eventLayer.addLayer(this.geoJSONLayer)
		runtime = new Date() - starttime - runtime;
		console.log("Layer added to eventLayer in " + (runtime/1000) + " seconds")
		this.map.addLayer(this.eventLayer)	
		runtime = new Date() - starttime - runtime;
		console.log("Added to map in " + (runtime/1000) + " seconds")
		this.doLegend()
	}
	
	addLabel = function(obj,data){
		let cluster = obj.layer
		var lat = obj.latlng.lat;
		var lon = obj.latlng.lng;
		var leafmap = this.map//.addLayer(this.eventLayer)
		var html, words;
		
		let label = ""
		data.forEach(function(d,i){
			label += d.key
			if(i<data.length-1)label += "<br/>"
		})
		
		html = "<table class='sitelabeltable'><tr><td align='left' class='sitelabel'>" + label + "</td></tr></table>"
		
		var divIcon = L.divIcon({ 
		html: html,
		className: "sitelabel",
		draggable: true,
		color: "black"
		})
		
		var marker = L.marker(new L.LatLng(lat, lon), {icon: divIcon })
		//this.labels.push(marker)
		leafmap.addLayer(marker)
		//params.HUC.LabelLayer.addLayer(marker);
			// Disable dragging when user's cursor enters the element
		marker.addEventListener('mouseover', function () {
			leafmap.dragging.disable();
			marker.dragging.enable();
		});
		
		marker.on('dragend', function(e) {

		});

	// Re-enable dragging when user's cursor leaves the element
		marker.addEventListener('mouseout', function () {
			leafmap.dragging.enable();
		});
		
		marker.addEventListener('click', function () {
			leafmap.removeLayer(marker);
			leafmap.dragging.enable();
		});		
		
		d3.selectAll(".sitelabeltable").style("color",this.label_params.labelcolor)
		d3.selectAll(".sitelabeltable td").style("font-size",this.label_params.labelsize)
	}
	
	defineEventFeature(feature, latlng) {
		let _this = this;
		let getClass = function(){return "marker " +  _this.palette + "-q" + (_this.colormaps[_this.categoryField][feature.properties[_this.categoryField]]-1) + "-" + (Object.keys(_this.colormaps[_this.categoryField]).length);}
	    var categoryVal = feature.properties[this.categoryField]
		//iconVal = feature.properties[iconField];
		var myClass = 'marker category-'+ categoryVal// +' icon-'+iconVal;
		var myIcon = L.divIcon({
			className: getClass(),
			iconSize:null
		});
		let marker = L.marker(latlng, {icon: myIcon}).bindTooltip(feature.properties[_this.categoryField] + " (1)", {direction: "right"});
		return marker;	
	}

	defineClusterIcon(cluster) {
		let _this = this;
		var children = cluster.getAllChildMarkers(),
        data = d3.nest() //Build a dataset for the pie chart
          .key(function(d) { return d.feature.properties[_this.categoryField]; })
		  .sortKeys(function(a,b){return _this.colormaps[_this.categoryField][a] - _this.colormaps[_this.categoryField][b]})
		  .key(d => {return d.feature.properties.tag_code})
          .entries(children)
		  
        var n = d3.sum(data,d=>{return d.values.length}), //Get number of markers in cluster
		r = this.rmax-2*this.strokeWidth-this.rscale(n), //Calculate clusterpie radius...
        iconDim = (r+this.strokeWidth)*2, //...and divIcon dimensions (leaflet really want to know the size)
		  
        //bake some svg markup
        html = this.bakeThePie({data: data,
			valueFunc: function(d){return d.values.length;},
			strokeWidth: 1,
			outerRadius: r,
			innerRadius: r-20,
			pieClass: 'cluster-pie',
			pieLabel: n,
			pieLabelClass: 'marker-cluster-pie-label',
			pathClassFunc: function(d){return _this.palette + "-q" + (_this.colormaps[_this.categoryField][d.data.key]-1) + "-" + (Object.keys(_this.colormaps[_this.categoryField]).length);},
			pathTitleFunc: function(d){return d.data.key +' ('+d.data.values.length + ')';}
        }),
        //Create a new divIcon and assign the svg markup to the html property
        myIcon = new L.DivIcon({
            html: html,
            className: 'marker-cluster', 
            iconSize: new L.Point(iconDim, iconDim)
        });
    return myIcon;
	}


	bakeThePie(options) {
		let _this = this;
		/*Helper function*/
		function serializeXmlNode(xmlNode) {
			if (typeof window.XMLSerializer != "undefined") {
				return (new window.XMLSerializer()).serializeToString(xmlNode);
			} else if (typeof xmlNode.xml != "undefined") {
				return xmlNode.xml;
			}
			return "";
		}
		
		/*data and valueFunc are required*/
		if (!options.data || !options.valueFunc) {
			return '';
		}
		var data = options.data,
			valueFunc = options.valueFunc,
			r = options.outerRadius?options.outerRadius:28, //Default outer radius = 28px
			rInner = options.innerRadius?options.innerRadius:r-20, //Default inner radius = r-10
			strokeWidth = options.strokeWidth?options.strokeWidth:1, //Default stroke is 1
			pathClassFunc = options.pathClassFunc?options.pathClassFunc:function(){return '';}, //Class for each path
			pathTitleFunc = options.pathTitleFunc?options.pathTitleFunc:function(){return '';}, //Title for each path
			pieClass = options.pieClass?options.pieClass:'marker-cluster-pie', //Class for the whole pie
			pieLabel = options.pieLabel?options.pieLabel:d3.sum(data,valueFunc), //Label for the whole pie
			pieLabelClass = options.pieLabelClass?options.pieLabelClass:'marker-cluster-pie-label',//Class for the pie label
			
			origo = (r+strokeWidth), //Center coordinate
			w = origo*2, //width and height of the svg element
			h = w,
			donut = d3.layout.pie(),
			arc = d3.svg.arc().innerRadius(rInner).outerRadius(r);
			
		//Create an svg element
		var svg = document.createElementNS(d3.ns.prefix.svg, 'svg');
		//Create the pie chart
		var vis = d3.select(svg)
			.data([data])
			.attr('class', pieClass)
			.attr('width', w)
			.attr('height', h);
			
		vis
			.append('circle')
			.attr('cx', origo)
			.attr('cy', origo)
			.attr('r', rInner)
			.style('fill', 'white');	
			
		var arcs = vis.selectAll('g.arc')
			.data(donut.value(valueFunc).sort(function(a,b){return _this.colormaps[_this.categoryField][a] - _this.colormaps[_this.categoryField][b]}))
			.enter().append('svg:g')
			.attr('class', 'arc')
			.attr('transform', 'translate(' + origo + ',' + origo + ')');
		
		arcs.append('svg:path')
			.attr('class', pathClassFunc)
			.attr('stroke-width', strokeWidth)
			.attr('d', arc)
			.append('svg:title')
			  .text(pathTitleFunc);
					
		vis.append('text')
			.attr('x',origo)
			.attr('y',origo)
			.attr('class', pieLabelClass)
			.attr('text-anchor', 'middle')
			//.attr('dominant-baseline', 'central')
			/*IE doesn't seem to support dominant-baseline, but setting dy to .3em does the trick*/
			.attr('dy','.3em')
			.text(pieLabel);
		//Return the svg-markup rather than the actual element
		return serializeXmlNode(svg);
	}
	
	doLegend(options){
		let _this = this;
		let colorclass = function(d){return _this.palette + "-q" + (_this.colormaps[_this.categoryField][d.name]-1) + "-" + (Object.keys(_this.colormaps[_this.categoryField]).length);}		
		var legend = d3.select("#pie_legend");
			legend.selectAll("svg").remove();
		let exists = {}
		d3.nest().key(d => {return d[_this.categoryField]}).entries(this.data()).forEach(d => {exists[d.key]=true})
		var data = [];
		var maxlength = 0;
		Object.keys(this.colormaps[this.categoryField]).forEach(function(d){
			if(exists[d]){
				data.push({name: d, value: _this.colormaps[_this.categoryField][d]})
				maxlength = d.length > maxlength ? d.length : maxlength;
			}	
		})
		let title = this.legend_lookup[this.categoryField];
		//maxlength = title.length > maxlength ? title.length : maxlength;
		var offset = 20		
		var height = data.length*18 + 3 + offset;
		var width = maxlength*7 + 50;
			var svg = legend.append("svg")
				.attr("height", height)
				.attr("width", width)
			
			svg.append("rect")
				.attr("x",0)
				.attr("y",0)
				.attr("height", height)
				.attr("width", width)
				.style("fill","white")
				
			svg.append("g")
				.attr("transform",function(d,i){
					return "translate(5,15)"
				})
				.append("text")
				.text(title)
				.style("font-size",14)
				.style("font-weight","bold")
				
			svg	
				.selectAll(".pieslice")
				.data(data)
				.enter()
				.append("g")
				.attr("class","pieslice")
				.attr("transform",function(d,i){
					return "translate(2," + (i*18+3 + offset) + ")"
				})
			svg	
				.selectAll(".pieslice")
				.append("rect")
				.attr("x",0)
				.attr("y",0)
				.attr("height", 10)
				.attr("width", 30)
				.attr("class",colorclass)
		
			svg	
				.selectAll(".pieslice")
				.append("text")
				.attr("transform","translate(35,10)")
				.text(function(d){return d.name})
				.style("font-size",14)
				
			svg
				.on("mouseover", function() {

				})                  
				.on("mouseout", function() {       

				});		
	}		
}

class EnviroEvent{
	constructor(options){
		this.variable = options.variable ? options.variable : "Temperature (C)";
		this.datasource = options.datasource ? options.datasource : "DART";
		this.frequency = options.frequency ? options.frequency : "hourly";
		this.sitemap = options.sitemap;
		this.scales = {
			"Temperature (C)": d3.scale.threshold().domain([10,12,14,16,18,20,22]).range(["< 10","10-12","12-14","14-16","16-18","18-20","20-22","> 22"]),
			"Dissolved Gas Percent (%)": d3.scale.threshold().domain([90,100,110,115,120,125]).range(["< 90","90-100","100-110","110-115","115-120","120-125","> 125"]),
			"Spill Percent (%)": d3.scale.threshold().domain([10,20,30,40,50,60,70,80]).range(["< 10","10-20","20-30","30-40","40-50","50-60","60-70","70-80","> 80"])			
		}
	}
	
	getValue(datum){
		return this.scales[this.variable](+datum[this.variable])
	}
	
	getColorMap(){
		let scale = []
		this.scales[this.variable].range().forEach(function(d,i){scale[d] = i+1})
		return scale;
	}
	
	//takes parent event and creates one or more child events of type=Measure
	getEvents(event){
		let _this = this;
		let events = [];//array of events to return
		let edata = event.edata.filter(d => {return d.Source == _this.datasource & d.Freq == _this.frequency})
		if(edata.length == 0) return [];
		else{
			edata.forEach(edatum => {
				let evnt = {
				}
				let fish = event.getFish()
				Object.keys(fish).forEach(function(d){
					if(!Array.isArray(fish[d]))evnt[d] = fish[d]
				})
				Object.keys(event).forEach(function(d){
					if(!Array.isArray(event[d]))evnt[d] = event[d]
				})	
				evnt.site = "USACE-" + edatum.Project;
				evnt.type = "Measure"
				let esite = _this.sitemap[event.site].envirosites.filter(esite => {return esite.sitecode == edatum.Project})
				if(esite.length > 0){
					evnt.latitude = esite[0].latitude;
					evnt.longitude = esite[0].longitude;
				}
				evnt.site_basin = params.hucnames[_this.sitemap[event.site].basin_code] ?  params.hucnames[_this.sitemap[event.site].basin_code].name : "Unknown";
				//console.log(event)
				//console.log(evnt)				
				evnt.release_basin = params.hucnames[_this.sitemap[evnt.rel_site].basin_code] ?  params.hucnames[_this.sitemap[evnt.rel_site].basin_code].name : "Unknown";
				evnt.basin_status = evnt.site_basin == evnt.release_basin ? true : false;
				evnt.basin_status = evnt.site_basin == "Unknown" ? false : evnt.basin_status;
				evnt.event_order = "inner";
				//Object.keys(edatum).forEach(d => {evnt[d] = edatum[d]})
				evnt.edata = edatum;
				
				let opts = document.getElementById("pie_enviro_variable").options;
				for(var i=0;i<opts.length;i++)evnt[opts[i].value] = this.scales[opts[i].value](+edatum[opts[i].value])
				
				events.push(evnt);
			})
		}
		return events;
	}
}