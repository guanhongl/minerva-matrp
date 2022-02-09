import { Meteor } from 'meteor/meteor';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
import { ROLE } from './role/Role';
import { MATRP } from './matrp/MATRP';
import { UserProfiles } from './user/UserProfileCollection';

export const acceptMethod = new ValidatedMethod({
  name: 'acceptMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ firstName, lastName, email }) {
    if (Meteor.isServer) {
      console.log(firstName, lastName, email);
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

export const removeUserMethod = new ValidatedMethod({
  name: 'removeUserMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run(userID) {
    if (Meteor.isServer) {
      // Meteor.roleAssignment.remove({ 'user._id': userID });
      Roles.setUserRoles(userID, []);
      Meteor.users.remove({ _id: userID });
    }
    return '';
  },
});

export const updateRoleMethod = new ValidatedMethod({
  name: 'updateRoleMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ userID, role }) {
    if (Meteor.isServer) {
      const loggedInUser = Meteor.user();

      if (!loggedInUser || !Roles.userIsInRole(loggedInUser, ROLE.ADMIN)) {
        throw new Meteor.Error('access-denied', 'Access denied');
      }

      Roles.setUserRoles(userID, [role]);
    }
    return '';
  },
});

export const defineMethod = new ValidatedMethod({
  name: 'BaseProfileCollection.define',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ collectionName, definitionData }) {
    if (Meteor.isServer) {
      const collection = MATRP.getCollection(collectionName);
      // collection.assertValidRoleForMethod(this.userId);
      return collection.defineProfile(definitionData);
    }
    return '';
  },
});
