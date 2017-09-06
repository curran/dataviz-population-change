


// CANVAS SIZE
var width = 1078,
    height = 699;

// GRAPH SIZE
var graphHeight = 80;
var graphChangeHeight = 100;

// MAP SIZE
var mapScale = 150;

// OFFSET POSITION ON CANVAS
var mapOffsetX = 50;
var mapOffsetY = 159;
var changeGraphYOffset = -33;
var yAxisPadding = 40;
var totalGraphYOffset = -10;
// COLORS
var hoverColor = "lightblue";
var normalColor = "lightgrey";
var disabledColor = "lightgrey";
var selectedCountryColor = "white";
var asylumColor = "#2171b5";
var originColor = "#FFAD00";
var graphUpColor = "#F46D43";
var graphDownColor = "#66BD63";
var graphUpStrokeColor = "rgba(255,120,0,0.9)";
var graphDownStrokeColor = "rgba(120,255,0,0.9)";


var type="ASY";

// COLOR BREWER - TOTAL ASYLUM
var colorTotalASY = d3.scale.threshold()
    .domain([0, 10000, 50000, 100000, 250000, 500000, 1000000, 2500000, 7000000])
    .range(colorbrewer.Blues[9]);

// COLOR BREWER - TOTAL ORIGIN
var colorTotalORI = d3.scale.threshold()
    .domain([0, 10000, 50000, 100000, 250000, 500000, 1000000, 2500000, 7000000])
    .range(colorbrewer.YlOrRd[9]);

// COLOR BREWER - CHANGE ASYLUM
var colorChangeASY = d3.scale.threshold()
    .domain([-2000000, -500000, -100000, -1000, 0, 1000, 100000, 500000, 7000000])
    .range(colorbrewer.RdYlGn[9]);

// COLOR BREWER - CHANGE ORIGIN
var colorChangeORI = d3.scale.threshold()
    .domain([0, 10000, 50000, 100000, 250000, 500000, 1000000, 3000000, 7000000])
    .range(colorbrewer.RdYlGn[9]);

// OTHER VARIABLES

var minYear = 1951;
var maxYear = 2016;
var totalYears = maxYear - minYear;
var selectedYear = maxYear;
var MaxTotal = 17838074;

var graphSelectedBar = 0;
var countrySelected = 0;
var totalOrGraph = 0; // 0 = total, 1 = change graphs
var countryHovered = 0;
var countrySelectedName;

// PROJECTION AND SCALE            

var projection = d3.geo.equirectangular()
    .center([0, 0])
    .scale(mapScale)
    .translate([width/2 + mapOffsetX, height/2 + mapOffsetY]);

var path = d3.geo.path()
    .projection(projection);

// CREATE SVG
var canvas = d3.select("#map").append("svg")
    .attr("width", width + 6) // Add 6px to show latest year label.
    .attr("height", height)
    .style("position","absolute")
    .style("top", "3px")
    .style("left", "10px");
     //   .call(d3.behavior.zoom()
    //.on("zoom", redraw))
     //   .append("g");

// ZOOM FUNCTION
function redraw() {
    canvas.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

// SVG FILTERS
var defs = canvas.append("defs");
// FILTER 0 (none) -- clear filter
var filter = defs.append("filter")
    .attr("id", "none");
// FILTER 1 (innershadow)
var filter = defs.append("filter")
    .attr("id", "innershadow")
    .attr("height", "130%");
filter.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 4)
    .attr("result", "blur");
filter.append("feOffset")
    .attr("in", "blur")
    .attr("dx", 0)
    .attr("dy", 0)
    .attr("result", "shadowDiff");
filter.append('feComposite')
    .attr('result','shadowDiff')
    .attr('in2','SourceAlpha')
    .attr('operator','arithmetic')
    .attr('k2',-1)
    .attr('k3',1);
filter.append('feFlood')
    .attr('flood-color','black')
    .attr('flood-opacity','0.9');
filter.append('feComposite')
    .attr('in2','shadowDiff')
    .attr('operator','in');
filter.append('feComposite')
    .attr('in2','SourceGraphic')
    .attr('operator','over');
// FILTER 2 (innershadow2) -- optional, not in use -- is more transparent
var filter = defs.append("filter")
    .attr("id", "innershadow2")
    .attr("height", "130%");
filter.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 4)
    .attr("result", "blur");
filter.append("feOffset")
    .attr("in", "blur")
    .attr("dx", 0)
    .attr("dy", 0)
    .attr("result", "shadowDiff");
filter.append('feComposite')
    .attr('result','shadowDiff')
    .attr('in2','SourceAlpha')
    .attr('operator','arithmetic')
    .attr('k2',-1)
    .attr('k3',1);
filter.append('feFlood')
    .attr('flood-color','darkblue')
    .attr('flood-opacity','0.9');
filter.append('feComposite')
    .attr('in2','shadowDiff')
    .attr('operator','in');
filter.append('feComposite')
    .attr('in2','SourceGraphic')
    .attr('operator','over');

