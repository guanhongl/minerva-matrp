import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { _ } from 'meteor/underscore';
// import { Roles } from 'meteor/alanning:roles';
import BaseCollection from '../base/BaseCollection';
import { ROLE } from '../role/Role';
import { Drugs } from '../drug/DrugCollection';
import { Vaccines } from '../vaccine/VaccineCollection';
import { Supplys } from '../supply/SupplyCollection';

export const locationPublications = {
  location: 'Location',
  locationAdmin: 'LocationAdmin',
};

class LocationCollection extends BaseCollection {
  constructor() {
    super('Locations', new SimpleSchema({
      location: String,
      isOverstock: Boolean,
    }));
  }

  /**
   * Defines a new Location.
   * @param location.
   * @return {String} the docID of the new document.
   */
  define({ location, isOverstock }) {
    const docID = this._collection.insert({
      location,
      isOverstock,
    });
    return docID;
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
   * It publishes the entire collection.
   */
  publish() {
    if (Meteor.isServer) {
      // get the LocationCollection instance.
      const instance = this;
      Meteor.publish(locationPublications.location, function publish() {
        if (this.userId) {
          return instance._collection.find();
        }
        return this.ready();
      });

      Meteor.publish(locationPublications.locationAdmin, function publish() {
        if (this.userId) {
          return instance._collection.find();
        }
        return this.ready();
      });
    }
  }

  /**
   * Subscribe to the entire collection.
   */
  subscribe() {
    if (Meteor.isClient) {
      return Meteor.subscribe(locationPublications.location);
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
    this.assertRole(userId, [ROLE.ADMIN]);
  }

  /**
   * case insensitive query
   * @param {*} option 
   */
  hasOption(prev, option) {
    const curRe = new RegExp(`^${option}$`, "i");
    const curRecord = this._collection.findOne({ drugBrand: { $regex: curRe } });

    if (prev === null) {
      return !!curRecord;
    }
    if (!curRecord) {
      return false;
    }

    const prevRe = new RegExp(`^${prev}$`, "i");
    const prevRecord = this._collection.findOne({ drugBrand: { $regex: prevRe } });

    return prevRecord._id !== curRecord._id;
  }

  inUse(option) {
    return (
      !!Drugs.findOne({ lotIds: { $elemMatch: { location: option } } }) ||
      !!Vaccines.findOne({ lotIds: { $elemMatch: { location: option } } }) ||
      !!Supplys.findOne({ stock: { $elemMatch: { location: option } } })
    );
  }

  /**
   * Returns the number of matched documents.
   */
  updateMulti(prev, { location, isOverstock }, instance) {
    // update this location
    this._collection.update(instance, { $set: { location, isOverstock } });
    // find the matching docs
    const drugDocs = Drugs.find(
      { lotIds: { $elemMatch: { location: prev } } }, 
      { fields: { lotIds: 1 } },
    ).fetch();
    const vaccineDocs = Vaccines.find(
      { lotIds: { $elemMatch: { location: prev } } }, 
      { fields: { lotIds: 1 } },
    ).fetch();
    const supplyDocs = Supplys.find(
      { stock: { $elemMatch: { location: prev } } }, 
      { fields: { stock: 1 } },
    ).fetch();
    // update the matching docs
    if (drugDocs.length) {
      drugDocs.forEach(doc => {
        doc.lotIds.forEach(o => {
          if (o.location === prev) {
            o.location = location;
          }
        });
      });
      Drugs.updateMany(drugDocs);
    }
    if (vaccineDocs.length) {
      vaccineDocs.forEach(doc => {
        doc.lotIds.forEach(o => {
          if (o.location === prev) {
            o.location = location;
          }
        });
      });
      Vaccines.updateMany(vaccineDocs);
    }
    if (supplyDocs.length) {
      supplyDocs.forEach(doc => {
        doc.stock.forEach(o => {
          if (o.location === prev) {
            o.location = location;
          }
        });
      });
      Supplys.updateMany(supplyDocs);
    }

    return drugDocs.length + vaccineDocs.length + supplyDocs.length;
  }
}

/**
 * Provides the singleton instance of this class to all other entities.
 */
export const Locations = new LocationCollection();
