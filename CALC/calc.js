/***** TEST BED APP CODE  ***/
/*
document.addEventListener('DOMContentLoaded', function() {
   setTimeout(function(){initApp();},1000);
});
*/
/***** TEST BED APP CODE ENDS ******/



/***** HALLWAY APP CODE  ******/
initApp();
///***** HALLWAY APP CODE ENDS ******/

// Bootstrap the CALC App
function initApp(){


  var element = angular.element(document.getElementById('my-app'));
  angular.element(element).ready(function() {
    var hallway = angular.element(document.getElementById('hallway-app'));
    element.injector().invoke(function($compile) {
      $scope = element.scope();
      var httpService = element.injector().get('$http');
      var timeoutService = element.injector().get('$timeout');
      var AGService = element.injector().get('AGService');
      var DataService = element.injector().get('DataService');

      registerScopeAndServices($scope, httpService, timeoutService,AGService,DataService);
      //registerScopeAndServices($scope, httpService, timeoutService);
      $compile(hallway.contents())($scope);
    });
  });  
}


// Registring additional services to use in the APP
var timeout;
var http;
var dataSvc;

function registerScopeAndServices($scope, httpService, timeoutService,AGService,DataService){  
//function registerScopeAndServices($scope, httpService, timeoutService){
  var theUrl = 'https://api.data.gov/gsa/calc/rates/?format=json&histogram=12&sort=current_price&query_type=match_all&min_experience=0&max_experience=45&contract-year=current&experience_range=0%2C45';
  //if(AGService)
   AGService.data.footer.visible = false;
  $scope.query_type="match_all";
  $scope.searchText = "";
  $scope.URL = "";
  $scope.selected = undefined;
  $scope.labor_category = "";

  $scope.sortType     = 'current_price'; // set the default sort type
  $scope.sortDescending  = false;  // set the default sort order

  $scope.excludedList = []; //set the empty excludeList
  
  $scope.selectedItemsList = [];
  $scope.eduFilterList =[];

  $scope.eduExpanded = false;
  $scope.expExpanded = false;
  $scope.workExpanded = false;
  $scope.busExpanded = false;
  $scope.sinExpanded = false;
  $scope.contExpanded = false;
  
  $scope.FILTERS = [];
  
  $scope.csvDownloadAnchorLink="";


  timeout = timeoutService;
  http = httpService;
  dataSvc = DataService;

  registerClickEvents($scope);
  $scope.resetDefaultFilterValue("-1");
  getRatesByDefaultSearch($scope);

  console.log('painting graph');


  $scope.chart = Highcharts.chart('container', {

        chart:{
          type: 'column'
        },

        title: {
            text: 'Hourly rate data'
        },

         legend: {
            enabled: false
        },

        xAxis:{
            
            startOnTick: true,
            tickLength: 10,
            title: {
                  //margin: 10,
                  text: 'Ceiling price (hourly rate) in $'
               },
            labels: {
                  tickmarkPlacement: 'on',
                  useHTML: true,
                  formatter:function(){
                   return this.value.toString().replace('\n','<br/>')
                  },
                  style: {
                    fontSize:'10px',
                    fontWeight:'normal'
                  }
               }
        },   

        yAxis:{

            min: 0,
            title: {
                  //margin: 10,
                  text: '# of results'
               }
        },

        credits: {
              
            enabled: false
        },
       
        exporting: {
          allowHTML: true,
          enabled: true,
          buttons: {
            contextButton: {
                menuItems: [{
                  text: 'Print chart',
                  onclick: function () {
                  this.print();
                  }
                }, {
                separator: true
                },{
                    text: 'Download PNG image',
                    onclick: function () {
                        this.exportChart({
                            
                        });
                      dataSvc.trackEvent('Download PNG', "chart.png" , {pointOfOccurence: 'CALC', category :'CALC'});
  
                    }
                },{
                    text: 'Download JPEG image',
                    onclick: function () {
                        this.exportChart({
                            type: 'image/jpeg'
                        });
                      dataSvc.trackEvent('Download JPEG', "chart.jpeg" , {pointOfOccurence: 'CALC', category :'CALC'});

                    }
                },{
                    text: 'Download PDF document',
                    onclick: function () {
                        this.exportChart({
                            type: 'application/pdf'
                        });
                      dataSvc.trackEvent('Download PDF', "chart.pdf" , {pointOfOccurence: 'CALC', category :'CALC'});

                    },
                    separator: false
                }]
            }
        }
    },
    
    tooltip: {
        shared: false,
        followPointer: true,
        formatter: function() {
            var text = '';
            if(this.series.name == 'Hourly rate Data') {
                text = '<b>' + this.y + ' </b> results from $' + this.point.min + ' to $'+ this.point.max;

            } 
            if(this.series.name == 'Average') {
                text = ' Average - $ <b>' + $scope.average + '</b>';
            }
            return text;
        }
    },
       
    plotOptions: {
          column: {
            pointPadding: 0.01,
            borderWidth: 0,
            groupPadding: 0.01,
            maxPointWidth: 50
          },

          series: {
              color: '#3A7E91'
          }
        },
       
        series: [{
          type:"column",
          name: "Hourly rate Data",
          data: [0]
        }]

    });
  
  

  $scope.hoverIn = function(){
        this.years = true;
    };

  $scope.hoverOut = function(){
        this.years = false;
    };
  
  dataSvc.trackEvent('CALC Access', 'Tools Menu', {pointOfOccurence: 'Gateway', category :'CALC'});

  $scope.fetchCategories = function(searchStr){
    console.log("Fetch categories, searchstr is " + searchStr);
    return getCategoriesByKeyword($scope, searchStr);
    /*if(typeof searchStr === 'string'){
      return getCategoriesByKeyword($scope, searchStr);
    }else{
      $scope.labor_category = searchStr.labor_category;
      return getCategoriesByKeyword($scope, searchStr.labor_category);
    }*/
    
    
  };

  $scope.fetchCategorySelected = function(){
    //console.log('fetchCategorySelected');
    //console.log('Search text is --' + $scope.searchText);
    //console.log('Search labor_category is --' + $scope.labor_category);
    //console.log($scope.labor_category);
    if(typeof $scope.labor_category === 'object' ){
      $scope.labor_category = $scope.labor_category.labor_category;
      timeout(function(){
        getRatesByKeywordSearch($scope.labor_category, $scope);
        //$scope.labor_category = $scope.labor_category + ', ';
      });
      
    }
  };

  $scope.processCategorySelectionKeyEvents = function($event){
    var keyCode = $event.which || $event.keyCode;
    if (keyCode === 13) {
        $scope.searchText = document.getElementById("category_search").value;
        console.log("Search text is:" + $scope.searchText);
        getRatesByKeywordSearch($scope.searchText, $scope);
    }

  };

  $scope.sortByCategoryKeyEvent = function($event, sortType){
    var keyCode = $event.which || $event.keyCode;

    if (keyCode === 13) {
        $scope.sortRates(sortType);
    }

  };

  $scope.collapseExpandKeyEvent = function($event){
    var keyCode = $event.which || $event.keyCode;

    if (keyCode === 13) {
        $scope.eduExpanded=!$scope.eduExpanded;
    }
  };
  
  $scope.removeFilterKeyEvent = function($event,categoryKey, filterKey, filterScopeRef){
    var keyCode = $event.which || $event.keyCode;

    if (keyCode === 13) {
        $scope.removeFilter(categoryKey, filterKey, filterScopeRef);
    }
  };


  $scope.updateSelectedItemsKeyEvent = function($event, filterCategory, selectedItem, filterName, filterScopeRef){
    var keyCode = $event.which || $event.keyCode;

    if (keyCode === 13) {
        $scope.updateSelectedItems(filterCategory, selectedItem, filterName, filterScopeRef);
    }

  };

  $scope.computeHref = function(){
    return document.URL + '#searchTable';
  };

  
}