// ADD MAP GEOMETRY
d3.json("js/worldtopo.json", function(error, map) {

  // The following change applies 2012 boundaries
  // up until the maximum year present in the data.
  // This should be fine, as no major boundaries have changed
  // between 2012 and 2017.
  map.objects.world.geometries.forEach(function (geometry){
      if(geometry.properties.COWEYEAR === 2012){
          geometry.properties.COWEYEAR = maxYear;
      }
  });

  // MAP SVG GROUP
  var mapsvg = canvas.append("g")
      .attr("class","map");

    // MAP BACKGROUND LAYER -- clickable to capture mouse off events
      mapsvg
          .append("rect")
          .attr("class","mapbglayer")
          .attr("width",width-yAxisPadding)
          .attr('height', 470)
          .attr("y", 320)
          .attr("x", yAxisPadding)
          .attr("fill", "rgba(0,0,0,0.0)")
          .on("click",function(d,i){
countrySelectedName = "";
$('#countryBox').text("World");

var yAxis = d3.svg.axis()
                  .scale(scaleYTotalAxis)
                  .orient("left")
                  .ticks(4)
                  .tickFormat(function (d) {
                    var label;
                    if(d==0){label = 0}

                     if ((d / 100) >= 1) {
                        label = d;
                      }
                      if ((d / 1000) >= 1) {
                        label = d / 1000 + "k";
                      }
                      if ((d / 1000000) >= 1) {
                        label = d / 1000000 + "m";
                      }                 
                  return label;});

            //Create Y axis
            canvas.selectAll(".totalYAxis")
                .transition().duration(1000).call(yAxis);

var type = $('#type').val();
var countryCode = "Total";
var max = d3.max(dataset.map(function(d) {return d[type][0][countryCode];} ));
var maxChange = d3.max(dataset.map(function(d,i) {if(i>=1){return Math.abs(dataset[i][type][0][countryCode]-dataset[i-1][type][0][countryCode]);}} ));
  var scaleYTotalCountry = d3.scale.linear()
              .domain([0,max])
              .range([0,graphHeight-10]);

  var scaleYChangeCountry = d3.scale.linear()
              .domain([0,maxChange])
              .range([0,graphHeight/2-10]);


   canvas.selectAll(".graphTotal rect")
          .data(dataset)
         .transition()
         .duration(700)
          .attr('height', function(d,i){var type = $('#type').val(); return scaleYTotalCountry(d[type][0][countryCode])})
          .attr("y", function(d,i){var type = $('#type').val(); return graphHeight-scaleYTotalCountry(d[type][0][countryCode])+10})

            canvas.selectAll(".graphChangeIncreases rect")
          .data(dataset)
         .transition()
         .duration(700)
                 .attr('height', function(d,i){ return scaleYChange(Math.abs(d[type][0].Increases));  })
          .attr("y", function(d,i){
              return 183-scaleYChange(Math.abs(d[type][0].Increases));;
          })
 .attr("fill", function(d,i){return graphUpColor;});

            canvas.selectAll(".graphChangeDecreases rect")
          .data(dataset)
         .transition()
         .duration(700)
                 .attr('height', function(d,i){ return scaleYChange(Math.abs(d[type][0].Decreases));  })
          .attr("y", function(d,i){
              return 185;
          })
 .attr("fill", function(d,i){return graphDownColor;});


countrySelected = 0;
changeType();
         });

  //BACKGROUND MAP
    mapsvg.append("g")
      .attr("class","background")
      .append("path")
      .datum(topojson.object(map, map.objects.world))
      .attr("d", path)
      .style("fill",disabledColor)
      .style("z-index", "1");

  // ACTIVE COUNTRY MAP
    mapsvg.append("g").attr("class","countrymap")
      .selectAll(".country")
        .data(topojson.object(map, map.objects.world).geometries)
        .enter().append("path")
        .attr("class", function(d) { return "country " + d.id; })
        .attr("d", path)
       // .attr("filter", "url(#innershadow2)")
        .style("z-index", "10")
          .on("click", function(d){
             d3.select(this).transition().style("fill", selectedCountryColor);
            mapMouseClick(d);
            changeType();
          })
          .on("mouseover", function(d){
              mapMouseOver(d);
              d3.select(this).attr("filter", "url(#innershadow)");
              })
          .on("mouseout", function(d){
              mapMouseOut(d);
              d3.select(this).attr("filter", "");
              });

    var barWidth = (width-yAxisPadding)/dataset.length;
    var scaleYTotal = d3.scale.linear()
              .domain([0,20000000])
              .range([0,graphHeight-10]);

    var scaleYTotalAxis = d3.scale.linear()
              .domain([0,20000000])
              .range([graphHeight-10, 0]);

    var scaleYChange = d3.scale.linear()
              .domain([0,2663045])
              .range([0,graphHeight/2-10]);

    var scaleYChangeAxis = d3.scale.linear()
              .domain([-2664045,2664045])
              .range([graphHeight-20, 0]);




    // TOTAL BAR GRAPH SVG GROUP
    var graphTotal = canvas.append("g")
        .attr("class","graphTotal");


    // ADD TOTAL GRAPH BARS
    graphTotal
          .selectAll("rect")
          .attr('class','totalBars')
          .data(dataset)
          .enter()
          .append("rect")
          .attr("width",barWidth-3)
          .attr('height', function(d,i){var type = $('#type').val(); return scaleYTotal(d[type][0].Total)})
          .attr("y", function(d,i){var type = $('#type').val(); return graphHeight-scaleYTotal(d[type][0].Total)+totalGraphYOffset+19})
          .attr("x", function(d,i){return yAxisPadding+(i)*barWidth+2;})
          .attr("fill", asylumColor)
                    .style("stroke",function(){return "rgba(124,255,255,0.5)";})
.style("stroke-width", 1);

     // TOTAL BAR GRAPH OVERLAY - slide function
    var graphTotalOverlay = canvas.append("g")
        .attr("class","graphOverlay");
var timer;

    graphTotalOverlay
          .selectAll("rect")
          .data(dataset)
          .enter()
          .append("rect")
          .attr("width",barWidth)
          .attr("class",function(d){return "graphTotalOverlay_"+d.year})
          .attr('height', graphHeight+0)
          .attr("y", totalGraphYOffset+22)
          .attr("x", function(d,i){return yAxisPadding+(i)*barWidth;})
          .attr("fill", "rgba(0,0,0,0.04)")
          .style("z-index", 50)
          .on("mouseover", function(d){
            if(graphSelectedBar==0){
              totalOrGraph = 0;
            selectedYear = d.year;
            sliderTotal(selectedYear);
              d3.select(this).attr("filter", "url(#innershadow)");
              d3.select(this).attr("fill", "rgba(20,20,30,0.15)");
              yearOver(selectedYear); }

            if(timer) {
      clearTimeout(timer);
      timer = null
    }  
    if(selectedYear!=maxYear){
    d3.selectAll(".y"+maxYear)
                .attr("fill", "#222222")
                .style("font-size", "6px")
                .style("font-weight", "normal");

                canvas.selectAll(".graphTotalOverlay_" + maxYear).attr("fill", "rgba(20,20,30,0.04)");
                canvas.selectAll(".graphChangeOverlay_" + maxYear).attr("filter", "null");
                canvas.selectAll(".graphChangeOverlay_" + maxYear).attr("fill", "rgba(20,20,30,0.04)");
} else {
                  canvas.selectAll(".graphChangeOverlay_" + maxYear).attr("filter", "null");
                canvas.selectAll(".graphChangeOverlay_" + maxYear).attr("fill", "rgba(20,20,30,0.04)");
}

              })

          .on("mouseout", function(d){
             if(graphSelectedBar==0){ 
              selectedYear = d.year;

if(timer) {clearTimeout(timer); timer = null;};
timer = setTimeout(function() {resetYear();}, 500);


              d3.select(this).attr("filter", "null");
              d3.select(this).attr("fill", "rgba(0,0,0,0.04)");
              if(selectedYear!=maxYear){
              yearOut(selectedYear); }}
              })
          .on("click", function(d){
                if(graphSelectedBar==0){
                    graphSelectedBar=1
                    d3.select(this).attr("fill", "rgba(0,0,0,0.2)");
                    selectedYear = d.year;
                    sliderTotal(selectedYear);
                    totalOrGraph = 0;
                }else{

                    graphSelectedBar=0;

                    graphTotalOverlay
                      .selectAll("rect").attr("fill", "rgba(0,0,0,0.04)");

                    graphChangeOverlay
                      .selectAll("rect").attr("fill", "rgba(0,0,0,0.04)");

                    d3.select(this).attr("filter", "url(#innershadow)");
                    d3.select(this).attr("fill", "rgba(20,20,30,0.15)");
       
                    d3.selectAll(".y"+selectedYear).attr("fill", "#858585").style("font-size", "8px");
                  
                    d3.selectAll(".yearLabels")
                      .attr("fill", "#222222")
                      .style("font-size", "6px")
                      .style("font-weight", "normal");

                    selectedYear = d.year;
                    sliderTotal(selectedYear);
                    yearOver(selectedYear); 
                }
          });
        


     // TOTAL BAR GRAPH Y AXIS

     //Define Y axis
            var yAxis = d3.svg.axis()
                  .scale(scaleYTotalAxis)
                  .orient("left")
                  .ticks(4)
                  .tickFormat(function (d) {
                    var label;
                    if(d==0){label = 0}

                     if ((d / 100) >= 1) {
                        label = d;
                      }
                      if ((d / 1000) >= 1) {
                        label = d / 1000 + " K";
                      }
                      if ((d / 1000000) >= 1) {
                        label = d / 1000000 + "m";
                      }       
                  return label;});

            //Create Y axis
            canvas.append("g")
                .attr("class", "totalYAxis")
                .attr("transform", "translate(" + yAxisPadding + ",20)")
                .call(yAxis);


              // CHANGE BAR GRAPH SVG GROUP
    var graphChangeDecreases = canvas.append("g")
        .attr("class","graphChangeDecreases");

    // ADD CHANGE GRAPH BARS
    graphChangeDecreases
          .selectAll("rect")
          .data(dataset)
          .enter()
          .append("rect")
          .attr("width",barWidth-3)
          .attr('height', function(d,i){ return scaleYChange(Math.abs(d[type][0].Decreases));  })
          .attr("y", function(d,i){
              return 185;
          })
          .attr("x", function(d,i){return yAxisPadding+(i)*barWidth+2;})
          .attr("fill", function(d,i){return graphDownColor;}) 
          .style("stroke",function(){return graphDownStrokeColor;})
.style("stroke-width", 1);

              // CHANGE BAR GRAPH SVG GROUP
    var graphChangeIncreases = canvas.append("g")
        .attr("class","graphChangeIncreases");

    // ADD CHANGE GRAPH BARS
    graphChangeIncreases
          .selectAll("rect")
          .data(dataset)
          .enter()
          .append("rect")
          .attr("width",barWidth-3)
          .attr('height', function(d,i){ return scaleYChange(Math.abs(d[type][0].Increases));  })
          .attr("y", function(d,i){
              return 183-scaleYChange(Math.abs(d[type][0].Increases));;
          })
          .attr("x", function(d,i){return yAxisPadding+(i)*barWidth+2;})
          .attr("fill", function(d,i){return graphUpColor;}) 
          .style("stroke",function(){return graphUpStrokeColor;})
.style("stroke-width", 1);


     // CHANGE BAR GRAPH OVERLAY - slide function
    var graphChangeOverlay = canvas.append("g")
        .attr("class","graphOverlay");

// CHANGE BAR GRAPH - MIDDLE AXIS
          graphChangeOverlay
          .append("line")
          .attr("x1",0+5)
          .attr("x2",width-5)
          .attr("y1", 210+changeGraphYOffset+7)
          .attr("y2", 210+changeGraphYOffset+7)
          .attr("stroke-width", 2)
          .attr("stroke", "rgba(0,0,0,0.1)");


    graphChangeOverlay
          .selectAll("rect")
          .data(dataset)
          .enter()
          .append("rect")
          .attr("class",function(d){return "graphChangeOverlay_"+d.year})
          .attr("width",barWidth)
          .attr('height', graphChangeHeight-15)
          .attr("y", 160+changeGraphYOffset+15)
          .attr("x", function(d,i){return yAxisPadding+(i)*barWidth;})
          .attr("fill", "rgba(0,0,0,0.04)")
          .style("z-index", 50)
          .on("mouseover", function(d){
                 if(graphSelectedBar==0){

                canvas.selectAll(".graphTotalOverlay_" + maxYear).attr("filter", "null");
                canvas.selectAll(".graphTotalOverlay_" + maxYear).attr("fill", "rgba(20,20,30,0.04)");
                canvas.selectAll(".graphChangeOverlay_" + maxYear).attr("filter", "null");
                canvas.selectAll(".graphChangeOverlay_" + maxYear).attr("fill", "rgba(20,20,30,0.04)");

                selectedYear = d.year;
            sliderChange(selectedYear);
            totalOrGraph = 1;
              d3.select(this).attr("filter", "url(#innershadow)");
              d3.select(this).attr("fill", "rgba(20,20,30,0.15)");
              yearOver(selectedYear);  

                  if(selectedYear!=maxYear){
    d3.selectAll(".y"+maxYear)
                .attr("fill", "#222222")
                .style("font-size", "6px")
                .style("font-weight", "normal");
                             canvas.selectAll(".graphTotalOverlay_" + maxYear).attr("filter", "null");
                canvas.selectAll(".graphTotalOverlay_" + maxYear).attr("fill", "rgba(20,20,30,0.04)");
}   
              }  

                        if(timer) {
      clearTimeout(timer);
      timer = null
    }  

              })
          .on("mouseout", function(d){
                 if(graphSelectedBar==0){
              selectedYear = d.year;
              d3.select(this).attr("filter", "null");
              d3.select(this).attr("fill", "rgba(0,0,0,0.04)");
              yearOut(selectedYear);
              if(timer) {clearTimeout(timer); timer = null;};
timer = setTimeout(function() {resetYear();}, 500);
            }})
          .on("click", function(d){
                if(graphSelectedBar==0){
                  totalOrGraph = 1;
                    graphSelectedBar=1
                    d3.select(this).attr("fill", "rgba(0,0,0,0.2)");
                    selectedYear = d.year;
                    sliderChange(selectedYear);
                }else{
                  
                    graphSelectedBar=0;

                    graphTotalOverlay
                      .selectAll("rect").attr("fill", "rgba(0,0,0,0.04)");

                    graphChangeOverlay
                      .selectAll("rect").attr("fill", "rgba(0,0,0,0.04)");

                    d3.select(this).attr("filter", "url(#innershadow)");
                    d3.select(this).attr("fill", "rgba(20,20,30,0.15)");
       
                    d3.selectAll(".y"+selectedYear).attr("fill", "#858585").style("font-size", "8px");
                  
                    d3.selectAll(".yearLabels").transition()
                      .duration(300)
                      .attr("fill", "#222222")
                      .style("font-size", "6px")
                      .style("font-weight", "normal");
                    selectedYear = d.year;
                    sliderChange(selectedYear);
                    yearOver(selectedYear); 
                }
          });
          



     // CHANGE BAR GRAPH Y AXIS

     //Define Y axis
            var yAxisChange = d3.svg.axis()
                  .scale(scaleYChangeAxis)
                  .orient("left")
                  .ticks(0)
                  .tickFormat(function (d) {
                    var label;
                      var label;
                    if(d==0){label = 0}

                     if ((d / 100) >= 1) {
                        label = d;
                      }
                      if ((d / 1000) >= 1) {
                        label = d / 1000 + " K";
                      }
                      if ((d / 1000000) >= 1) {
                        label = d / 1000000 + "m";
                      }       

                  return d;});

           // Create Y axis
           // canvas.append("g")
             //   .attr("class", "axis")
            //   .attr("transform", "translate(" + yAxisPadding + ",165)")
             //  .call(yAxisChange);

// GRAPH YEAR LABELS

graphTotal.selectAll("text")
    .data(dataset)
  .enter().append("text")
  .attr("class",function (d,i){return "yearLabels y"+d.year})
    .attr("x", function(d,i){return yAxisPadding+0+(i)*barWidth;})
    .attr("y", 107)
    .attr("dx", 8) // padding-right
    .attr("dy", ".35em") // vertical-align: middle
    .attr("text-anchor", "middle") // text-align: right
    .style("font-size", "6px")
    .attr("fill", "#222222")
    .text(function(d,i){ return d.year});


selectedYear = maxYear;
sliderTotal(selectedYear);
yearOver(selectedYear); 
  canvas.selectAll(".graphTotalOverlay_" + maxYear).attr("filter", "url(#innershadow)");
  canvas.selectAll(".graphTotalOverlay_" + maxYear).attr("fill", "rgba(20,20,30,0.15)");

$('#type').val("ASY");
changeType();

});


