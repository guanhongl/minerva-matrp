import { Meteor } from 'meteor/meteor';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { MATRP } from './matrp/MATRP';

/**
 * Meteor method used to define new instances of the given collection name.
 * @param collectionName the name of the collection.
 * @param definitionDate the object used in the collection.define method.
 * @memberOf api/base
 */
export const defineMethod = new ValidatedMethod({
  name: 'PendingUserCollection.define',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ collectionName, definitionData }) {
    if (Meteor.isServer) {
      // console.log(collectionName, this.userId, definitionData);
      const collection = MATRP.getCollection(collectionName);
      // collection.assertValidRoleForMethod(this.userId);
      return collection.define(definitionData);
    }
    return '';
  },
});