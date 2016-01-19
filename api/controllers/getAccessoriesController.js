'use strict';
/*
 'use strict' is not required but helpful for turning syntactical errors into true errors in the program flow
 http://www.w3schools.com/js/js_strict.asp
*/

/*
 Modules make it possible to import JavaScript files into your application.  Modules are imported
 using 'require' statements that give you a reference to the module.

  It is a good idea to list the modules that your application depends on in the package.json in the project root
 */
var util = require('util');
var request = require('request');


/*
 Once you 'require' a module you can reference the things that it exports.  These are defined in module.exports.

 For a controller in a127 (which this is) you should export the functions referenced in your Swagger document by name.

 Either:
  - The HTTP Verb of the corresponding operation (get, put, post, delete, etc)
  - Or the operationId associated with the operation in your Swagger document

  In the starter/skeleton project the 'get' operation on the '/hello' path has an operationId named 'hello'.  Here,
  we specify that in the exports of this module that 'hello' maps to the function named 'hello'
 */
module.exports = {
  getAccessories: getAccessories
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
function getAccessories(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
  var country = req.swagger.params.country.value;
  var language = req.swagger.params.language.value;

  var url = "https://apiboss.aws.bugaboo.com/v2/catalog/products"+"?"+"country="+country+"&"+"language="+language;

  var locale = language+"_"+country ;

  var json_response = "";

  request.get(url, function(err, response, body) {

    if (err) {

      res.status(500).send();
    }

    else {

      var customResponse = JSON.parse(body);
        json_response = {};
                var itemarr =[];
        for ( var productID in customResponse) {
        
          var roles = customResponse[productID]['roles'].join() ;         
          if (roles.indexOf("accessory")> -1) {
              for( var itemsKey in customResponse[productID].items){
              var itemrole = customResponse[productID].items[itemsKey]['roles'] ;
                            var channels = customResponse[productID].items[itemsKey]['channels'];             
              if((itemrole.join().indexOf("accessory")> -1) 
                && (channels.join().indexOf("eComm-outlet")< 0)){
                var temp_item = {};
                
                // description 
                var description ="";
                
               /** var descriptionarr = customResponse[productID].items[itemsKey]["descriptions"] ;
                for(var key in descriptionarr){
                   console.log(descriptionarr[key].languageCode);
                 if(descriptionarr[key].languageCode =="EN"){
                  description = descriptionarr[key].DescriptionShort ;
                  break ;
                 }
                } */
                
                //link
                var link="";
                var pageurl="";
                
                var metadata= customResponse[productID]["content"]["default"]["metadata"];
                              for(var key in metadata){
                  if("friendly-url" === key){
                   pageurl = metadata[key] ;
                }
                if("metaDescription" === key){
                  description = metadata[key];
                }
                              }         
                
                link = "https://www.bugaboo.com/"+country+"/"+locale+"/strollers/accessories/detail/"+pageurl;
                
                // image_link
                var imagelink ="";
                if(customResponse[productID].items[itemsKey].images){
                   var images = customResponse[productID].items[itemsKey].images ;
                 if(images["3D"]){                  
                  imagelink = images["3D"] ;
                 }
                 
                }
                
                // availability
                var availability = "out of stock" ;
                var atp = customResponse[productID].items[itemsKey].atp ;
                if(atp >0){
                   var availability = "in stock" ;
                }
                
                // price 
                var price ="";
                if(customResponse[productID].items[itemsKey].prices){
                   var prices = customResponse[productID].items[itemsKey].prices ;
                 if(prices["eComm"]){
                    price = prices["eComm"].price +" "+prices["eComm"].currency ;
                 }
                }
                
                //color
                var color ="";
                if(customResponse[productID].items[itemsKey]["swatch"]){
                   color = customResponse[productID].items[itemsKey]["swatch"].name ;
                 if(color =="XX"){
                    color = "NA";
                 }
                }
                
                //shipping               
                var shipping ="";
                if(country =="US"){
                shipping = {"g:country" :"US","g:service" : "Standard", "g:price":"0.00 USD"};
                }
                else if(country =="GB"){
                  var shipmentprice="";
                  console.log("price-->"+price);
                var tempshipmentpricearr = price.split(" ",1);
                var shipmentprice = tempshipmentpricearr[0] ;
                if(shipmentprice < 39.95){          
                  shipmentprice = "4.00 GBP";
                  }else {
                  shipmentprice = "0.00 GBP" ;
                }
                shipping = {"g:country" :"GB","g:service" : "Standard", "g:price":shipmentprice};
                }
                
                
                
                temp_item = {
                "g:id" :customResponse[productID].items[itemsKey].itemcode,
                "g:title" :customResponse[productID].items[itemsKey].name+" "+color,
                
                "description" :description,
                "g:link" :link,
                "g:image_link" :imagelink,
                "g:condition" :"new",
                "g:availability" :availability,
                "g:price" :price,
                "g:gtin" :"",               
                "g:mpn" :customResponse[productID].items[itemsKey].itemcode,
                "g:brand" :"bugaboo",
                /* Baby Stroller Accessories*/
                "g:google_product_category" :"4387",
                "g:product_type" :"accessories",
                "g:item_group_id" :customResponse[productID].productId,
                "g:color" :color,
                //to do
                "g:tax" :"",
                "g:shipping":shipping
                };
                itemarr.push(temp_item);
                } 
              }
          }
        }
       var item = {"item" : itemarr};
       
      json_response = {"rss" : {"$default": "","xmlns:g": "http://base.google.com/ns/1.0","version": "2.0", "channel" : item}};
      
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(json_response));
    }

  });
};