function yearOver(selectedYear){

d3.selectAll(".y"+selectedYear)
                  .attr("y", 107)
                  .attr("fill", "#c4c4c4")
                  .style("font-size", "12px")
                  .style("font-weight", "bold");  

}

function yearOut(selectedYear){
d3.selectAll(".y"+selectedYear).attr("fill", "#858585").style("font-size", "8px");
              d3.selectAll(".y"+selectedYear)
                .attr("y", 107)
                .attr("fill", "#222222")
                .style("font-size", "6px")
                .style("font-weight", "normal");

}

// MOUSE OVER COUNTRY
function mapMouseOver(d){
  var year = selectedYear-minYear;
  var type = $('#type').val();
  var countryCode = d.id;
  var countryName = d.properties.CNTRY_NAME;
  countryHovered = d.id;

  var refASYTotal = (dataset[year].ASY[0][countryCode]);
  if(refASYTotal>0){refASYTotal = numberWithCommas(refASYTotal)}else{refASYTotal="n/a"};
 if(year>0){var refASYChange = (dataset[year].ASY[0][countryCode]-dataset[year-1].ASY[0][countryCode]);} else { var refASYChange = "n/a";}
if (refASYChange>0){refASYChange = numberWithCommas(Math.abs(refASYChange)); $('#refASYChangeIcon').attr("class","changeSmallUp"); $('#refASYChangeYear').text(" increase since "+(selectedYear-1));}; 
if (refASYChange<0){refASYChange = numberWithCommas(Math.abs(refASYChange)); $('#refASYChangeIcon').attr("class","changeSmallDown"); $('#refASYChangeYear').text(" decrease since "+(selectedYear-1));};
if (refASYChange==0){refASYChange = "n/a"; $('#refASYChangeIcon').attr("class","changeSmallNone"); $('#refASYChangeYear').text(" no change since "+(selectedYear-1))}; 

$('#Country').text(countryName);
$('#refASYTitle').text("Refugees in "+countryName);
$('#refASYTotal').text(refASYTotal);
$('#refASYChange').text(refASYChange);

  var refORITotal = (dataset[year].ORI[0][countryCode]);
  if(refORITotal>0){refORITotal = numberWithCommas(refORITotal)}else{refORITotal="n/a"};
 if(year>0){var refORIChange = (dataset[year].ORI[0][countryCode]-dataset[year-1].ORI[0][countryCode]);} else { var refORIChange = "n/a";}
if (refORIChange>0){refORIChange = numberWithCommas(Math.abs(refORIChange)); $('#refORIChangeIcon').attr("class","changeSmallUp"); $('#refORIChangeYear').text(" increase since "+(selectedYear-1));}; 
if (refORIChange<0){refORIChange = numberWithCommas(Math.abs(refORIChange)); $('#refORIChangeIcon').attr("class","changeSmallDown"); $('#refORIChangeYear').text(" decrease since "+(selectedYear-1));};
if (refORIChange==0){refORIChange = "n/a"; $('#refORIChangeIcon').attr("class","changeSmallNone"); $('#refORIChangeYear').text(" no change since "+(selectedYear-1))}; 

$('#refORITitle').html("Refugees from "+countryName);
$('#refORITotal').text(refORITotal);
$('#refORIChange').text(refORIChange);

$('#thisYear').text(selectedYear);
  //console.log(dataset[year][type][0][countryCode]);
  if(dataset[year][type][0][countryCode]){var populationAsylum = numberWithCommas(dataset[year].ASY[0][countryCode])}else{var populationAsylum = "n/a"};
  $('#map_tooltip').html();
  $('#map_tooltip').text(d.properties.CNTRY_NAME);
  $('#map_tooltip').css("display","inline");

   // $('#map_info').html("<span style='font-size: 10px; font-weight: normal;'>Number of Refugees <b>from</b> "+d.properties.CNTRY_NAME+":</span><span style='font-size: 12px; font-weight: normal;'>"+(populationAsylum)+"</span>");


$('#mapinfo_text').css("display","block");


}