function replaceSearchString(labor_category, category_search){
  var catArr = category_search.split(",");
  catArr.splice(catArr.length - 1, 1, labor_category);
  cat = "";
  catArr.forEach(function(item, index){
    if(index == catArr.length -1 && index > 1)
      cat = cat + item;
    else
      cat = cat + item + ", ";
  });
  return cat;
}

function registerClickEvents($scope){
  $scope.doClick = function(val) {
            //console.log('you clicked on "' + val + '"');
            switch (val) {

                case 'about':
                  alert('This is a magic article implemenation of the Professional Services CALC tool.');
                  break;

                case 'search':
                  dataSvc.trackEvent('Labor Category Search' , $scope.labor_category,{pointOfOccurence: 'CALC', category :'CALC'});
                  timeout(function(){
                    getRatesByKeywordSearch($scope.labor_category, $scope);
                    //$scope.labor_category = $scope.labor_category + ', ';
                  });

                  break;

                case 'clear':    
                  dataSvc.trackEvent('Clear Search', 'Clear Search' , {pointOfOccurence: 'CALC', category :'CALC'});
                  console.log($scope.query_type);
                  document.getElementById("query_type_match_all").checked = true;
                  $scope.query_type = "match_all";
                  $scope.sortType = "current_price";
                  $scope.sortDescending = false;
                  $scope.labor_category = "";
                  $scope.excludedList=[];
                  //$scope.eduFilterList=[];
                  //$scope.selectedItemsList=[];
                  $scope.workSite="";
                  $scope.busSize="";
                  $scope.schedule="";
                  $scope.minExp=0;
                  $scope.maxExp=45;
                  $scope.contractYear = "current_price";
                  $scope.FILTERS=[];
                  timeout(function(){
                    getRatesByDefaultSearch($scope);
                  });
                  
                  
                  break;

                case 'log':
                  d3_log($scope.rates);
                  break;

                case 'query_type_change':
                    if($scope.query_type=="match_all")
                      dataSvc.trackEvent('Search Criteria' , "Search Type:"+ "Contains Words" , {pointOfOccurence: 'CALC', category :'CALC'});
                    
                    if($scope.query_type=="match_exact")
                      dataSvc.trackEvent('Search Criteria' , "Search Type:"+ "Exact Match" , {pointOfOccurence: 'CALC', category :'CALC'});

                    getRatesByKeywordSearch($scope.labor_category, $scope);
                  break;

                case 'debug':
                  if (window.confirm("Do you want to activate debugging?")) {
                    //console.log("debugger engaged");
                    debugger;
                  } else {
                    //console.log("debugger request cancelled");
                  }
                  break;

                default:
                  //alert('you clicked on "' + val + '"');
                  break;
            }
        };

    $scope.range = function(start,end) {
      var rangeList = [];
      for (var i = start; i <= end; i++) {
            rangeList.push(i);
        }
      return rangeList;
    };

    $scope.updateSelectedItems = function(filterCategory, selectedItem, filterName, filterScopeRef){
      var eventAction = 'Select Filters ';
      var eventLable = getCategoryName(filterCategory);
      var data = "";
      if(filterScopeRef){
        if(filterName && filterName != '')
          data = filterName + " : " + filterScopeRef;
        else
          data = filterScopeRef;
      }else{
        data = filterName;
      }
      dataSvc.trackEvent(eventAction,eventLable,{pointOfOccurence: 'CALC', category :'CALC',data:data});

      registerFilter(filterCategory, selectedItem, filterName, filterScopeRef);
      getRatesByKeywordSearch($scope.labor_category,$scope);
      /*
      switch (selectedItem) {

        case "HS":

        case "AA":

        case "BA":

        case "MA":

        case "PHD": //implement multiselect check boxes.
                    //console.log("clicked Item is" + selectedItem);
                    if ($scope.selectedItemsList.indexOf(selectedItem)>=0)
                    {
                      $scope.selectedItemsList.splice($scope.selectedItemsList.indexOf(selectedItem),1);
                        if($scope.eduFilterList.indexOf(selectedItem)>=0)
                          $scope.eduFilterList.splice($scope.eduFilterList.indexOf(selectedItem),1);
                    }
                    else {
                          $scope.selectedItemsList.push(selectedItem);
                          //console.log("selected Item List is " + $scope.selectedItemsList);
                          //getFilteredRates($scope);
                          if (selectedItem == "HS"||selectedItem == "AA"||selectedItem == "BA"||selectedItem == "MA"||selectedItem=="PHD") 
                            //then use those values for url;
                            { 
                              //console.log("New Item List is " + $scope.selectedItemsList);
                              if ($scope.selectedItemsList.indexOf(selectedItem)>=0)
                              {
                                $scope.eduFilterList.push(selectedItem);
                                //console.log("selected education List is " + $scope.eduFilterList);
                              }
                            }
                          }      
                    //console.log("selected education List is " + $scope.eduFilterList);
                    getRatesByKeywordSearch($scope.labor_category,$scope);
                    break;
          default:
                  //console.log("selected Item is " + selectedItem);
                  $scope.selectedItemsList.push(selectedItem);
                  //console.log("selected Item List is " + $scope.selectedItemsList);
                  getRatesByKeywordSearch($scope.labor_category,$scope);

        }//end switch
       */
      }//end updateSelectedItems

    $scope.removeFilter = function(categoryKey, filterKey, filterScopeRef){
      removeFilter(categoryKey, filterKey, filterScopeRef);
      
      dataSvc.trackEvent('Select Filters ','Remove Filter ',{pointOfOccurence: 'CALC', category :'CALC',data:getCategoryName(categoryKey)});
      $scope.resetDefaultFilterValue(filterKey);
      getRatesByKeywordSearch($scope.labor_category,$scope);
    }

    $scope.checkCategoryExists = function(categoryKey){
      return checkCategoryExists(categoryKey);
    }

    $scope.checkFilterExists = function(categoryKey, filterKey){
      return checkFilterExists(categoryKey, filterKey);
    }

    $scope.setDefaultFilterValue = function(filterKey, filterScopeRef, defaultValue){
      $scope.defaultValues.push({a:filterKey, b:filterScopeRef, c:defaultValue});
    }

    $scope.resetDefaultFilterValue = function(filterKey){
      var DEF_MIN_EXP = 0;
      var DEF_MAX_EXP = 45;
      var DEF_WORK_SITE = "";
      var DEF_BIZ_SIZE = "";
      var DEF_SIN_SCH = "";
      var DEF_CONT_YR = "current_price";
      switch (filterKey) {

      case "HS":

      case "AA":

      case "BA":

      case "MA":

      case "PHD":
                  break;
      case "MIN":
        $scope.minExp = DEF_MIN_EXP; 
          break;

      case "MAX":
        $scope.maxExp = DEF_MAX_EXP;
          break;

      case "WS":
        $scope.workSite = DEF_WORK_SITE;
        break;

      case "BIZSZ":
        $scope.busSize = DEF_BIZ_SIZE;
        break;

      case "SIN":
        $scope.schedule = DEF_SIN_SCH;
        break;

      case "CY":
        $scope.contractYear = DEF_CONT_YR;
        break;

      default:
        $scope.minExp = DEF_MIN_EXP;
        $scope.maxExp = DEF_MAX_EXP;
        $scope.contractYear = DEF_CONT_YR;
        break;
      }
    }

    $scope.setBusinessSizeString = function (key){
      var str = ""
      switch(key){
        case 's':
          str = 'Small business';
          break;
        case 'o':
          str = 'Other than small';
          break;
      }
      $scope.updateSelectedItems('BIZSZ','BIZSZ','', str);
    }

    $scope.swapPrice = function(year){
      //console.log('called swapPrice with value ' + year);
      var data = '';
      if(year == 'current_price'){
        data = 'Current Price';
        removeFilter('CY', 'CY', 'Current Price');
      }else if(year == 'next_year_price'){
        data = 'Next Year Price';
        registerFilter('CY','CY','','Next Year Price');
      }else if(year == 'second_year_price'){
        data = 'Second Year Price';
        registerFilter('CY','CY','', 'Second Year Price');
      }

      dataSvc.trackEvent('Select Filters ','Contract Year',{pointOfOccurence: 'CALC', category :'CALC',data:data});

      $scope.rates.results.forEach(
            function(rate, index){

              //rate.price = rate. <year>
              if(year == 'current_price'){
                rate.price = rate.current_price;
              }else if(year == 'next_year_price'){
                rate.price = rate.next_year_price;
              }else{
                rate.price = rate.second_year_price;
              }
            }
        );
      }
/*$timeout(function() {
            if(typeof(response['error']) !== 'undefined'){
                // If the google api sent us an error, reject the promise.
                deferred.reject(response);
            }else{
                // Resolve the promise with the whole response if ok.
                deferred.resolve(response);
            }
        });
*/
    $scope.exportData = function(){
      //return "https://api.data.gov/gsa/calc/rates/csv/?min_experience=0&max_experience=45&sort=current_price&query_type=match_all&experience_range=0,45"; 
      //timeout(function(){
        var categories = '';
        $scope.FILTERS.forEach(function(category, index){
          if(index == 0)
            categories = category.categoryDisplayName;
          else
            categories = categories + ', ' +category.categoryDisplayName;
        });
        
        dataSvc.trackEvent('Export Data',categories,{pointOfOccurence: 'CALC', 
          category :'CALC',data:categories});

        downloadCSV($scope.labor_category,$scope);
     // });

    }

    $scope.restoreRecord = function() {

      dataSvc.trackEvent('Restore Row', "Restore Row" , {pointOfOccurence: 'CALC', category :'CALC'});

      while ($scope.excludedList.length > 0)
        $scope.excludedList.pop();

      getRatesByKeywordSearch($scope.labor_category,$scope);
    }


    $scope.excludeRecord = function(excludedItem) {
            
      excludedItem.isExcluded = true;//
      //console.log("excluded item isExcluded value is  "+ excludedItem.isExcluded);
      
      //console.log("Empty excluded array is "+ $scope.excludedList);
      $scope.excludedList.push(excludedItem.id);
      //console.log("excluded array is "+ $scope.excludedList);
      
      dataSvc.trackEvent('Exclude Results', "labor category:" + excludedItem.labor_category + "Price:" + excludedItem.price, {pointOfOccurence: 'CALC', category :'CALC'});

      getRatesByKeywordSearch($scope.labor_category,$scope);
    }

    $scope.sortRates =  function(sortType) {
      //console.log('sort type is ' + $scope.sortType);
      //console.log('passed in sort type is ' + sortType);

      if($scope.sortType != sortType){
        $scope.sortDescending = false;
        $scope.sortType = sortType;
      }else{
        $scope.sortDescending = !$scope.sortDescending;
      }

      if($scope.sortDescending == false)
        dataSvc.trackEvent('Sort', $scope.sortType + " Ascending", {pointOfOccurence: 'CALC', category :'CALC'});
      else
        dataSvc.trackEvent('Sort', $scope.sortType + " Descending", {pointOfOccurence: 'CALC', category :'CALC'});
 
      //console.log($scope.sortDescending);
      /*if($scope.labor_category=="")
        getRatesByDefaultSearch($scope);
      else*/ // extra check not required
        getRatesByKeywordSearch($scope.labor_category, $scope);

      
    }

    $scope.callTrackingOnContractDownload = function(labor_category, idv_piid) {

      dataSvc.trackEvent('Download Contract', "Contract name: " + idv_piid + " Labor Category: " + labor_category, {pointOfOccurence: 'CALC', category :'CALC'});
    }

    $scope.onLogoClick= function(){

      dataSvc.trackEvent('CALC Logo', "CALC Landing page " , {pointOfOccurence: 'CALC', category :'CALC'});

    }

    $scope.onAboutClick= function(){

      dataSvc.trackEvent('CALC Header', "About CALC " , {pointOfOccurence: 'CALC', category :'CALC'});

    }

    $scope.onSINClick= function(){

      dataSvc.trackEvent('SIN Schedule', "About SIN " , {pointOfOccurence: 'CALC', category :'CALC'});

    }

    $scope.onFeedbackClick= function(){

      dataSvc.trackEvent('CALC Footer', "CALC Feedback " , {pointOfOccurence: 'CALC', category :'CALC'});

    }


}

