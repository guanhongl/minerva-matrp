import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { _ } from 'meteor/underscore';
// import { Roles } from 'meteor/alanning:roles';
import BaseCollection from '../base/BaseCollection';
import { ROLE } from '../role/Role';
import { Vaccines } from '../vaccine/VaccineCollection';

export const vaccineBrandPublications = {
  vaccineBrand: 'VaccineBrand',
  vaccineBrandAdmin: 'VaccineBrandAdmin',
};

class VaccineBrandCollection extends BaseCollection {
  constructor() {
    super('VaccineBrands', new SimpleSchema({
      vaccineBrand: String,
    }));
  }

  /**
   * Defines a new VaccineBrand.
   * @param vaccineBrand.
   * @return {String} the docID of the new document.
   */
  define(vaccineBrand) {
    const docID = this._collection.insert({
      vaccineBrand,
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
      // get the VaccineBrandCollection instance.
      const instance = this;
      Meteor.publish(vaccineBrandPublications.vaccineBrand, function publish() {
        if (this.userId) {
          return instance._collection.find();
        }
        return this.ready();
      });

      Meteor.publish(vaccineBrandPublications.vaccineBrandAdmin, function publish() {
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
      return Meteor.subscribe(vaccineBrandPublications.vaccineBrand);
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
  hasOption(option) {
    const records = this._collection.find().fetch();

    return _.pluck(records, "vaccineBrand").map(record => record.toLowerCase()).includes(option.toLowerCase());
  }

  inUse(option) {
    return !!Vaccines.findOne({ brand: option });
  }

  /**
   * Returns the number of matched documents.
   */
  updateMulti(prev, option, instance) {
    // update this vaccine brand
    this._collection.update(instance, { $set: { vaccineBrand: option } });
    // find the matching docs
    const docs = Vaccines.find({ brand: prev }, { fields: { brand: 1 } }).fetch();
    // console.log(docs);
    // update the matching docs
    if (docs.length) {
      return Vaccines._collection.update(
        { _id: { $in: _.pluck(docs, "_id") } },
        { $set: { brand: option } },
        { multi: true },
      );
    }
    return 0;
  }
}

/**
 * Provides the singleton instance of this class to all other entities.
 */
export const VaccineBrands = new VaccineBrandCollection();