// MOUSE OUT COUNTRY
function mapMouseOut(d){
  countryHovered = 0;

  $('#map_tooltip').css("display","none");
}

// MOUSE CLICK COUNTRY
function mapMouseClick(d){

var type = $('#type').val();
var countryCode = d.properties.ISO1AL3;
$('#countryBox').text(d.properties.CNTRY_NAME);

countrySelectedName = d.properties.CNTRY_NAME;

var max = d3.max(dataset.map(function(d) {return d[type][0][countryCode];} ));
var maxChange = d3.max(dataset.map(function(d,i) {if(i>=1){return Math.abs(dataset[i][type][0][countryCode]-dataset[i-1][type][0][countryCode]);}} ));
  var scaleYTotalCountry = d3.scale.linear()
              .domain([0,max])
              .range([0,graphHeight-10]);

  var scaleYChangeCountry = d3.scale.linear()
              .domain([0,maxChange])
              .range([0,graphHeight/2-10]);

  var scaleYTotalAxis = d3.scale.linear()
              .domain([0,max])
              .range([graphHeight-10, 0]);



     //Define Y axis
            var yAxis = d3.svg.axis()
                  .scale(scaleYTotalAxis)
                  .orient("left")
                  .ticks(4)
                  .tickFormat(function (d) {
                    var label;
                    if(d==0){label = 0}

                     if ((d / 100) >= 1) {
                        label = d;
                      }
                      if ((d / 1000) >= 1) {
                        label = d / 1000 + "k";
                      }
                      if ((d / 1000000) >= 1) {
                        label = d / 1000000 + "m";
                      }                 
                  return label;});

            //Create Y axis
            canvas.selectAll(".totalYAxis")
                .transition().duration(1000).call(yAxis);

   canvas.selectAll(".graphTotal rect")
          .data(dataset)
         .transition()
          .attr('height', function(d,i){var type = $('#type').val(); return scaleYTotalCountry(d[type][0][countryCode])})
          .attr("y", function(d,i){var type = $('#type').val(); return graphHeight-scaleYTotalCountry(d[type][0][countryCode])-20})

            canvas.selectAll(".graphChangeIncreases rect")
          .data(dataset)
         .transition()
         .duration(700)
                .attr('height', function(d,i){var type = $('#type').val(); if(i>=1){prevValue=(dataset[i-1][type][0][countryCode]);
            return scaleYChangeCountry(Math.abs((d[type][0][countryCode])-prevValue));  }      
          })
          .attr("y", function(d,i){var type = $('#type').val(); if(i>=1){prevValue=(dataset[i-1][type][0][countryCode]);}
              var change = (d[type][0][countryCode])-prevValue;
              var changeAbs;
              if(change>=0){changeAbs=1;}else{changeAbs=-1};
             var height = scaleYChangeCountry(Math.abs((d[type][0][countryCode])-prevValue));
             if(changeAbs==1){return 210-height+changeGraphYOffset+5;}; // if a positive value
            if(changeAbs==-1){return 213+changeGraphYOffset+5;}; // if a positive value
          })
          .attr("fill", function(d,i){var type = $('#type').val(); if(i>=1){prevValue=(dataset[i-1][type][0][countryCode]);} if(((d[type][0][countryCode])-prevValue)>=0){return "#FC8D59";}
            else{return "#91CF60";}}); 
countrySelected = countryCode;

canvas.selectAll(".graphChangeDecreases rect")
          .data(dataset)
         .transition()
         .duration(700)
                .attr('height', function(d,i){var type = $('#type').val(); if(i>=1){prevValue=(dataset[i-1][type][0][countryCode]);
            return scaleYChangeCountry(Math.abs((d[type][0][countryCode])-prevValue));  }      
          })
          .attr("y", function(d,i){var type = $('#type').val(); if(i>=1){prevValue=(dataset[i-1][type][0][countryCode]);}
              var change = (d[type][0][countryCode])-prevValue;
              var changeAbs;
              if(change>=0){changeAbs=1;}else{changeAbs=-1};
             var height = scaleYChangeCountry(Math.abs((d[type][0][countryCode])-prevValue));
             if(changeAbs==1){return 210-height+changeGraphYOffset+5;}; // if a positive value
            if(changeAbs==-1){return 213+changeGraphYOffset+5;}; // if a positive value
          })
          .attr("fill", function(d,i){var type = $('#type').val(); if(i>=1){prevValue=(dataset[i-1][type][0][countryCode]);} if(((d[type][0][countryCode])-prevValue)>=0){return "#FC8D59";}
            else{return "#91CF60";}}); 
countrySelected = countryCode;

}