function processRatesFromJson($scope, response){
  $scope.rates = response.data;
  $scope.count = response.data.count;
  $scope.average = response.data.average;
  $scope.first_standard_deviation = response.data.first_standard_deviation;
  $scope.rates.results.forEach(addAdditionalPropertiesToRates);
  handleSortingDisplay($scope);

  var categories = [];
  var seriesData = [];
  var stdDevX = [];
  var stdDevY = [];
  
  $scope.rates.wage_histogram.forEach(function(wage, index){

    //console.log(wage.min + '--' + wage.count);
    var category = '<div style="width:20px;text-align:center;">$' + Math.round(wage.min) + ' <br> - <br>$' + Math.round(wage.max) + '</div>';
    if(Math.round(wage.min) != Math.round(wage.max) || wage.count > 0){
    categories.push(category);
    seriesData.push({y: wage.count, min: Math.round(wage.min), max: Math.round(wage.max)});
    }
    
  });
  //Add the MAX value for the last entry to display it. 
  //This would not have been required if we were using Histograms insted of Column graphs
  //categories.push(Math.round($scope.rates.wage_histogram[$scope.rates.wage_histogram.length -1].max));
  //seriesData.push({y: 0, min: 0, max: 0});

  $scope.chart.xAxis[0].setCategories(categories);
  $scope.chart.series[0].setData(seriesData);


  var tickCount = $scope.rates.wage_histogram[0].max - $scope.rates.wage_histogram[0].min;
  var stdM1 = $scope.average - $scope.first_standard_deviation;
  var stdP1 = $scope.average + $scope.first_standard_deviation;
  var stdFrom = 0;
  var stdTo = 0;
  var avgVal = 0;
  $scope.rates.wage_histogram.forEach(function(wage, index){
    
      if(stdM1 > wage.min && stdM1 < wage.max){
        stdFrom = (index - 0.5) + ((stdM1-wage.min)/tickCount);
      }
      if(stdP1 > wage.min && stdP1 < wage.max){
        stdTo = (index - 0.5) + ((stdP1-wage.min)/tickCount);
      }
      
      if($scope.average > wage.min && $scope.average < wage.max){
        avgVal = (index - 0.5) + (($scope.average-wage.min)/tickCount);
      }
  });
  //var stdFrom = ($scope.average - $scope.first_standard_deviation)/tickCount - 0.5;
  //var stdTo =  1 + ((($scope.average + $scope.first_standard_deviation) - $scope.rates.wage_histogram[1].min)/tickCount) - 0.5;
  //console.log(stdFrom);
  //console.log(stdTo);
  $scope.chart.xAxis[0].removePlotBand('plot-band-1');
  $scope.chart.xAxis[0].addPlotBand({
            from: stdFrom,
            to: stdTo,
            color: '#D9D9D1',
            id: 'plot-band-1',
            align: 'left',
            label: {
                  useHTML: true,
                  text:'<span class="label" style="color:black;text-align:justify">Std. dev. range<br>&nbsp;$'+ Math.round(stdM1) + ' - $'+ Math.round(stdP1)+'</span>',
                  x:150+avgVal,
                  style: {
                    display: 'none',
                    backgroundColor:'rgba(217, 217, 209, 1)',
                        border:'1px solid rgba(0,0,0,.75)',
                        borderRadius:'3px',
                        color:'rgba(0,0,0,.75)',
                        fontWeight:'bold',
                        fontSize:'16px',
                        padding:'3px'
                  }
                },
                events: {
                  mouseover: function (e) {
                    this.label.element.style.display='block';
                    this.label.element.style.position='absolute';
                    this.label.element.style.left=e.pageX;
                    this.label.element.style.top=e.pageY;
                    },
                  mouseout: function (e) {
                        //console.log(this);
                        this.label.element.style.display='none';
                    }
                }
        }); 
  $scope.chart.xAxis[0].removePlotLine('plot-line-1');
  $scope.chart.xAxis[0].addPlotLine({
                  color: 'black', // Color value
                  dashStyle: 'solid', // Style of the plot line. Default to solid
                  value: avgVal, // Value of where the line will appear
                  width: 1,// Width of the line  
                  zIndex: 5,
                  id: 'plot-line-1',
                  label: {
                    useHTML: true,
                    align:'center',
                    verticalAlign:'top',
                    textAlign: 'center',
                    y:-8,
                    x:-14,
                    text: '<span class="label">$'+ Math.round($scope.average) + ' average </span>',
                    rotation:360,
                    //text:  '$ ' + Math.round($scope.average) + ' Average',
                    style: {
                        backgroundColor:'black',
                        border:'1px solid rgba(0,0,0,.75)',
                        borderRadius:'3px',
                        color:'rgba(255,255,255,0.9)',
                        fontWeight:'bold',
                        fontSize:'16px',
                        padding:'3px'
                    }
                  }
                });
}

