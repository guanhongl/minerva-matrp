import { Meteor } from 'meteor/meteor';
import { MATRP } from '../../api/matrp/MATRP';
import { Roles } from 'meteor/alanning:roles';

// Call publish for all the collections.
MATRP.collections.forEach(c => c.publish());

// alanning:roles publication
// Recommended code to publish roles for each user.
Meteor.publish(null, function () {
  if (this.userId) {
    return Meteor.roleAssignment.find({ 'user._id': this.userId });
  }
  return this.ready();
});

Meteor.publish("waitlist", function () {
  if (this.userId && Roles.userIsInRole(this.userId, "ADMIN")) {
    return Meteor.users.find({}, { fields: { services: 1 } });
  }
  return this.ready();
});