function yearUp(){
if(selectedYear<maxYear){
  if(totalOrGraph==1){var t = ".graphChangeOverlay_";}else{var t = ".graphTotalOverlay_";};
  canvas.selectAll(t+selectedYear).attr("filter", "null");
  canvas.selectAll(t+selectedYear).attr("fill", "rgba(20,20,30,0.04)");
  canvas.selectAll(t+(selectedYear+1)).attr("filter", "url(#innershadow)");
  canvas.selectAll(t+(selectedYear+1)).attr("fill", "rgba(20,20,30,0.15)");
  graphSelectedBar = 1;
  yearOver(selectedYear+1);
  yearOut(selectedYear);
selectedYear = selectedYear + 1;
changeType();

}
}

function yearDown(){

  if(selectedYear>minYear){
      if(totalOrGraph==1){var t = ".graphChangeOverlay_";}else{var t = ".graphTotalOverlay_";};
  canvas.selectAll(t+selectedYear).attr("filter", "null");
  canvas.selectAll(t+selectedYear).attr("fill", "rgba(20,20,30,0.04)");
  canvas.selectAll(t+(selectedYear-1)).attr("filter", "url(#innershadow)");
  canvas.selectAll(t+(selectedYear-1)).attr("fill", "rgba(20,20,30,0.15)");
    graphSelectedBar = 1;
      yearOver(selectedYear-1);
  yearOut(selectedYear);
  selectedYear = selectedYear - 1;
  changeType();
}
}

              function resetYear() {
                selectedYear = maxYear;
                yearOver(maxYear);
                 if(totalOrGraph==1)
                  {
                canvas.selectAll(".graphChangeOverlay_" + maxYear).attr("filter", "url(#innershadow)");
                canvas.selectAll(".graphChangeOverlay_" + maxYear).attr("fill", "rgba(20,20,30,0.15)");
                       sliderChange(maxYear);
                 }else{

                canvas.selectAll(".graphTotalOverlay_" + maxYear).attr("filter", "url(#innershadow)");
                canvas.selectAll(".graphTotalOverlay_" + maxYear).attr("fill", "rgba(20,20,30,0.15)");
                       sliderTotal(maxYear);
              }
              }