function addAdditionalPropertiesToRates(rate, index){
  rate.idv_piid_link = rate.idv_piid.replace(/-/gi,"");
  rate.isExcluded = false;
  
  if($scope.contractYear == 'second_year_price')
    rate.price = rate.second_year_price;
  else if($scope.contractYear == 'next_year_price')
    rate.price = rate.next_year_price;
  else
    rate.price = rate.current_price;
}



function handleSortingDisplay($scope){
  var elements =document.getElementsByClassName('rate-header');
  //console.log('got ' + elements.length + ' elements');
  for(var i=0; i < elements.length; i++) { 
      //console.log('marking' + elements[i] + ' element');
      elements[i].classList.remove("highlight");
  }
  timeout(function(){
    //console.log('marking ' + $scope.sortType + ' elements');
    var elements = document.getElementsByClassName($scope.sortType);
    //console.log('got ' + elements.length + ' elements');
    for(var i=0; i < elements.length; i++) { 
        //console.log('marking ' + elements[i] + ' element');
        elements[i].classList.add("highlight");
    }

  });
}

function getRates($scope){
    http({
      method: 'GET',
      url: $scope.URL,
      withCredentials: false,
      headers: { 'X-CSRF-Token': undefined }
    }).then(function successCallback(response) {
      processRatesFromJson($scope,response);
      
    }, function errorCallback(response) {
      alert('http request failed with: ' + response.status + ':' + response.statusText);
  });
}


