require('firebase/firestore');
const db = require('./config').db;

module.exports = {
  getProduct: (name) => {
    const products = db
      .collection('products').where('name', '==', name)
      .get()
      .then(snapshot => {
        let _products = [];
        snapshot.forEach(function (doc) {
          _products.push(Object.assign(doc.data(), { id: doc.id }));
        });
        return _products[0];
      });
    return products;
  },
  getProducts: () => {
    const products = db
      .collection('products').orderBy('type')
      .get()
      .then(snapshot => {
        let _products = [];
        snapshot.forEach(function (doc) {
          _products.push(Object.assign(doc.data(), { id: doc.id }));
        });
        return _products;
      });
    return products;
  },
  getPreventions: () => {
    const preventions = db
      .collection('preventions').orderBy('value')
      .get()
      .then(snapshot => {
        let _preventions = [];
        snapshot.forEach(function (doc) {
          _preventions.push(Object.assign(doc.data(), { id: doc.id }));
        });
        return _preventions;
      });
    return preventions;
  },
  getTaxs: () => {
    const taxs = db
      .collection('taxs').orderBy('value')
      .get()
      .then(snapshot => {
        let _taxs = [];
        snapshot.forEach(function (doc) {
          _taxs.push(Object.assign(doc.data(), { id: doc.id }));
        });
        return _taxs;
      });
    return taxs;
  }
}