// SLIDER TOTAL FUNCTION
function sliderTotal(year){
  var year = selectedYear-minYear;
  var type = $('#type').val();

sliderAll(selectedYear);
    canvas.selectAll(".country")    
    .style("display","block")                                  
        .filter(function(d) { return (d.properties.COWSYEAR > selectedYear)||(d.properties.COWEYEAR + 1 <= selectedYear)})        // <== This line
            .style("display", "none");   


    if(type=="ASY"){
        $('#totalASYkey').css('display',"block");
        $('#totalORIkey').css('display',"none");
        $('#changekey').css('display',"none");

          var state = d3.selectAll('.country')
          .style('fill', function(d){
                var countryCode = d.id;              
var result1 = dataset[year][type][0][countryCode];

                                if(countryCode!=countrySelected){
                                  if(result1==0){return "lightgrey" }else { return colorTotalASY(result1)};
              } else { return selectedCountryColor;}

                });
    }

 if(type=="ORI"){
        $('#totalASYkey').css('display',"none");
        $('#totalORIkey').css('display',"block");
        $('#changekey').css('display',"none");

          var state = d3.selectAll('.country')
          .style('fill', function(d){
                            var countryCode = d.id;              
var result1 = dataset[year][type][0][countryCode];
                

                                if(countryCode!=countrySelected){
            if(result1==0){return "lightgrey";}else { return colorTotalORI(result1);};
              } else { return selectedCountryColor;}

                });
    }
}

  canvas.append("text").text(maxYear);

function sliderActiveYear(year){
  var activeYear = year + minYear;
}

// SLIDER CHANGE FUNCTION
function sliderChange(year){
  var year = selectedYear-minYear;
  var type = $('#type').val();
sliderAll(selectedYear);
sliderActiveYear(year);


    canvas.selectAll(".country")    
    .style("display","block")                                  
        .filter(function(d) { return (d.properties.COWSYEAR > selectedYear)||(d.properties.COWEYEAR +1 <= selectedYear)})        // <== This line
            .style("display", "none");  

   $('#totalASYkey').css('display',"none");
        $('#totalORIkey').css('display',"none");
        $('#changekey').css('display',"block");

    if(type=="ASY"){
          var state = d3.selectAll('.country')
          .style('fill', function(d,i){
                var countryCode = d.id;
                var result = dataset[year][type][0][countryCode] - dataset[year-1][type][0][countryCode];
                if(countryCode!=countrySelected){
if(result==0){return "lightgrey"}else { return colorChangeASY(-result);}

              } else { return selectedCountryColor;}
                });
    }

 if(type=="ORI"){
          var state = d3.selectAll('.country')
          .style('fill', function(d){
                var countryCode = d.id;
                 var result = dataset[year][type][0][countryCode] - dataset[year-1][type][0][countryCode];
                 if(countryCode!=countrySelected){
               if(result==0){return "lightgrey"}else { return colorChangeASY(-result);}
              }
               else { return selectedCountryColor;}
                });
    }
}