var API_URL = 'https://api.data.gov/gsa/calc/';
var QUERY_TYPE='__QUERY_TYPE__';
var SORT_TYPE='__SORT_TYPE__'; 
var DATA_URL_STUB1 = 'rates/?format=json&histogram=12&';
var DATA_URL_STUB2 = 'sort=__SORT_TYPE__&min_experience=__MIN_EXP__&max_experience=__MAX_EXP__&query_type=__QUERY_TYPE__&experience_range=__EXP_RANGE__'
var KEYWORD_URL_STUB = '&q=__KEYWORD__';
var CATEGORY_URL_STUB = 'search/?query_type=__QUERY_TYPE__';
var EXCLUDE_URL_STUB='&exclude=__EXCLUDE__';
var EDU_URL_STUB ='&education=__EDU__';
var SITE_URL_STUB ='&site=__SITE__';
var SIZE_URL_STUB ='&business_size=__SIZE__';
var SCHED_URL_STUB='&schedule=__SCHED__';
var DOWNLOAD_CSV_STUB = 'rates/csv/?';

function getRatesByKeywordSearch(keyword, $scope){
  
  //console.log('inside getRatesByKeywordSearch');
  //console.log('Query type is ' + $scope.query_type );
  var theUrl = API_URL + DATA_URL_STUB1 + DATA_URL_STUB2;

  $scope.URL = formatURL(keyword, theUrl, $scope);
  //console.log("my checkURL api is " + $scope.URL);
  //console.log('Calling get rates with  ' + $scope.query_type );
  getRates($scope);

}

