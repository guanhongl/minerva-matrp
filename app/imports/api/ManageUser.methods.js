import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
import { ROLE } from './role/Role';
import { UserProfiles } from './user/UserProfileCollection';

/**
 * Meteor method used to define new instances of the given collection name.
 * @param collectionName the name of the collection.
 * @param definitionDate the object used in the collection.define method.
 * @memberOf api/base
 */
// export const defineMethod = new ValidatedMethod({
//   name: 'PendingUserCollection.define',
//   mixins: [CallPromiseMixin],
//   validate: null,
//   run({ collectionName, definitionData }) {
//     if (Meteor.isServer) {
//       // console.log(collectionName, this.userId, definitionData);
//       const collection = MATRP.getCollection(collectionName);
//       // collection.assertValidRoleForMethod(this.userId);
//       return collection.define(definitionData);
//     }
//     return '';
//   },
// });

// TODO: edit email format
export const acceptMethod = new ValidatedMethod({
  name: 'acceptMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ firstName, lastName, email }) {
    if (Meteor.isServer) {
      console.log(firstName, lastName, email)
      const userID = Accounts.createUser({ username: email, email: email });
      Accounts.sendEnrollmentEmail(userID);

      const role = ROLE.USER; // default to USER for now
      UserProfiles._collection.insert({ email, firstName, lastName, userID, role });
      Roles.addUsersToRoles(userID, [role]);

      return userID;
    }
    return '';
  },
});