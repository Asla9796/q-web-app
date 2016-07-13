'use strict';

const express = require('express');

// Constants
const PORT = 80;

// App
const app = express();

const request = require('request');

var bodyParser = require('body-parser');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.get('/', function (req, res) {
  res.send('Hello world\n');
});

app.listen(PORT);
console.log('I am running on http://localhost:' + PORT);

app.post('/validatePayment', function (req, res) {
  location.replace('http://127.0.0.1:31999/sqippr/project_3_hasura/www/index.html#/tab/successfulPayment');
  
  // var paymentRes = req.body;
  
  // request.post({url:'http://data.lingerie91.hasura-app.io/api/1/tables/orders/select', 
  //               data: {"columns": ["hash_string"],
  //                       "where": {"timestamp": paymentRes.txnid}
  //               }}, 
    
  //   function optionalCallback(error, response, body) {
  //     if (error) {
  //       return console.error('error', error);
  //     }
  //     console.log('successful response', body);
  //     var str = body.hash_string;

  //     var str_2 = [];
      
  //     for(var i=0; i < str.length; ){
  //       var dummy = '';
  //       for(var j = i+1; j <str.length+1; j++ ){
  //         if(str[j] === '|' | j === str.length){
  //           dummy = str.slice(i,j);
  //           if(i===0){
  //             str_2.push(dummy);  
  //           }else{
  //             str_2.push(dummy+'|');
  //           }
             
  //           i=j+1;
  //         }
  //         else{
             
  //         }
  //       } 
  //     }
  //     var reverseStr = str_2.reverse();
  //     reverseStr.splice(1,0,'status'+'|');
  //     var finalStr = reverseStr.join('');
  //     var finalHash = sha512(finalStr);
  //     console.log(finalHash);
      
  //     if(paymentRes.hash == finalHash){
  //       // verification cleared, update payment status in db
  //       location.replace('http://127.0.0.1:31999/sqippr/project_3_hasura/www/index.html#/tab/successfulPayment');
  //     }
  //     else{
  //       // redirect to failed page
  //     }
      
    });
});
