import _ from 'lodash';
import moment from 'moment';
import { Random } from 'meteor/random';
import QRCode from 'qrcode';
import { Meteor } from 'meteor/meteor'

/**
 * validates the .csv file
 * populates a doc w/ _id and QRCode if either are missing
 * defines docs per .csv row
 * @returns Promise
 */
export const loadCollectionNewDataOnly = (collection, loadJSON) => {
  const type = collection.getType();
  let count = 0;
  let name, arr, required;
  switch (type) {
    case 'Drugs':
      name = 'drug';
      arr = 'lotIds';
      required = ['drug', 'drugType', 'minQuantity', 'unit', 
        'lotIds.lotId', 'lotIds.location', 'lotIds.quantity'];
      break;
    case 'Vaccines':
      name = 'vaccine';
      arr = 'lotIds';
      required = ['vaccine', 'brand', 'minQuantity', 'visDate', 
        'lotIds.lotId', 'lotIds.location', 'lotIds.quantity'];
      break;
    case 'Supplys':
      name = 'supply';
      arr = 'stock';
      required = ['supply', 'supplyType', 'minQuantity', 
        'stock.location', 'stock.quantity'];
      break;
    default:
      console.log('No type.')
  };
  // reject the first required field
  for (let i = 0; i < required.length; i++) {
    const field = required[i];
    if (loadJSON.some(o => !_.get(o, field))) {
      return Promise.reject(new Error(`${field} cannot be empty!`));
    }
  }
  // check if any _ids or qrcodes are empty
  let empty = false;
  empty = loadJSON.some(o => !o[arr]._id);
  empty = empty || loadJSON.some(o => !o[arr].QRCode);

  const promises = [];
  const _ids = [];
  // if empty
  if (empty) {
    // create _id(s) and qrcode(s)
    for (let i = 0; i < loadJSON.length; i++) {
      const _id = Random.id();
      _ids.push(_id);

      const url = Meteor.absoluteUrl(`/#/dispense/${name}?_id=${_id}`);
      const promise = QRCode.toDataURL(url);
      promises.push(promise);
    };
  }
  // an empty promises array resolves...
  return Promise.all(promises)
    .then(urls => {
      loadJSON.forEach((obj, idx) => {
        // parse data
        obj[arr].donated = !!obj[arr].donated; // parse boolean

        switch (type) {
          case 'Drugs':
            obj.drugType = obj.drugType.split(','); // parse type
            // obj.lotIds.expire = moment(obj.lotIds.expire).format('YYYY-MM-DD'); // parse date
            obj.lotIds.expire = format(obj.lotIds.expire); // parse date

            break;
          case 'Vaccines':
            obj.visDate = format(obj.visDate); // parse date
            obj.lotIds.expire = format(obj.lotIds.expire); // parse date

            break;
          case 'Supplys':
            obj.isDiscrete = !!obj.isDiscrete;

            break;
          default:
            console.log('No type.')
        };
        // replace the _id and qrcode if either are empty
        if (empty && (!obj[arr]._id && !obj[arr].QRCode)) {
          obj[arr]._id = _ids[idx];
          obj[arr].QRCode = urls[idx];
        }
  
        const target = (type !== 'Vaccines') ?
          collection.findOne({ [name]: obj[name] })
          :
          collection.findOne({ [name]: obj[name], brand: obj.brand });
        // merge on array if name exists
        if (target) {
          obj[arr] = [ ...target[arr], obj[arr] ];
          const data = { [arr]: obj[arr] };
          collection.update(target._id, data);
        } else {
          obj[arr] = [obj[arr]]; // to array
          collection.define(obj);
          count++;
        }
      });

      return count;
    })
    .catch(e => {
      // throw new Error(e);
      return Promise.reject(e);
    });
};

// MM/DD/YYYY to YYYY-MM-DD
const format = (date) => {
  if (!date) {
    return '';
  }

  let d = new Date(date);
  const o = d.getTimezoneOffset();
  d = new Date(d.getTime() - (o * 60 * 1000));

  return d.toISOString().split('T')[0];
};