import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { _ } from 'meteor/underscore';
import { Roles } from 'meteor/alanning:roles';
import BaseCollection from '../base/BaseCollection';
import { ROLE } from '../role/Role';

// export const allowedUnits = ['bottle(s)', 'g', 'mL', 'tab(s)'];
export const drugPublications = {
  drug: 'Drug',
  drugLots: 'DrugLots',
  drugStock: 'DrugStock',
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
        // allowedValues: allowedUnits,
      },
      lotIds: Array,
      'lotIds.$': Object,
      'lotIds.$._id': String,
      'lotIds.$.lotId': String,
      'lotIds.$.brand': {
        type: String,
        optional: true,
      },
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

    addString('drug');
    // check if drugType is array AND every drugType is not undefined
    if (Array.isArray(data.drugType) && data.drugType.every(e => e)) {
      updateData.drugType = data.drugType;
    }
    addNumber('minQuantity');
    addString('unit');
    if (Array.isArray(data.lotIds) && 
      data.lotIds.every(o => (
        _.isObject(o) &&
        o._id &&
        o.lotId &&
        _.isNumber(o.quantity) &&
        o.location &&
        _.isBoolean(o.donated)
      ))
    ) {
      updateData.lotIds = data.lotIds;
    }

    this._collection.update(docID, { $set: updateData });
  }

  /**
   * A stricter form of remove that throws an error if the document or docID could not be found in this collection.
   * @param { String | Object } name A document or docID in this collection.
   * @returns true
   */
  removeIt(name, userId) {
    if (userId) {
      super.assertValidRoleForMethod(userId);
    }
    // if (!Roles.userIsInRole(this.userId, [ROLE.ADMIN])) {
    //   throw new Meteor.Error('unauthorized', 'You must be an admin to remove.');
    // }

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

      /**
       * https://docs.meteor.com/api/pubsub.html#Meteor-subscribe
       * If multiple publications publish a document with the same _id for the same collection the documents are merged for the client. 
       * If the values of any of the top level fields conflict, the resulting value will be one of the published values, chosen arbitrarily.
       */
      Meteor.publish(drugPublications.drugStock, function publish() {
        if (this.userId) {
          return instance._collection.find({}, { fields: { minQuantity: 1, "lotIds.quantity": 1, "lotIds.expire": 1 } });
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
   * Subscription method for lots.
   * It subscribes to the lots.
   */
  subscribeDrugLots() {
    if (Meteor.isClient) {
      return Meteor.subscribe(drugPublications.drugLots);
    }
    return null;
  }

  /**
   * Subscription method for quantities.
   * It subscribes to the minimum quantities and the quantities.
   */
  subscribeDrugStock() {
    if (Meteor.isClient) {
      return Meteor.subscribe(drugPublications.drugStock);
    }
    return null;
  }

  /**
   * Default implementation of assertValidRoleForMethod. Asserts that userId is logged in as an Admin or User.
   * This is used in the define, update, and removeIt Meteor methods associated with each class.
   * @param userId The userId of the logged in user. Can be null or undefined
   * @throws { Meteor.Error } If there is no logged in user, or the user is not an Admin or User.
   */
  assertValidRoleForMethod(userId, parent = false) {
    if (parent) {
      return super.assertValidRoleForMethod(userId);
    }

    this.assertRole(userId, [ROLE.ADMIN, ROLE.USER, ROLE.SUPERUSER]);
  }

  /**
   * Returns an object representing the definition of docID in a format appropriate to the restoreOne or define function.
   */
   dumpOne(docID) {
    // const doc = this.findDoc(docID);
    const doc = docID;
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
