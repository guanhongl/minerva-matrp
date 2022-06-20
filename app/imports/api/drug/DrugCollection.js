import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { _ } from 'meteor/underscore';
// import { Roles } from 'meteor/alanning:roles';
import BaseCollection from '../base/BaseCollection';
import { ROLE } from '../role/Role';

export const allowedUnits = ['bottle(s)', 'g', 'mL', 'tab(s)'];
export const drugPublications = {
  drug: 'Drug',
  drugLots: 'DrugLots',
};

class DrugCollection extends BaseCollection {
  constructor() {
    super('Drugs', new SimpleSchema({
      drug: String,
      drugType: Array,
      'drugType.$': String,
      minQuantity: Number,
      unit: {
        type: String,
        allowedValues: allowedUnits,
      },
      lotIds: Array,
      'lotIds.$': Object,
      'lotIds.$._id': String,
      'lotIds.$.lotId': String,
      'lotIds.$.brand': String,
      'lotIds.$.expire': { // date string "YYYY-MM-DD"
        type: String,
        optional: true,
      },
      'lotIds.$.location': String,
      'lotIds.$.quantity': Number,
      'lotIds.$.donated': Boolean,
      'lotIds.$.donatedBy': {
        type: String,
        optional: true,
      },
      'lotIds.$.note': {
        type: String,
        optional: true,
      },
      'lotIds.$.QRCode' : {
        type: String,
        optional: true,
      },
    }));
  }

  /**
   * Defines a new Drug item.
   * @return {String} the docID of the new document.
   */
  define({ drug, drugType, minQuantity, unit, lotIds }) {
    // const docID = this._collection.insert({
    //   drug, drugType, brand, lotId, expire, minQuantity, quantity, isTabs, location, donated, note,
    // });
    const docID = this._collection.insert({
      drug, drugType, minQuantity, unit, lotIds,
    });
    return docID;
  }

  /**
   * Updates the given document.
   * @param docID the id of the document to update.
   * @param data the unfiltered updateData object.
   */
  update(docID, data) {
    const updateData = {};

    function addString(name) {
      if (data[name]) { // if not undefined or empty String
        updateData[name] = data[name];
      }
    }
    function addNumber(name) { // if not undefined
      if (_.isNumber(data[name])) {
        updateData[name] = data[name];
      }
    }
    // function addBoolean(name) { // if not undefined
    //   if (_.isBoolean(data[name])) {
    //     updateData[name] = data[name];
    //   }
    // }

    addString('drug');
    // check if drugType is not undefined && every drug type is not undefined
    if (data.drugType && data.drugType.every(elem => elem)) {
      updateData.drugType = data.drugType;
    }
    addNumber('minQuantity');
    addString('unit');
    if (data.lotIds && data.lotIds.every(lotId => (
      _.isObject(lotId) &&
      lotId._id &&
      lotId.lotId &&
      lotId.brand &&
      _.isNumber(lotId.quantity) &&
      lotId.location &&
      _.isBoolean(lotId.donated)
    ))) {
      updateData.lotIds = data.lotIds;
    }

    this._collection.update(docID, { $set: updateData });
  }

  /**
   * A stricter form of remove that throws an error if the document or docID could not be found in this collection.
   * @param { String | Object } name A document or docID in this collection.
   * @returns true
   */
  removeIt(name) {
    const doc = this.findDoc(name);
    check(doc, Object);
    this._collection.remove(doc._id);
    return true;
  }

  /**
   * Default publication method for entities.
   * It publishes the entire collection for admin and to users.
   */
  publish() {
    if (Meteor.isServer) {
      // get the DrugCollection instance.
      const instance = this;
      Meteor.publish(drugPublications.drug, function publish() {
        if (this.userId) {
          // const username = Meteor.users.findOne(this.userId).username;
          return instance._collection.find();
        }
        return this.ready();
      });

      Meteor.publish(drugPublications.drugLots, function publish() {
        if (this.userId) {
          return instance._collection.find({}, { fields: { "lotIds.lotId": 1 } });
        }
        return this.ready();
      });
    }
  }

  /**
   * Subscription method for users.
   */
  subscribeDrug() {
    if (Meteor.isClient) {
      return Meteor.subscribe(drugPublications.drug);
    }
    return null;
  }

  /**
   * Subscription method for admin users.
   * It subscribes to the entire collection.
   */
  subscribeDrugLots() {
    if (Meteor.isClient) {
      return Meteor.subscribe(drugPublications.drugLots);
    }
    return null;
  }

  /**
   * Default implementation of assertValidRoleForMethod. Asserts that userId is logged in as an Admin or User.
   * This is used in the define, update, and removeIt Meteor methods associated with each class.
   * @param userId The userId of the logged in user. Can be null or undefined
   * @throws { Meteor.Error } If there is no logged in user, or the user is not an Admin or User.
   */
  assertValidRoleForMethod(userId) {
    this.assertRole(userId, [ROLE.ADMIN, ROLE.USER, ROLE.SUPERUSER]);
  }

  /**
   * Returns an object representing the definition of docID in a format appropriate to the restoreOne or define function.
   */
   dumpOne(docID) {
    const doc = this.findDoc(docID);
    const drug = doc.drug;
    const drugType = doc.drugType.join();
    const minQuantity = doc.minQuantity;
    const unit = doc.unit;
    const lotIds = doc.lotIds;
    return { drug, drugType, minQuantity, unit, lotIds };
  }
}

/**
 * Provides the singleton instance of this class to all other entities.
 */
export const Drugs = new DrugCollection();