function getRatesByDefaultSearch($scope){
  var theUrl = API_URL + DATA_URL_STUB1 + DATA_URL_STUB2;
  /*
  theUrl = theUrl.replace("__QUERY_TYPE__",$scope.query_type);
  theUrl = theUrl.replace("__MIN_EXP__",$scope.minExp); 
  theUrl = theUrl.replace("__MAX_EXP__",$scope.maxExp);

  $scope.experience_range = $scope.minExp +","+ $scope.maxExp;
  theUrl =theUrl.replace("__EXP_RANGE__",$scope.experience_range);

  if ($scope.sortDescending == false)
    theUrl = theUrl.replace("__SORT_TYPE__",$scope.sortType);
  else {
    console.log("my sortType is " + $scope.sortType);
    theUrl = theUrl.replace("__SORT_TYPE__","-" + $scope.sortType); 
  }
  $scope.URL = theUrl;
  */
  $scope.URL = formatURL("", theUrl, $scope);
  console.log("my URL api is " + $scope.URL);
  getRates($scope);
}

function getCategoriesByKeyword($scope, searchStr){
  searchStrArr = searchStr.split(",");
  searchStr = searchStrArr[searchStrArr.length - 1].trim();
  var theUrl = API_URL + CATEGORY_URL_STUB + KEYWORD_URL_STUB;  
  theUrl = theUrl.replace("__KEYWORD__",searchStr);
  $scope.URL = theUrl.replace("__QUERY_TYPE__",$scope.query_type);
  console.log('invoking URL ' + $scope.URL);
  return http({
      method: 'GET',
      url: $scope.URL,
      withCredentials: false,
      headers: { 'X-CSRF-Token': undefined }
    }).then(function successCallback(response) {
       return response.data;
      }, function errorCallback(response) {
      alert('http request failed with: ' + response.status + ':' + response.statusText);
  });
}

