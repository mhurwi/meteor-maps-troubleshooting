//////////
// Startup
//////////
Meteor.startup(function () {
  if (Meteor.isClient) {
    GoogleMaps.load();
  }
  Meteor.setInterval(updateShipments, 2000);
});

updateShipments = function () {
  if (Meteor.isServer) {
    if (ShipmentsCollection.find().count() === 0) {
      seedDatabase();
    }
    ShipmentsCollection.find().forEach(function(shipment) {
      console.log('updating shipment ' + shipment._id);
      ShipmentsCollection.update(shipment._id, {
        $set: {
          lat: shipment.lat + -0.01,
          lng: shipment.lng + -0.01,
        }
      })
    });
  }
}


//////////////
// Collections
//////////////
ShipmentsCollection = new Mongo.Collection('shipments');

seedDatabase = function () {
  ShipmentsCollection.insert({
    lat: 42,
    lng: -71
  });
  ShipmentsCollection.insert({
    lat: 42.3,
    lng: -71.3
  });
};


///////////////
// Publications
///////////////
if (Meteor.isServer) {
  Meteor.publish('shipments', function() {
    return ShipmentsCollection.find();
  });
  Meteor.publish('shipment', function(id) {
    return ShipmentsCollection.find({_id: id});
  });
}

/////////
// Routes
/////////
Router.configure({
  layoutTemplate: 'layout',
});

Router.route('/', function () {
  this.subscribe('shipments');
  this.render('shipments');
});

Router.route('/shipments/:_id', function () {
  this.subscribe('shipment', this.params._id);
  this.render('shipment', this.params._id);
}, {
  name: 'shipment',
  data: function () {
    return ShipmentsCollection.findOne(this.params._id);
  }
});

////////////
// Templates
////////////
if (Meteor.isClient) {
  //////////////////
  // Shipments Index
  Template.shipments.helpers({
    indexMapOptions: function () {
      if (GoogleMaps.loaded()) {
        return {
          center: new google.maps.LatLng(42, -71),
          zoom: 8
        }
      }
    },
    shipments: function () {
      return ShipmentsCollection.find();
    }
  });

  Template.shipments.created = (function () {
    GoogleMaps.ready('indexMap', function(map) {
      indexMarkers = {};
      ShipmentsCollection.find().observe({
        added: function (document) {
          var marker = new google.maps.Marker({
            draggable: false,
            animation: google.maps.Animation.DROP,
            position: new google.maps.LatLng(document.lat, document.lng),
            map: map.instance,
            id: document._id
          });
          indexMarkers[document._id] = marker;
        },
        changed: function(newDocument, oldDocument) {
          indexMarkers[newDocument._id].setPosition({ lat: newDocument.lat, lng: newDocument.lng });
        },
      });
    });
  });

  //////////////////
  // Shipments Show
  Template.shipment.helpers({
    showMapOptions: function () {
      if (GoogleMaps.loaded()) {
        return {
          center: new google.maps.LatLng(42, -71),
          zoom: 8
        }
      }
    }
  });

  Template.shipment.created = function () {
    GoogleMaps.ready('showMap', function(map) {
      showMarkers = {};
      ShipmentsCollection.find().observe({
        added: function (document) {
          var marker = new google.maps.Marker({
            draggable: false,
            animation: google.maps.Animation.DROP,
            position: new google.maps.LatLng(document.lat, document.lng),
            map: map.instance,
            id: document._id
          });
          showMarkers[document._id] = marker;
        },
        changed: function(newDocument, oldDocument) {
          showMarkers[newDocument._id].setPosition({ lat: newDocument.lat, lng: newDocument.lng });
        },
      });
    });
  };
}
