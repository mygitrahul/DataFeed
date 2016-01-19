/**
 * 
 * @author KB38202
 */

var querystring = require("querystring");
var async = require('async');
var request = require('request');

module.exports = {

	/**
	 * define constants PROD : https://apiboss.aws.bugaboo.com TEST :
	 * https://apibosstest.aws.bugaboo.com
	 */

	//BOSS_BASE_URL : "https://apibosstest.aws.bugaboo.com",
	BOSS_BASE_URL : "https://apiboss.aws.bugaboo.com",
	
	V2_CATALOG_PRODUCTS_URL : "/v2/catalog/products",
	V2_CATALOG_CONFIGURATIOONS_URL : "/v2/catalog/configurations",

	ADAPTER_CONSTANT : "adapter",

	ACCESSORY_CONSTANT : "accessory",

	SEAT_FABRIC_CONSTANT : "seat_fabric",

	SUN_CANOPY_CONSTANT : "suncanopy",

	DUO_EXTENTION_CONSTANT : "duo_extention_set",

	BASSINET_CONSTANT : "bassinet",

	CARSEAT_ADAPTER_CONSTANT : "carseat_adapter",

	FAMILY_CONSTANT : "family",

	ECOM_LIFECYCLE_CONSTANT : "eComm-outlet",

	TAILORED_FABRIC_CONSTANT : "tailored fabric",

	HIPPO_CDN_IMAGE_URL : "https://apiassets.bugaboo.com",

	PART_CONSTANT : "part",
	
	CARSEAT_ADAPTER : "carseat_adapter",
	
	REFURBISHED_CONSTANT : "Refurbished",
	
	STROLLER_CONSTANT : "stroller",

	removeDuplicateElement : function(json_response) {

		/**
		 * removes duplicate element from json object
		 */

		var uniq = json_response.reduce(function(a, b) {
			if (a.indexOf(b) < 0)
				a.push(b);
			return a;
		}, []);

		return uniq;
	},

	isset : function(checkVariable) {

		/**
		 * checks if variabe is set
		 * 
		 * http://phpjs.org/functions/isset/
		 */

		if (typeof (checkVariable) === undefined || checkVariable === null) {
			return false;
		}
		return true;

	},

	getObjectKeyLength : function(obj) {

		/**
		 * get JSON object length
		 * 
		 * @param obj
		 * @returns
		 */

		return Object.keys(obj).length;
	},

	checkHighestPrice : function(json_response) {

		/**
		 * checks and returns highest price item
		 * 
		 * @param json_response
		 * @returns json_response
		 */

		for ( var key in json_response) {

			var itemSize = this.getObjectKeyLength(json_response[key].items);

			if (itemSize > 1) {
				var i = 0;
				for ( var itemKey in json_response[key].items) {
					i++;
					if (i == 1)
						continue;
					delete json_response[key].items[itemKey];

				}
			}
		}
		return json_response;
	},

	chooseDefault : function(json_response) {

		/**
		 * removes additional items, makes default
		 * 
		 * @param json_response
		 * @returns json_response
		 */

		for ( var key in json_response) {

			var itemSize = this.getObjectKeyLength(json_response[key].items);
			if (itemSize > 1) {
				var i = 0;
				for ( var itemKey in json_response[key].items) {
					i++;
					if (i == 1)
						continue;
					delete json_response[key].items[itemKey];

				}
			}
		}
		return json_response;
	},

	chooseDefaultOutletItem : function(json_response) {

		/**
		 * removes additional items, makes default different : when outlet_item,
		 * select first
		 * 
		 * @param json_response
		 * @returns json_response
		 */

		for ( var key in json_response) {

			var itemSize = this.getObjectKeyLength(json_response[key].items);

			if (itemSize > 1) {
				for ( var itemKey in json_response[key].items) {
					var channels = json_response[key].items[itemKey]['channels'].join();
					if (!(channels.indexOf(this.ECOM_LIFECYCLE_CONSTANT) > -1))
						delete json_response[key].items[itemKey];
				}
			}
		}
		return this.chooseDefault(json_response);
	},

	isEmptyObject : function(obj) {

		/**
		 * check if a JSON is empty
		 * 
		 * @param obj
		 * @returns
		 */

		return !Object.keys(obj).length;
	},

	setItems : function(item, page, isVPC) {

		var changeItem = {};

		try {

			/*******************************************************************
			 * below change - exception for MI001268 and CI000003 please read -
			 * http://redmine.bugaboo.com/redmine/issues/5252 for more info
			 * change starts
			 */
			var swatchOrMaterial = "swatch";

			if (item["productId"] === "MI001268" || item["productId"] === "CI000003") {
				swatchOrMaterial = "material";
			}

			/*******************************************************************
			 * change finished
			 */

			changeItem["id"] = item[swatchOrMaterial]["key"];
			changeItem["label"] = item[swatchOrMaterial]["name"];
			changeItem["pattern"] = item[swatchOrMaterial]["pattern"];
			changeItem["rgb"] = item[swatchOrMaterial]["rgb"];
			changeItem["available"] = item["atp"] > 0;
			changeItem["atp"] = item["atp"];

			if (page == "accessory-overview-detail-page" || page == "part-overview-detail-page" || page =="carseat-adapter-overview-detail-page") {
				if (item["prices"]) {
					if (item["prices"].hasOwnProperty("eComm"))
						if (item["prices"]["eComm"].hasOwnProperty("price"))
							changeItem["price"] = item["prices"]["eComm"]["price"];
				}
				if (item["images"]) {
					if (item["images"].hasOwnProperty("3D"))
						changeItem["src"] = item["images"]["3D"];
				}
			} else if (page == "outlet-overview-detail-page") {
				if (item["prices"]) {
					if (item["prices"].hasOwnProperty("eComm-outlet"))
						if (item["prices"]["eComm-outlet"].hasOwnProperty("price"))
							changeItem["price"] = item["prices"]["eComm-outlet"]["price"];
				}

				/**
				 * for outlet - adding logic, #SW193
				 * 
				 */
				if (isVPC) {
					if (item["images"]) {
						if (item["images"].hasOwnProperty("3D"))
							changeItem["src"] = item["images"]["3D"];
					}
				} else {
					changeItem["src"] = this.HIPPO_CDN_IMAGE_URL + "/binaries/content"
							+ "/gallery/bugaboocms/strollers/outlet/large_img/" + item["productId"].toLowerCase()
							+ "_outlet_" + item["itemcode"].toLowerCase() + ".png";
				}
			} else if (page == "refurbish-overview-detail-page") {
			  //console.log("refurbish-overview-detail-page");
				if (item["prices"]) {
					if (item["prices"].hasOwnProperty("Refurbished")){
						if (item["prices"]["Refurbished"].hasOwnProperty("price"))
							changeItem["price"] = item["prices"]["Refurbished"]["price"];
					}
				}
				if (item["images"]) {
					if (item["images"].hasOwnProperty("3D"))
						changeItem["src"] = item["images"]["3D"];
				}
			}

			changeItem["itemcode"] = item["itemcode"];

		} catch (e) {
			console.log("");
		}

		return changeItem;
	},

	removeProductItemData : function(pCustomResponseItem) {

		delete pCustomResponseItem["productId"];
		delete pCustomResponseItem["channels"];
		delete pCustomResponseItem["roles"];
		delete pCustomResponseItem["families"];
		delete pCustomResponseItem["weight"];
		delete pCustomResponseItem["dimensions"];
		delete pCustomResponseItem["material"];

		return pCustomResponseItem;
	},

	removeProductData : function(pCustomResponseProduct) {

		delete pCustomResponseProduct["roles"];
		delete pCustomResponseProduct["families"];
		delete pCustomResponseProduct["icons"];
		delete pCustomResponseProduct["position"];
		delete pCustomResponseProduct["wheel"];
		delete pCustomResponseProduct["virtualProductId"];
		delete pCustomResponseProduct["images"];
		delete pCustomResponseProduct["channels"];

		return pCustomResponseProduct;
	},

	removeAfterProductDataItem : function(jsonResponseProductDataItem) {

		delete jsonResponseProductDataItem["special"];
		delete jsonResponseProductDataItem["roles"];
		delete jsonResponseProductDataItem["families"];
		delete jsonResponseProductDataItem["channels"];
		delete jsonResponseProductDataItem["weight"];
		delete jsonResponseProductDataItem["dimensions"];
		delete jsonResponseProductDataItem["swatch"];
		delete jsonResponseProductDataItem["atp"];
		delete jsonResponseProductDataItem["productId"];
		delete jsonResponseProductDataItem["images"];
		delete jsonResponseProductDataItem["material"];

	},

	getEndpointURL : function(req, res) {

		var queryString = querystring.stringify(req.query);
		// forming URL query string
		var url = this.BOSS_BASE_URL + this.V2_CATALOG_PRODUCTS_URL + "?" + queryString;
		console.log("URL : " + url);
		return url;

	},
	
	getconfigurationsURL : function(req, res) {console.log("1111");

		var queryString = querystring.stringify(req.query);
		// forming URL query string
		var url = this.BOSS_BASE_URL + this.V2_CATALOG_CONFIGURATIOONS_URL + "?" + queryString;
		console.log("URL : " + url);
		return url;

	},

	setProductDetailPage : function(customResponse, productId, page) {        
		// declared a JSON array
		var json_response = {};
		json_response["id"] = customResponse["productId"];
		json_response["vpcode"] = customResponse["virtualProductId"];
		json_response["wheel"] = customResponse["wheel"];
		json_response["position"] = customResponse["position"];
		json_response["icons"] = {};
		try {
			if (customResponse["icons"])
				if (customResponse["icons"]["iconIE8"])
					json_response["icons"]["default"] = customResponse["icons"]["iconIE8"];
		} catch (e) {
			console.log("");
		}
		json_response["label"] = customResponse["name"];
		json_response["friendly-url"] = customResponse["friendly-url"];

		if (customResponse.items) {

			json_response.items = {};

			for ( var key in customResponse.items) {

				/**
				 * fill item object
				 */

				// check isVPC - for #193
				var isVPC = customResponse["virtualProductId"] === null ? false : true;

				var item = this.setItems(customResponse.items[key], page, isVPC);

				var channel = customResponse.items[key]["channels"].join();

				var roles = customResponse.items[key]["roles"].join();

				if (item["id"] != undefined) {

					if (page == "accessory-overview-detail-page") {

						if (typeof (channel) != "undefined") {

							if (!(channel.indexOf(this.ECOM_LIFECYCLE_CONSTANT) > -1)) {

								json_response.items[key + "_" + item["id"]] = item;
							}
						}
					} else if (page == "outlet-overview-detail-page") {

						if (typeof (channel) != "undefined") {

							if ((channel.indexOf(this.ECOM_LIFECYCLE_CONSTANT) > -1)) {

								json_response.items[key + "_" + item["id"]] = item;
							}
						}
					} else if (page == "part-overview-detail-page") {

						if (typeof (roles) != "undefined") {

							if ((roles.indexOf(this.PART_CONSTANT) > -1)) {

								json_response.items[key + "_" + item["id"]] = item;
							}
						}
					} else if (page == "carseat-adapter-overview-detail-page") {

						if (typeof (channel) != "undefined") {

							if (!(channel.indexOf(this.ECOM_LIFECYCLE_CONSTANT) > -1)) {

								json_response.items[key + "_" + item["id"]] = item;
							}
						}
					} else if (page == "refurbish-overview-detail-page") {                            
						if (typeof (channel) != "undefined") {

							if ((channel.indexOf(this.REFURBISHED_CONSTANT) > -1)) {                                
								json_response.items[key + "_" + item["id"]] = item;
							}
						}
					}

				}

			}
		}

		/**
		 * rename items with colours node
		 */
		json_response["colours"] = json_response["items"];
		delete json_response["items"];

		/**
		 * put json response into main item
		 */
		var tempJson_response = {};
		tempJson_response[productId] = json_response;
		json_response = tempJson_response;
		return json_response;
	},

	setMetaData : function(json_response, productType) {
		var temp_response = {};
		temp_response["metaTitle"] = [];
		temp_response["metaDescription"] = [];
		temp_response["friendly-url"] = [];

		for ( var key in json_response) {

			if (json_response[key]["content"])
				if (json_response[key]["content"][productType])
					if (json_response[key]["content"][productType]["metadata"]) {
						json_response[key]["metadata"] = json_response[key]["content"][productType]["metadata"];					

					}

			delete json_response[key]["content"];
			delete json_response[key]["friendly-url"];

		}

		return json_response;
	},
	

	setcarSeats : function(json_response,productType, country) {
		for(var key in json_response){
			if (json_response[key]["content"]){
				if(json_response[key]["content"][productType]){
					if(json_response[key]["content"][productType]["carSeats"]){
						var carseatadapterarr = json_response[key]["content"][productType]["carSeats"] ;
						var temp_carseatadapterarr = [];
						//console.log("No of items-->"+carseatadapterarr.length);
						for(var item in carseatadapterarr){
							//console.log(carseatadapterarr[item].name);
							var countriesarr = carseatadapterarr[item].countries.join() ;
							if(countriesarr.indexOf(country) > -1){
								//console.log("adding the item "+json_response[key].productId)
								var seatitems =[];	
								seatitems ={"keyname" :carseatadapterarr[item].name,"remarks": carseatadapterarr[item].remarks};								
								temp_carseatadapterarr.push(seatitems);							 
							}
						}
						json_response[key]["carSeats"] = temp_carseatadapterarr;
					}
				}
			}
		}
        
		return json_response;
	},
	
	

	handler : function(req, res, URL, callback) {
		async.series([
		/*
		 * First external endpoint
		 */
		function(callback) {
			var url = URL + "MI001245";
			request(url, function(err, response, body) {
				// JSON body
				if (err) {
					console.log(err);
					callback(true);
					return;
				}
				obj = JSON.parse(body);
				callback(false, obj);
			});
		}, function(callback) {
			var url = URL + "MI001248";
			request(url, function(err, response, body) {
				// JSON body
				if (err) {
					console.log(err);
					callback(true);
					return;
				}
				obj = JSON.parse(body);
				callback(false, obj);
			});
		}, function(callback) {
			var url = URL + "MI001276";
			request(url, function(err, response, body) {
				// JSON body
				if (err) {
					console.log(err);
					callback(true);
					return;
				}
				obj = JSON.parse(body);
				callback(false, obj);
			});
		}, function(callback) {
			var url = URL + "MI001246";
			request(url, function(err, response, body) {
				// JSON body
				if (err) {
					console.log(err);
					callback(true);
					return;
				}
				obj = JSON.parse(body);
				callback(false, obj);
			});
		}, function(callback) {
			var url = URL + "MI001343";
			request(url, function(err, response, body) {
				// JSON body
				if (err) {
					console.log(err);
					callback(true);
					return;
				}
				obj = JSON.parse(body);
				callback(false, obj);
			});
		}, function(callback) {
			var url = URL + "MI001344";
			request(url, function(err, response, body) {
				// JSON body
				if (err) {
					console.log(err);
					callback(true);
					return;
				}
				obj = JSON.parse(body);
				callback(false, obj);
			});
		}, function(callback) {
			var url = URL + "MI001345";
			request(url, function(err, response, body) {
				// JSON body
				if (err) {
					console.log(err);
					callback(true);
					return;
				}
				obj = JSON.parse(body);
				callback(false, obj);
			});
		} ],
		/*
		 * Collate results
		 */
		function(err, results) {
			if (err) {
				console.log(err);
				res.send(500, "Server Error");
				return;
			}

			callback(null, {
				json : results
			});
		});
	}

};
