
function getCategoryName(categoryKey){
	var name = "";
	switch(categoryKey){
		case 'EL':
			name =  'Education Level';
			break;
		case 'EX':
			name =  'Experience';
			break;
		case 'WS':
			name =  'Work Site';
			break;
		case 'BIZSZ':
			name =  'Business Size';
			break;
		case 'SIN':
			name =  'SIN/Schedule';
			break;
		case 'CY':
			name =  'Contract Year';
			break;
	}
	return name;
}


function checkCategoryExists(categoryKey){
	var exists = false
	$scope.FILTERS.forEach(function(category){
    	//console.log('checking for category ' + category.categoryKey);
		if(category.categoryKey == categoryKey){
			exists = true;
        }
	});
	//console.log('Checking Category exists' + categoryKey + ' - ' + exists);
    return exists;
}

function getCategoryIndex(categoryKey){
	var idx;
	$scope.FILTERS.forEach(function(category, index){
		if(category.categoryKey == categoryKey){
			idx = index;
        }
	});
	//console.log('Getting Category index' + categoryKey + ' - ' + idx);
    return idx;
}

function getCategory(categoryKey){
	//console.log('Getting Category ' + categoryKey);
	var cat;
	$scope.FILTERS.forEach(function(category){
		if(category.categoryKey == categoryKey)
			cat = category;
	});
    return cat;
}

function checkFilterExists(categoryKey, filterKey){

	var exists = false;
	var category = getCategory(categoryKey);
	if(category){
		category.filters.forEach(function (filter){
			if(filter.filterKey == filterKey){
				exists =  true;
			}
		});
	}
	//console.log('Checking Filter exists' + filterKey + ' - ' + exists);
    return exists;
}

function getFilterIndex(category, filterKey){
	//console.log('Getting Filter index' + filterKey);
	var idx;
	category.filters.forEach(function (filter, index){
		if(filter.filterKey == filterKey)
			idx =  index;
	});
    return idx;
}

function getFilter(category, filterKey){
	//console.log('Getting Filter ' + filterKey);
	var fil; 
	category.filters.forEach(function (filter){
		if(filter.filterKey == filterKey)
			fil = filter;
	});
    return fil;
}
function __filterCategory(categoryKey, name){
	console.log('Creating new Filter Category  - ' + categoryKey);
	this.categoryKey = categoryKey
	this.categoryDisplayName = name;
	this.filters = [];
}

function __filter(filterKey, name, scopeRef){
	console.log('Creating new Filter - ' + filterKey);
	this.filterKey = filterKey;
	this.filterDisplayName = name;
	this.filterScopeRef = scopeRef;
}

function registerFilter(categoryKey, filterKey, filterName, filterScopeRef){
	console.log('Called registerFilter');
	if(checkCategoryExists(categoryKey)){
		var fc = getCategory(categoryKey);
		if(!checkFilterExists(categoryKey, filterKey))
			fc.filters.push(new __filter(filterKey, filterName, filterScopeRef));
		else 
			removeFilter(categoryKey, filterKey, filterScopeRef);
	}else{
		var fc = new __filterCategory(categoryKey,getCategoryName(categoryKey));
		fc.filters.push(new __filter(filterKey, filterName, filterScopeRef));
		$scope.FILTERS.push(fc);
	}
}

function removeFilter(categoryKey, filterKey, filterScopeRef){
	console.log('Called removeFilter');
	if(checkCategoryExists(categoryKey)){
		var fc = getCategory(categoryKey);
		if(checkFilterExists(categoryKey, filterKey)){
			var filter = getFilter(fc, filterKey);
			if(filterScopeRef){
				if(filter.filterScopeRef == filterScopeRef){
					fc.filters.splice(getFilterIndex(fc, filterKey),1);
				}else{
					filter.filterScopeRef = filterScopeRef;
				}
			}else{
				fc.filters.splice(getFilterIndex(fc, filterKey),1);
			}
			
		}
			
        if(fc.filters.length == 0)
        	$scope.FILTERS.splice(getCategoryIndex(categoryKey),1);
	}
}