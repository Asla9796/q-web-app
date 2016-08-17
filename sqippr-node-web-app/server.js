;(function(){
  'use strict';

const express = require('express');

// Constants
const PORT = 80;

// App
const app = express();    
const request = require('request');
var bodyParser = require('body-parser');

//Libraries
var hashCalc = require('./sha512.js');

//Email client
const Sparkpost = require('sparkpost');
var sp = new Sparkpost('bda645352a27cfb5e211fd46501d488008892e12');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.get('/verify-email', function(req, res){
  var token = req.query.token;
  
  var getTokenReq = {
      method: 'POST',
      url: 'http://auth.lingerie91/email/confirm?token='+token,
      headers: {
        "X-Hasura-Role": "admin",
        "X-Hasura-User-Id": 1
      }
    };
    
  request.get(getTokenReq, function optionalCallback(error, response, body){
      if (error) {
          return console.error('error', error);
        }
      res.redirect('https://ui.lingerie91.hasura-app.io/login.html');
    });
});

app.post('/add_user', function(req, res){
  var user = req.body;
  console.log(user);
  
      var addUserReq = {
        method: 'POST',
        url:'http://data.lingerie91/api/1/table/users/insert', 
        json: {
              "objects":[{
                'id': user.id,
                'name': user.name,
                'phone' : user.phone,
                'email' : user.email
              }]
        },
        headers: {
          "X-Hasura-Role": "admin",
          "X-Hasura-User-Id": 1        
        }
      };
    
      request.post(addUserReq, function optionalCallback(error, response, body) {
          if (error) {
            return console.error('error', error);
          }
          console.log(body);
          res.sendStatus(200);
      });
});

app.post('/email', function (req, res) {
  var email = req.body;
  var token = hashCalc.sha512(email.recipient).substring(1, 10);
  
  sp.transmissions.send({
    transmissionBody : {
      content : {
        from : email.email,
        subject: email.subject,
        html : email.html
      },
      recipients :[{
          address: email.recipient
        }],
      substitution_data: {
        token : token
      },
      options : {
        inline_css : true
      }
    }
  }, function(error, response){
    if( error ){
      console.log('Email sending failed');
    }
    else {
      console.log('Email sent successfully');
      
      var updateToken = {
        method: 'POST',
        url:'http://data.lingerie91/api/1/table/account/update', 
        json: {
          "$set":{"token": token},
          "where": {"userId": email.userId}
        },
        headers: {
          "X-Hasura-Role": "admin",
          "X-Hasura-User-Id": 1,
        }
      };
    
      request.post(updateToken, function optionalCallback(error, response, body) {
          if (error) {
            return console.error('error', error);
          }
      });
    }
  });
  
});

app.post('/email_receipt', function(req, res) {
  var email = req.body;
  
  sp.transmissions.send({
    transmissionBody : {
      content : {
        from : email.email,
        subject: email.subject,
        html : email.html
      },
      recipients :[{
          address: email.recipient
        }],
      substitution_data: {
        token : email.token
      },
      options : {
        inline_css : true
      }
    }
  }, function(error, response){
    if( error ){
      console.log('Email sending failed');
    }
    else {
      console.log('Email sent successfully');
      res.sendStatus(200);
    }
  });
});

app.post('/validate_payment', function (req, res) {

  var paymentRes = req.body;
  var hash = hashCalc.sha512('eCwWELxi'+'|'+paymentRes.status+'|||||||||||'+paymentRes.email+'|'+paymentRes.firstname+'|'+paymentRes.productinfo+'|'+paymentRes.amount+'|'+paymentRes.txnid+'|gtKFFx');
  
  if(paymentRes.hash == hash){
    // console.log('hash matched');
    res.redirect('https://ui.lingerie91.hasura-app.io/#/tab/successfulPayment');
    
    var updateStatusReq = {
      method: 'POST',
      url: 'http://data.lingerie91/api/1/table/orders/update',
      json : {
            "$set":{"payment_status": "paid"},
            "where": {"token": paymentRes.txnid}
      },
      headers: {
        "X-Hasura-Role": "admin",
        "X-Hasura-User-Id": 1
      }
    };
    
    request.post(updateStatusReq, function optionalCallback(error, response, body){
      if (error) {
          return console.error('error', error);
        }
    });
    
    var receiptMailReq = {
      method: 'POST',
      url:'http://data.lingerie91/api/1/table/orders/select', 
      json: {
          "columns":[
                  "*",
                  {
                      "name": "items",
                      "columns": [
                              "*",
                              {
                                  "name":"item",
                                  "columns": ["*"]
                              }
                          ]
                  },
                  {
                    "name": "outlet",
                    "columns": ["*"]
                  },
                  {
                    "name":"user",
                    "columns": ["*"]
                  }
              ],
          "where": {
            "token": paymentRes.txnid
          }
      },
      headers: {
        "X-Hasura-Role": "admin",
        "X-Hasura-User-Id": 1
      }
    };
  
    request.post(receiptMailReq, function optionalCallback(error, response, body) {
        if (error) {
          return console.error('error', error);
        }
        // console.log(body);
        var items = body[0].items;
        var order = [];
        order.push('<tr><th>Item</th><th>Quantity         </th><th>Price</th></tr>');
        
        for(var i=0; i< items.length; i++){
          order.push('<tr><td>'+items[i].item.name+'</td>'+'<td>'+items[i].quantity+'         '+'</td>'+'<td>'+items[i].item.price+'</td></tr>');
        }
        order.push('<br><tr><td>Bill Amount</td><td>'+body[0].billAmount+'</td></tr><tr><td>Convenience Charge</td><td>'+body[0].conv_charge+'</td></tr><tr><td>Packing Charge</td><td>'+body[0].packing_charge+'</td></tr><tr><td>Delivery Charge</td><td>'+body[0].delivery_charge+'</td></tr>');
        order.push('<br><tr><th>Final Amount</th><th>'+body[0].totalAmount+'</tr>');
        var receipt = order.join('');
        
        var html = '<h3>Hello,</h3><br><p>Your order '+paymentRes.txnid+' has been successfully placed. Please find receipt here :</p><br>'+receipt+'<br><p>Thank you for choosing sQippr. Enjoy your meal!</p><br><p>**Please do not response to this mail**</p>';
        console.log(html);
        
        var emailReq = {
          method: 'POST',
          url:'http://server.lingerie91/email_receipt',
          json: {
            email: "contactus@sqippr.com",
            subject: "sQippr || Order Receipt {{token}}",
            recipient: body[0].user.email,
            html: html,
            token: paymentRes.txnid
          }
        };
        
        request.post(emailReq, function optionalCallback(error, response, body) {
          if(error){
            console.log('error', error);
          }
        });
    });
  }
  else{
    console.log('hash mismatch', hash, paymentRes.hash);
  }
});

app.listen(PORT);
console.log('I am running on ' + PORT);

}(this));