function downloadCSV(keyword, $scope){
  //console.log('inside downloadCSV');
  //console.log('Query type is ' + $scope.query_type );
  var theUrl = API_URL + DOWNLOAD_CSV_STUB + DATA_URL_STUB2;
  $scope.csvDownloadAnchorLink = formatURL(keyword, theUrl, $scope);
  timeout(function(){
    document.getElementById('csvDownloadAnchorElement').click();

  });
  
  //console.log("my checkURL api is " + $scope.URL);
  //console.log('Calling get rates with  ' + $scope.query_type );
  /*http({
      method: 'GET',
      url: $scope.URL,
      withCredentials: false,
      headers: { 'X-CSRF-Token': undefined }
    }).then(function successCallback(response) {
       var fileName = "MyReport.csv";
       
       var data = "Date of Download ," + new Date() + "\n\n" + response.data;
       var blobObject = new Blob([data], {
        "type": "text/csv;charset=utf8;"      
      }); 
       var link = document.createElement("a");    
      if(link.download !== undefined) { // feature detection
        //console.log("DEtected download feature");
        //var uri = 'data:text/csv;charset=utf-8,' + escape(response.data);
        //link.href = uri;
        link.setAttribute("href", window.URL.createObjectURL(blobObject));
        link.setAttribute("download", fileName);
        //link.download = fileName;
      }
      else if(window.navigator.msSaveBlob) { // IE 10+
        //console.log("DEtected IE");
        //var blobObject = new Blob([response.data]);
        link.setAttribute("href", "#");
        link.addEventListener("click", function(event) {
           window.navigator.msSaveOrOpenBlob(blobObject, fileName)
        }, false);
      }
        
    
        //set the visibility hidden so it will not effect on your web-layout
        link.style = "visibility:hidden";
        
        
        //this part will append the anchor tag and remove it after automatic click
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
          }, function errorCallback(response) {
          alert('http request failed with: ' + response.status + ':' + response.statusText);
      });
*/
}