// SLIDER ALL FUNCTION
function sliderAll(year){
  var year = selectedYear-minYear;
  var type = $('#type').val();
  if(countrySelected!=0){var q = countrySelected} else {var q = "Total";};

var totalValue = numberWithCommas(dataset[year][type][0][q]);
if(totalValue == 0){totalValue = "n/a"};

if(selectedYear==maxYear){$("#yearUp").css("opacity", "0.2");}else{$("#yearUp").css("opacity", "1");};
if(selectedYear==minYear){$("#yearDown").css("opacity", "0.2");}else{$("#yearDown").css("opacity", "1");};

if(q=="Total"){
if(year>0){
  var increases = (dataset[year][type][0]["Increases"]); 
    var decreases = (dataset[year][type][0]["Decreases"]);
  }else{
    var decreases = "n/a";var increases = "n/a";
  };

increases = numberWithCommas(Math.abs(increases));
if(increases == 0){increases = "n/a"}

decreases = numberWithCommas(Math.abs(decreases));
if(decreases == 0){decreases = "n/a"}

if(selectedYear>minYear){$('#increaseValue').text(increases);}else{$('#increaseValue').text("n/a");}
if(selectedYear>minYear){$('#decreaseValue').text(decreases);}else{$('#decreaseValue').text("n/a");}

}

else {

if(year>0){
  var increases = (dataset[year][type][0]["Increases"]); 
    var decreases = (dataset[year][type][0]["Decreases"]);
  }else{
    var decreases = "n/a";var increases = "n/a";
  };

var changeValue = dataset[year][type][0][q]-dataset[year-1][type][0][q];

if (changeValue < 0){
if(selectedYear>minYear){$('#decreaseValue').text(numberWithCommas(Math.abs(changeValue))); $('#increaseValue').text("n/a");}else{$('#decreaseValue').text("n/a");$('#increaseValue').text("n/a");}
}

if (changeValue > 0){
if(selectedYear>minYear){$('#increaseValue').text(numberWithCommas(Math.abs(changeValue))); $('#decreaseValue').text("n/a");}else{$('#increaseValue').text("n/a");$('#decreaseValue').text("n/a");}
}

}


$('#totalValue').text(totalValue);




$('#yearBox').text(selectedYear);


 var year = selectedYear-minYear;
  var type = $('#type').val();
  var countryCode = countrySelected;
  var countryName = countrySelectedName;

  if(countrySelected==0){ countryName = 'No Country Selected'; $('#mapinfo_text').css("display","none");} else {$('#mapinfo_text').css("display","block");};
  
  var refASYTotal = (dataset[year].ASY[0][countryCode]);
  if(refASYTotal>0){refASYTotal = numberWithCommas(refASYTotal)}else{refASYTotal="n/a"};
 if(year>0){var refASYChange = (dataset[year].ASY[0][countryCode]-dataset[year-1].ASY[0][countryCode]);} else { var refASYChange = "n/a";}
if (refASYChange>0){refASYChange = numberWithCommas(Math.abs(refASYChange)); $('#refASYChangeIcon').attr("class","changeSmallUp"); $('#refASYChangeYear').text(" increase since "+(selectedYear-1));}; 
if (refASYChange<0){refASYChange = numberWithCommas(Math.abs(refASYChange)); $('#refASYChangeIcon').attr("class","changeSmallDown"); $('#refASYChangeYear').text(" decrease since "+(selectedYear-1));};
if (refASYChange==0){refASYChange = "n/a"; $('#refASYChangeIcon').attr("class","changeSmallNone"); $('#refASYChangeYear').text(" no change since "+(selectedYear-1))}; 

$('#Country').text(countryName);
$('#refASYTitle').text("Refugees in "+countryName);
$('#refASYTotal').text(refASYTotal);
$('#refASYChange').text(refASYChange);

  var refORITotal = (dataset[year].ORI[0][countryCode]);
  if(refORITotal>0){refORITotal = numberWithCommas(refORITotal)}else{refORITotal="n/a"};
 if(year>0){var refORIChange = (dataset[year].ORI[0][countryCode]-dataset[year-1].ORI[0][countryCode]);} else { var refORIChange = "n/a";}
if (refORIChange>0){refORIChange = numberWithCommas(Math.abs(refORIChange)); $('#refORIChangeIcon').attr("class","changeSmallUp"); $('#refORIChangeYear').text(" increase since "+(selectedYear-1));}; 
if (refORIChange<0){refORIChange = numberWithCommas(Math.abs(refORIChange)); $('#refORIChangeIcon').attr("class","changeSmallDown"); $('#refORIChangeYear').text(" decrease since "+(selectedYear-1));};
if (refORIChange==0){refORIChange = "n/a"; $('#refORIChangeIcon').attr("class","changeSmallNone"); $('#refORIChangeYear').text(" no change since "+(selectedYear-1))}; 

$('#refORITitle').html("Refugees from "+countryName);
$('#refORITotal').text(refORITotal);
$('#refORIChange').text(refORIChange);


}

function switchChange() {

var getwidth = 0;
var getx =0;
var dur = 200;

if($('#type').val()=="ORI")
  {

     canvas.selectAll(".graphTotal rect")
.attr("transform", "scale(0.5,1,1)");

      canvas.selectAll(".graphTotal rect")
      .transition()
      .duration(dur)
      .delay(function(d, i) { return i * 2; })
      .attr("width", function(){getwidth = Number(d3.select(this).attr("width")); return 0});

 canvas.selectAll(".graphTotal rect").transition()
 .duration(0)
 .delay(dur)
.attr("fill", asylumColor);

        canvas.selectAll(".graphTotal rect")
      .transition()
      .delay(function(d, i) { return dur+ (i * 2); })
      .duration(200)
      .attr("width", getwidth);

    $('#type').val("ASY");
    $('#switch').attr("class","switchASY");
$('#switchORI').attr("class","switchInactive");
$('#switchASY').attr("class","switchActive");
  }else{

  

        canvas.selectAll(".graphTotal rect")
      .transition()
      .delay(function(d, i) { return dur+ (i * 9); })
      .duration(0)
      .attr("fill", originColor);

       canvas.selectAll(".graphTotal rect")
    $('#type').val("ORI");
$('#switch').attr("class","switchORI");
$('#switchORI').attr("class","switchActive");
$('#switchASY').attr("class","switchInactive");
  };
changeType();
}

function changeType(handler){
  if(totalOrGraph==1){sliderChange(selectedYear, handler)}else{sliderTotal(selectedYear, handler)};


  var type = $('#type').val();
  if(countrySelected!=0){
var countryCode = countrySelected;
var max = d3.max(dataset.map(function(d) {return d[type][0][countryCode];} ));
var maxChange = d3.max(dataset.map(function(d,i) {if(i>=1){return Math.abs(dataset[i][type][0][countryCode]-dataset[i-1][type][0][countryCode]);}} ));
  var scaleYTotalCountry = d3.scale.linear()
              .domain([0,max])
              .range([0,graphHeight-10]);

  var scaleYChangeCountry = d3.scale.linear()
              .domain([0,maxChange])
              .range([0,graphHeight/2-10]);


   canvas.selectAll(".graphTotal rect")
          .data(dataset)
         .transition()
         .duration(700)
      // .delay(function(d, i) { return i * 50; })
          .attr('height', function(d,i){var type = $('#type').val(); return scaleYTotalCountry(d[type][0][countryCode])})
          .attr("y", function(d,i){var type = $('#type').val(); return graphHeight-scaleYTotalCountry(d[type][0][countryCode])+10})

            canvas.selectAll(".graphChange rect")
          .data(dataset)
         .transition()
.duration(1600)
                .attr('height', function(d,i){var type = $('#type').val(); if(i>=1){prevValue=(dataset[i-1][type][0][countryCode]);
            return scaleYChangeCountry(Math.abs((d[type][0][countryCode])-prevValue));  }      
          })
          .attr("y", function(d,i){var type = $('#type').val(); if(i>=1){prevValue=(dataset[i-1][type][0][countryCode]);}
              var change = (d[type][0][countryCode])-prevValue;
              var changeAbs;
              if(change>=0){changeAbs=1;}else{changeAbs=-1};
             var height = scaleYChangeCountry(Math.abs((d[type][0][countryCode])-prevValue));
             if(changeAbs==1){return 220-height+changeGraphYOffset-2;}; // if a positive value
            if(changeAbs==-1){return 223+changeGraphYOffset-2;}; // if a positive value
          })
          .attr("fill", function(d,i){var type = $('#type').val(); if(i>=1){prevValue=(dataset[i-1][type][0][countryCode]);} if(((d[type][0][countryCode])-prevValue)>=0){return "#FC8D59";}
            else{return "#91CF60";}})

    ; 


}


}

