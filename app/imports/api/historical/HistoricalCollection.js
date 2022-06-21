import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
// import { _ } from 'meteor/underscore';
// import { Roles } from 'meteor/alanning:roles';
import BaseCollection from '../base/BaseCollection';
import { ROLE } from '../role/Role';

export const historicalPublications = {
  historical: 'Historical;',
  historicalAdmin: 'HistoricalAdmin',
};

export const inventoryTypes = ['Drug', 'Vaccine', 'Supply'];
export const dispenseTypes = ['Patient Use', 'Broken', 'Lost', 'Contaminated', 'Expired', 'Inventory'];
export const Schemas = {};
// Drug Schema
Schemas.Drug = new SimpleSchema({
  inventoryType: {
    type: String,
    allowedValues: inventoryTypes,
  },
  dispenseType: {
    type: String,
    allowedValues: dispenseTypes,
  },
  dateDispensed: Date,
  dispensedFrom: String,
  dispensedTo: String,
  site: String,
  note: {
    type: String,
    optional: true,
  },
  element: Array,
  'element.$': Object,
  'element.$.name': String,
  'element.$.unit': String,
  'element.$.lotId': String,
  'element.$.brand': String,
  'element.$.expire': { // date string "YYYY-MM-DD"
    type: String,
    optional: true,
  },
  'element.$.quantity': Number,
  'element.$.donated': Boolean,
  'element.$.donatedBy': {
    type: String,
    optional: true,
  },
});
// Vaccine Schema
Schemas.Vaccine = new SimpleSchema({
  inventoryType: {
    type: String,
    allowedValues: inventoryTypes,
  },
  dispenseType: {
    type: String,
    allowedValues: dispenseTypes,
  },
  dateDispensed: Date,
  dispensedFrom: String,
  dispensedTo: String,
  site: String,
  note: {
    type: String,
    optional: true,
  },
  element: Array,
  'element.$': Object,
  'element.$.name': String,
  'element.$.lotId': String,
  'element.$.brand': String,
  'element.$.expire': String,
  'element.$.dose': Number,
  'element.$.visDate': String,
});
// Supply Schema
Schemas.Supply = new SimpleSchema({
  inventoryType: {
    type: String,
    allowedValues: inventoryTypes,
  },
  dispenseType: {
    type: String,
    allowedValues: dispenseTypes,
  },
  dateDispensed: Date,
  dispensedFrom: String,
  dispensedTo: String,
  site: String,
  note: {
    type: String,
    optional: true,
  },
  element: Array,
  'element.$': Object,
  'element.$.name': String,
  'element.$.supplyType': String,
  'element.$.quantity': Number,
  'element.$.donated': Boolean,
  'element.$.donatedBy': {
    type: String,
    optional: true,
  },
});

class HistoricalCollection extends BaseCollection {
  constructor() {
    super('Historicals', Schemas, true);
  }

  /**
   * Defines a new Dispensed item.
   * @param name the name of the item.
   * @param quantity how many.
   * @param owner the owner of the item.
   * @return {String} the docID of the new document.
   */
  define({ inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, note, element }) {
    // console.log(inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, note, element);
    const docID = this._collection.insert({
      inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, note, element,
    });
    return docID;
  }

  /**
   * A stricter form of remove that throws an error if the document or docID could not be found in this collection.
   * @param { String | Object } name A document or docID in this collection.
   * @returns true
   */
  removeIt(lotId) {
    const doc = this.findDoc(lotId);
    check(doc, Object);
    this._collection.remove(doc._id);
    return true;
  }

  /**
   * Default publication method for entities.
   * It publishes the entire collection for admin and just the historical associated to an owner.
   */
  publish() {
    if (Meteor.isServer) {
      // get the HistoricalCollection instance.
      const instance = this;
      /** This subscription publishes only the documents associated with the logged in user */
      Meteor.publish(historicalPublications.historical, function publish() {
        if (this.userId) {
          // const username = Meteor.users.findOne(this.userId).username;
          return instance._collection.find();
        }
        return this.ready();
      });

      /** This subscription publishes all documents regardless of user, but only if the logged in user is the Admin. */
      Meteor.publish(historicalPublications.historicalAdmin, function publish() {
        if (this.userId) {
          return instance._collection.find();
        }
        return this.ready();
      });
    }
  }

  /**
   * Subscription method for medication owned by the current user.
   */
  subscribeHistorical() {
    if (Meteor.isClient) {
      return Meteor.subscribe(historicalPublications.historical);
    }
    return null;
  }

  /**
   * Subscription method for admin users.
   * It subscribes to the entire collection.
   */
  subscribeHistoricalAdmin() {
    if (Meteor.isClient) {
      return Meteor.subscribe(historicalPublications.historicalAdmin);
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
}

/**
 * Provides the singleton instance of this class to all other entities.
 */
export const Historicals = new HistoricalCollection();
