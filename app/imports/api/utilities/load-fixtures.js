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
  let retVal = '';
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

  // TEMPORARY
  // collection._collection.remove({});

  if (collection.count() === 0) {
    const promises = [];
    const _ids = [];

    // create _id(s) and qrcode(s)
    for (let i = 0; i < loadJSON.length; i++) {
      const _id = Random.id();
      _ids.push(_id);

      const url = Meteor.absoluteUrl(`/#/dispense?tab=0&_id=${_id}`);
      const promise = QRCode.toDataURL(url);
      promises.push(promise);
    };

    Promise.all(promises)
      .then(urls => {
        loadJSON.forEach((obj, idx) => {
          obj.drugType = obj.drugType.split(','); // parse type
          // obj.lotIds.expire = moment(obj.lotIds.expire).format('YYYY-MM-DD'); // parse date
          obj.lotIds.expire = format(obj.lotIds.expire); // parse date

          obj.lotIds._id = _ids[idx];
          obj.lotIds.QRCode = urls[idx];
    
          const target = collection.findOne({ drug: obj.drug });
          // merge on array if name exists
          if (target) {
            obj.lotIds = [ ...target.lotIds, obj.lotIds ];
            const data = { lotIds: obj.lotIds };
            collection.update(target._id, data);
          } else {
            obj.lotIds = [obj.lotIds]; // to array
            collection.define(obj);
          }
        });
      })
      .catch(e => {
        console.log(e);
      });

    // loadJSON.forEach(obj => {
    //   obj.drugType = obj.drugType.split(','); // parse type
    //   obj.lotIds.expire = moment(obj.lotIds.expire).format('YYYY-MM-DD'); // parse date
    //   // create _id and URL
    //   const _id = Random.id();
    //   obj.lotIds._id = _id;
    //   const URL = Meteor.absoluteUrl(`/#/dispense?tab=0&_id=${_id}`);

    //   const target = collection.findOne({ drug: obj.drug });
    //   QRCode.toDataURL(URL)
    //   .then(url => {
    //     obj.lotIds.QRCode = url;

    //     // merge on array if name exists
    //     if (target) {
    //       obj.lotIds = [ ...target.lotIds, obj.lotIds ];
    //       const data = { lotIds: obj.lotIds };
    //       collection.update(target._id, data);
    //     } else {
    //       obj.lotIds = [obj.lotIds]; // to array
    //       collection.define(obj);
    //     }
    //   })
    //   .catch(e => {
    //     console.log(e);
    //   });
    // });
  }
  // count += collection.count();

  if (count > 1) {
    retVal += `Defined ${count} ${type}s`;
  } else if (count === 1) {
    retVal += `Defined a ${type}`;
  }
  if (printToConsole) {
    console.log(retVal);
  }
  return retVal;
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