// COUNTRY MAP TOOLTIP FUNCTION
$("#map").mousemove(function(e) {
    var x_offset = -220;
    var y_offset = -310;
    $('#map_tooltip').css('left', e.pageX + x_offset).css('top', e.pageY + y_offset);
});


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}



/*
var dataset = [14,6,30,60];

var svg = d3.select("svg");

var circles = svg.selectAll("circle")
  .data(dataset)
  .enter()
  .append("circle");

circles
      .attr("cx", function(d,i){return (i+1)*50})
      .attr("r", function(d,i){return d})
      .attr("cy", 90)
      .attr("opacity", 0.4)
      .style("stroke", "blue")
      .style("stroke-width", "3")
      .style("fill", "green");



 var paper = new Raphael(document.getElementById('map'), 1200, 900);
    var worldProjection = d3.geo.equirectangular()
          .scale(150)
          .translate([530,280]);
 
  var border_color = "#FFFFFF";
        var unselected_color = "#BDBDBD";
        var selected_color = "#999";

     $.getJSON("js/world.geojson", function(data) {
            svg_borders = {};
            world_bg = {};
            countryant = "";
            $.each(data["features"], function(idx,feature) {
                country = feature.properties.CNTRY_NAME;
                startYear = feature.properties.COWSYEAR;
                endYear = feature.properties.COWEYEAR;
                if (country != countryant) {
                    countryant = country;
                    svg_borders[country]=[];
                    world_bg[country]=[];
                }
                var polygons;
                polygons = [];
                if (feature.geometry.type == "MultiPolygon") {
                    polygons = feature.geometry.coordinates;
                } else { // Single polygon
                    polygons[0] = feature.geometry.coordinates;
                }

                $.each(polygons, function (idxpolygon, polygon) {
                    $.each (polygon, function (idxline, geojson_line) {
                        var line;
                        var i;
                        var str_line = "M ";
                        for (var i=0, l=geojson_line.length;i<l;i+=1) {
                            if (i> 0) str_line += " L "
                            xy = worldProjection(geojson_line[i]); 
                            str_line += xy[0] + " " + xy[1];
                        }
                     //   str_line += " Z";
                        line = paper.path(str_line);
                        line.attr({stroke:border_color,'stroke-width':0,'fill':selected_color});
                        line.startYear=1900;
                        line.endYear=maxYear;
                        line.id="bg";
                        svg_borders[country].push(line);
                       // world_bg[country].toBack();
                    });
                });

                $.each(polygons, function (idxpolygon, polygon) {
                    $.each (polygon, function (idxline, geojson_line) {
                        var line;
                        var i;
                        var str_line = "M ";
                        for (var i=0, l=geojson_line.length;i<l;i+=1) {
                            if (i> 0) str_line += " L "
                            xy = worldProjection(geojson_line[i]); 
                            str_line += xy[0] + " " + xy[1];
                        }
                        str_line += " Z";
                        line = paper.path(str_line);
                        line.attr({stroke:border_color,'stroke-width':0.5,'fill':unselected_color});
                        line.country=country;
                        line.id=country;
                        line.startYear=startYear;
                        line.endYear=endYear;
                        $(line.node).click( get_click_handler(country));
                        $(line.node).mousemove( get_over_handler(country, startYear, endYear));
                        $(line.node).mouseout( get_out_handler(country));
                        svg_borders[country].push(line);
                    });
                });



            });
        });

function test(){

         //    var test = paper.getById('Greenland').start;


     paper.forEach(function(element) {
      var yearStart = element.startYear;
      if(yearStart<1980){
        //alert(element.start);
element.hide();
      }


});
        
}


        function get_click_handler(country){
            return function(){
                //previousCountry = currentCountry;
                //currentCountry = country;
                //redraw();
                              //  window.location.href = "/maps/map.php?country=" + codes[country];
                            }
        }


function get_over_handler(country, startYear, endYear){
            return function(event){
                color_country(country,selected_color);

                var country_name =  $("#country_name_popup");
                country_name.empty();
                country_name.append("<span id='popup_country_name'> " + country + " (" +startYear +"->"+endYear + "</span><table width='100%'>");
                country_name.css("display","block");
                var canvasContainer = $("#container");
                var canvasTop = canvasContainer.offset().top;
                var canvasLeft = canvasContainer.offset().left;
                country_name.css("top",event.clientY+10);
                country_name.css("left",event.clientX+30);
            }
        }

                function get_out_handler(country){
            return function(event){
                var found=false;
                var i;
                var l;
                var country_name = $("#country_name_popup");
                country_name.css("display","none");
                color_country(country,unselected_color);
            }
        }

        function color_country(country,color,strokeColor)
        {
            var i;
            var l;
            if (svg_borders.hasOwnProperty(country))
                for (i=0, l= svg_borders[country].length;i<l;i++)
                {
                    if (strokeColor)
                        svg_borders[country][i].animate({"fill":color,"stroke":strokeColor,"stroke-width":2},333);
                    else
                        svg_borders[country][i].animate({"fill":color,"stroke":border_color,"stroke-width":1},333);
                }
        }
*/