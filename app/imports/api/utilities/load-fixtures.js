import _ from 'lodash';
import moment from 'moment';
import { Random } from 'meteor/random';
import QRCode from 'qrcode';
import { Meteor } from 'meteor/meteor'

/**
 * Returns the definition array associated with collectionName in the loadJSON structure,
 * or an empty array if none was found.
 * @param loadJSON The load file contents.
 * @param collection The collection of interest.
 * @memberOf api/test
 */
export const getDefinitions = (loadJSON, collection) => {
  const definitionObj = _.find(loadJSON.collections, (obj) => obj.name === collection);
  return definitionObj ? definitionObj.contents : [];
};

export const loadCollectionNewDataOnly = (collection, loadJSON, printToConsole) => {
  // let retVal = '';
  // console.log('loadCollectionNewDataOnly', loadJSON, printToConsole, typeof collection);
  const type = collection.getType();
  // const definitions = getDefinitions(loadJSON, collection.getCollectionName());
  let count = 0;
  // definitions.forEach((definition) => {
  //   if (collection.find(definition).count() === 0) {
  //     collection.define(definition);
  //     count++;
  //   }
  // });

  if (collection.count() !== 0) {
    throw new Meteor.Error('The database is not empty. Try resetting the database.');
  }

  if (collection.count() === 0) {
    let tab, name, arr;
    switch (type) {
      case 'Drugs':
        tab = '0';
        name = 'drug';
        arr = 'lotIds';
        break;
      case 'Vaccines':
        tab = '1';
        name = 'vaccine';
        arr = 'lotIds';
        break;
      case 'Supplys':
        tab = '2';
        name = 'supply';
        arr = 'stock';
        break;
      default:
        console.log('No type.')
    };

    const promises = [];
    const _ids = [];

    // create _id(s) and qrcode(s)
    for (let i = 0; i < loadJSON.length; i++) {
      const _id = Random.id();
      _ids.push(_id);

      const url = Meteor.absoluteUrl(`/#/dispense?tab=${tab}&_id=${_id}`);
      const promise = QRCode.toDataURL(url);
      promises.push(promise);
    };

    return Promise.all(promises)
      .then(urls => {
        loadJSON.forEach((obj, idx) => {
          // parse data
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
              break;
            default:
              console.log('No type.')
          };

          if (!obj[arr]._id && !obj[arr].QRCode) {
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
        console.log(e);
      });
  }

  // if (count > 1) {
  //   retVal += `Defined ${count} ${type}s`;
  // } else if (count === 1) {
  //   retVal += `Defined a ${type}`;
  // }
  // if (printToConsole) {
  //   console.log(retVal);
  // }
  // return retVal;
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