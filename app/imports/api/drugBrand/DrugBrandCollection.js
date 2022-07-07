import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { _ } from 'meteor/underscore';
// import { Roles } from 'meteor/alanning:roles';
import BaseCollection from '../base/BaseCollection';
import { ROLE } from '../role/Role';
import { Drugs } from '../drug/DrugCollection';

export const drugBrandPublications = {
  drugBrand: 'DrugBrand',
  drugBrandAdmin: 'DrugBrandAdmin',
};

class DrugBrandCollection extends BaseCollection {
  constructor() {
    super('DrugBrands', new SimpleSchema({
      drugBrand: String,
    }));
  }

  /**
   * Defines a new DrugBrand.
   * @param drugBrand.
   * @return {String} the docID of the new document.
   */
  define(drugBrand) {
    const docID = this._collection.insert({
      drugBrand,
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
      // get the DrugBrandCollection instance.
      const instance = this;
      Meteor.publish(drugBrandPublications.drugBrand, function publish() {
        if (this.userId) {
          return instance._collection.find();
        }
        return this.ready();
      });

      Meteor.publish(drugBrandPublications.drugBrandAdmin, function publish() {
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
      return Meteor.subscribe(drugBrandPublications.drugBrand);
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

    return _.pluck(records, "drugBrand").map(record => record.toLowerCase()).includes(option.toLowerCase());
  }

  inUse(option) {
    return !!Drugs.findOne({ lotIds: { $elemMatch: { brand: option } } });
  }

  /**
   * Returns the number of matched documents.
   */
  updateMulti(prev, option, instance) {
    // update this drug brand
    this._collection.update(instance, { $set: { drugBrand: option } });
    // find the matching docs
    const docs = Drugs.find(
      { lotIds: { $elemMatch: { brand: prev } } }, 
      { fields: { lotIds: 1 } },
    ).fetch();
    // console.log(docs);
    // update the matching docs
    if (docs.length) {
      docs.forEach(doc => {
        doc.lotIds.forEach(o => {
          if (o.brand === prev) {
            o.brand = option;
          }
        });
      });
      Drugs.updateMany(docs);
    }
    return docs.length;
  }
}

/**
 * Provides the singleton instance of this class to all other entities.
 */
export const DrugBrands = new DrugBrandCollection();