function formatURL(keyword, theUrl, $scope){
  
  //console.log('inside formatURL');

  if(keyword != "" && typeof keyword != 'undefined'){
    console.log("Keyword is " +  keyword);
    theUrl = theUrl + KEYWORD_URL_STUB;
    theUrl = theUrl.replace("__KEYWORD__",keyword)
  }

  theUrl = theUrl.replace("__QUERY_TYPE__",$scope.query_type);

  if ($scope.sortDescending == false)
     theUrl = theUrl.replace("__SORT_TYPE__",$scope.sortType);
  else {
          console.log("my sortType is " + $scope.sortType);
          theUrl = theUrl.replace("__SORT_TYPE__","-" + $scope.sortType); 
  }

  // Exclude
  if ($scope.excludedList.length > 0) // the array has at least one element
  { 
      //console.log("$scope.excludedList is " + $scope.excludedList);
      theUrl = theUrl + EXCLUDE_URL_STUB;
      theUrl = theUrl.replace("__EXCLUDE__", $scope.excludedList);
    
  }

  //filters
  if ($scope.FILTERS.length > 0) { // the array has atleast one filter selected GIVE CASES
    
    if(checkCategoryExists('EL')){ // if education filter applied
      theUrl = theUrl + EDU_URL_STUB;
      var category = getCategory('EL');
      var eduFilterList = "";
      category.filters.forEach(function(filter, index){
        if(index > 0){
          eduFilterList = eduFilterList + "," + filter.filterKey;
        }else{
          eduFilterList = filter.filterKey;
        }
      });
      theUrl = theUrl.replace("__EDU__", eduFilterList);
    }

    if(($scope.workSite != "") && ($scope.workSite != null)){ //if work site filter applied
      theUrl = theUrl + SITE_URL_STUB;
      theUrl = theUrl.replace("__SITE__", $scope.workSite);
    }

    if(($scope.busSize != "") && ($scope.busSize != null)){ //if business size filter applied
      theUrl = theUrl + SIZE_URL_STUB;
      theUrl = theUrl.replace("__SIZE__", $scope.busSize);
    }

    if(($scope.schedule != "") && ($scope.schedule != null)){ //if schedule filter applied
      theUrl = theUrl + SCHED_URL_STUB;
      theUrl = theUrl.replace("__SCHED__", $scope.schedule);
    }

  }
  theUrl = theUrl.replace("__MIN_EXP__",$scope.minExp); 
  theUrl = theUrl.replace("__MAX_EXP__",$scope.maxExp);

  var experience_range = $scope.minExp +","+ $scope.maxExp;
  theUrl =theUrl.replace("__EXP_RANGE__",experience_range);
  
  return theUrl;

}

