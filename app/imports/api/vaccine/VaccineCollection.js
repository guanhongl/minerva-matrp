import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { _ } from 'meteor/underscore';
import { Roles } from 'meteor/alanning:roles';
import BaseCollection from '../base/BaseCollection';
import { ROLE } from '../role/Role';

export const vaccinePublications = {
  vaccine: 'Vaccine',
  vaccineLots: 'VaccineLots',
};

class VaccineCollection extends BaseCollection {
  constructor() {
    super('Vaccines', new SimpleSchema({
      vaccine: String,
      // is vaccineType needed?
      minQuantity: Number,
      visDate: String, // the latest vaccine information statement date
      lotIds: Array,
      'lotIds.$': Object,
      'lotIds.$._id': String,
      'lotIds.$.lotId': String,
      'lotIds.$.brand': String, // the manufacturer (e.g. Pfizer)
      'lotIds.$.expire': { // date string "YYYY-MM-DD"
        type: String,
        optional: true,
      },
      'lotIds.$.location': Array,
      'lotIds.$.location.$': String,
      'lotIds.$.quantity': Number, // the number of doses
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
   * Defines a new Vaccine item.
   * @return {String} the docID of the new document.
   */
  define({ vaccine, minQuantity, visDate, lotIds }) {
    const docID = this._collection.insert({
      vaccine, minQuantity, visDate, lotIds,
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

    addString('vaccine');
    addNumber('minQuantity');
    addString('visDate');
    if (Array.isArray(data.lotIds) && 
      data.lotIds.every(o => (
        _.isObject(o) &&
        o._id &&
        o.lotId &&
        o.brand &&
        _.isNumber(o.quantity) &&
        // check if location is array AND every location is not undefined
        Array.isArray(o.location) &&
        o.location.every(e => e) &&
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
  removeIt(lotId, userId) {
    if (userId) {
      super.assertValidRoleForMethod(userId);
    }
    // if (!Roles.userIsInRole(this.userId, [ROLE.ADMIN])) {
    //   throw new Meteor.Error('unauthorized', 'You must be an admin to remove.');
    // }

    const doc = this.findDoc(lotId);
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
      // get the VaccineCollection instance.
      const instance = this;
      Meteor.publish(vaccinePublications.vaccine, function publish() {
        if (this.userId) {
          // const username = Meteor.users.findOne(this.userId).username;
          return instance._collection.find();
        }
        return this.ready();
      });

      Meteor.publish(vaccinePublications.vaccineLots, function publish() {
        if (this.userId) {
          // return instance._collection.find({}, { fields: { "lotIds.lotId": 1 } });
          return instance._collection.find({}, { fields: { vaccine: 1, "lotIds.lotId": 1, "lotIds._id": 1 } });
        }
        return this.ready();
      });
    }
  }

  /**
   * Subscription Vaccine method for users.
   */
  subscribeVaccine() {
    if (Meteor.isClient) {
      return Meteor.subscribe(vaccinePublications.vaccine);
    }
    return null;
  }

  /**
   * Subscription method for admin users.
   * It subscribes to the entire collection.
   */
  subscribeVaccineLots() {
    if (Meteor.isClient) {
      return Meteor.subscribe(vaccinePublications.vaccineLots);
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
    const vaccine = doc.vaccine;
    const minQuantity = doc.minQuantity;
    const visDate = doc.visDate;
    const lotIds = doc.lotIds;
    return { vaccine, minQuantity, visDate, lotIds };
  }
}

/**
 * Provides the singleton instance of this class to all other entities.
 */
export const Vaccines = new VaccineCollection();
